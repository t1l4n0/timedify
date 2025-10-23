/**
 * Timedify Controller - Cross-Section Timing with FOUC Prevention
 * 
 * Features:
 * - Marker-Pairing: Range-Key-Matching (explicit) + DOM-Order-Fallback (zero-touch migration)
 * - Target-Detection: Target-Selectors (explicit) + Auto-Collection between Start/End
 * - Pending-Phase: Immediately set data-timedify-pending on all targets
 * - Timing-Check: Validation via data-start-datetime / data-end-datetime (German date format: DD.MM.YYYY HH:MM)
 * - Visibility-Toggle: Set/remove data-timedify-hidden based on active/inactive
 * - Ready-Phase: Remove data-timedify-pending, set data-timedify-ready → smooth fade
 * - MutationObserver (light): Only for late-loaded sections (Theme-Lazy-Load)
 */

(function() {
  'use strict';
  
  // Prevent multiple initialization
  if (window.__timedifyInited) return;
  window.__timedifyInited = true;

  // Debug logging toggle via window.__timedifyDebug
  const DEBUG = !!window.__timedifyDebug;
  function debug(...args) {
    if (DEBUG) console.log(...args);
  }

  // Parse German date format (DD.MM.YYYY HH:MM)
  function parseGermanDate(value) {
    if (!value) return null;
    
    try {
      const parts = value.trim().split(' ');
      if (parts.length !== 2) return null;
      
      const datePart = parts[0];
      const timePart = parts[1];
      
      const dateMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!dateMatch) return null;
      
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-based
      const year = parseInt(dateMatch[3], 10);
      
      const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) return null;
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      return new Date(year, month, day, hours, minutes);
    } catch (e) {
      return null;
    }
  }

  // Broad selector for Shopify blocks
  const BLOCK_SELECTOR = '.shopify-block, [id^="shopify-block-"], [data-block-id]';

  // Compute if content should be active based on start/end times
  function computeActive(startEl, endEl) {
    const startAttr = (startEl.getAttribute('data-start-datetime') || '').trim();
    const endAttr = (endEl.getAttribute('data-end-datetime') || '').trim();

    const parsedStart = startAttr ? parseGermanDate(startAttr) : null;
    const parsedEnd = endAttr ? parseGermanDate(endAttr) : null;

    // Tolerant handling: missing start = -Infinity, missing end = +Infinity
    const effectiveStart = parsedStart || new Date(0);
    const effectiveEnd = parsedEnd || new Date(8640000000000000);

    const now = new Date();
    const isActive = now >= effectiveStart && now <= effectiveEnd;
    return isActive;
  }

  // Find the nearest end marker following the start block.
  // 1) Prefer an end marker in the SAME section after the start block (range-key first)
  // 2) Fallback: first end marker in subsequent sections (range-key if provided, else any)
  function findNextEndMarker(startEl) {
    const startSection = startEl.closest('.shopify-section');
    if (!startSection) return null;

    const rangeKey = startEl.getAttribute('data-range-key');

    // 1a) Same-section scan with range-key (only end markers that come AFTER startEl)
    if (rangeKey) {
      const sameSectionEndsWithKey = Array.from(startSection.querySelectorAll('[data-end-datetime]'));
      for (const endEl of sameSectionEndsWithKey) {
        if (endEl.getAttribute('data-range-key') === rangeKey) {
          const rel = startEl.compareDocumentPosition(endEl);
          const isFollowing = (rel & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
          if (isFollowing) {
            return endEl;
          }
        }
      }
    }

    // 1b) Same-section scan without range-key (only end markers that come AFTER startEl)
    const sameSectionEnds = Array.from(startSection.querySelectorAll('[data-end-datetime]'));
    for (const endEl of sameSectionEnds) {
      const rel = startEl.compareDocumentPosition(endEl);
      const isFollowing = (rel & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      if (isFollowing && (!rangeKey || !endEl.hasAttribute('data-range-key'))) {
        return endEl;
      }
    }

    // 2) Fallback: search in subsequent sections
    const allSections = Array.from(document.querySelectorAll('.shopify-section'));
    const startIndex = allSections.indexOf(startSection);
    if (startIndex === -1) return null;

    for (let i = startIndex + 1; i < allSections.length; i++) {
      const endCandidates = Array.from(allSections[i].querySelectorAll('[data-end-datetime]'));
      if (rangeKey) {
        const matchWithKey = endCandidates.find(el => el.getAttribute('data-range-key') === rangeKey);
        if (matchWithKey) return matchWithKey;
      }
      const anyEnd = endCandidates.find(el => !rangeKey || !el.hasAttribute('data-range-key'));
      if (anyEnd) return anyEnd;
    }

    return null;
  }

  // Check if start and end blocks are in single-section setup
  function checkIfSingleSection(startEl, endEl) {
    if (!startEl || !endEl) return false;
    
    const startSection = startEl.closest('.shopify-section');
    const endSection = endEl.closest('.shopify-section');
    
    if (!startSection || !endSection) return false;
    
    // Single-section only if they are in the EXACT same section
    return startSection === endSection;
  }

  // Collect sections between start and end blocks
  function collectSectionsBetween(startEl, endEl) {
    if (!startEl || !endEl) return [];

    const sections = [];
    const startSection = startEl.closest('.shopify-section');
    const endSection = endEl.closest('.shopify-section');
    
    if (!startSection || !endSection) return [];

    // Find all .shopify-section elements between start and end
    const allSections = document.querySelectorAll('.shopify-section');
    let capturing = false;
    
    for (let i = 0; i < allSections.length; i++) {
      const section = allSections[i];
      
      if (section === startSection) {
        capturing = true;
        continue; // Don't include the start section itself
      }
      
      if (section === endSection) {
        break; // Stop at end section (don't include it)
      }
      
      if (capturing) {
        sections.push(section);
      }
    }
    
    return sections;
  }

  // Apply visibility state to elements (sections or blocks)
  function applyVisibility(elements, isActive) {
    debug('Timedify: applyVisibility called with', elements.length, 'elements, isActive:', isActive);
    
    // In Theme Editor: always show content
    if (window.Shopify && window.Shopify.designMode) {
      debug('Timedify: In design mode - showing all content');
      elements.forEach(element => {
        if (!element || !element.classList) return;
        element.removeAttribute('data-timedify-hidden');
        element.removeAttribute('data-timedify-pending');
        element.dataset.timedifyReady = 'true';
        element.removeAttribute('aria-hidden');
        debug('Timedify: Design mode - showing element:', element.id || element.className);
      });
      return;
    }
    
    // Live Storefront: apply timing logic
    elements.forEach(element => {
      if (!element || !element.classList) {
        console.warn('Timedify: Invalid element in applyVisibility:', element);
        return;
      }
      
      try {
        if (isActive) {
          // Keep CSS override compatible with `[data-timedify-range] { display:none }`
          element.dataset.timedifyHidden = 'false';
          element.removeAttribute('aria-hidden');
          debug('Timedify: Showing element:', element.id || element.className);
        } else {
          element.dataset.timedifyHidden = 'true';
          element.setAttribute('aria-hidden', 'true');
          debug('Timedify: Hiding element:', element.id || element.className);
        }
        
        // Transition to ready state
        element.removeAttribute('data-timedify-pending');
        element.dataset.timedifyReady = 'true';
      } catch (e) {
        console.error('TimedController: Error applying visibility to element:', element.id || element.className, e);
      }
    });
  }

  // Collect blocks between start and end for single-section setup
  function collectBlocksBetween(startEl, endEl) {
    if (!startEl || !endEl) {
      console.warn('Timedify: collectBlocksBetween - missing start or end element');
      return [];
    }
    
    // Find the parent block wrapper elements
    const startBlock = startEl.closest(BLOCK_SELECTOR);
    const endBlock = endEl.closest(BLOCK_SELECTOR);
    
    if (!startBlock || !endBlock) {
      console.warn('Timedify: collectBlocksBetween - could not find parent blocks');
      return [];
    }
    
    // Get the parent section
    const parentSection = startBlock.closest('.shopify-section');
    
    if (!parentSection) {
      console.warn('Timedify: collectBlocksBetween - could not find parent section');
      return [];
    }
    
    debug('Timedify: collectBlocksBetween - startBlock:', startBlock.id, 'endBlock:', endBlock.id, 'in section:', parentSection.id);
    
    const blocks = [];
    // Only get blocks from the SAME section in DOM order
    const sectionBlocks = parentSection.querySelectorAll(BLOCK_SELECTOR);
    let capturing2 = false;
    
    debug('Timedify: collectBlocksBetween - found', sectionBlocks.length, 'blocks in section');
    
    for (let i = 0; i < sectionBlocks.length; i++) {
      const block = sectionBlocks[i];
      
      // Start capturing after the start block
      if (block === startBlock) {
        capturing2 = true;
        debug('Timedify: collectBlocksBetween - found start block, starting capture');
        continue; // Don't include the start block itself
      }
      
      // Stop capturing at the end block
      if (block === endBlock) {
        debug('Timedify: collectBlocksBetween - found end block, stopping capture');
        break; // Stop at end block (don't include it)
      }
      
      // Collect blocks while capturing
      if (capturing2) {
        blocks.push(block);
        debug('Timedify: collectBlocksBetween - captured block:', block.id || block.className);
      }
    }
    
    if (blocks.length > 0) {
      debug('Timedify: collectBlocksBetween - returning', blocks.length, 'blocks');
      return blocks;
    }

    // Fallback: container-based collection when no distinct .shopify-blocks are between
    function findImmediateChildWithin(ancestor, node) {
      let current = node;
      let last = null;
      while (current && current !== ancestor) {
        last = current;
        current = current.parentElement;
      }
      if (current !== ancestor) return null;
      return last;
    }

    // Ascend/descend to the nearest container level where start and end are in different child containers
    let container = parentSection;
    let depth = 0;
    let startContainer = findImmediateChildWithin(container, startEl);
    let endContainer = findImmediateChildWithin(container, endEl);
    while (startContainer && endContainer && startContainer === endContainer && depth < 6) {
      container = startContainer;
      startContainer = findImmediateChildWithin(container, startEl);
      endContainer = findImmediateChildWithin(container, endEl);
      depth++;
    }

    if (!startContainer || !endContainer) {
      debug('Timedify: fallback collect - unresolved containers');
      return [];
    }

    const between = [];
    const children = Array.from(container.children);
    let capturing = false;
    debug('Timedify: fallback collect - container depth', depth, 'children', children.length);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child === startContainer) { capturing2 = true; continue; }
      if (child === endContainer) break;
      if (capturing2) between.push(child);
    }

    if (between.length > 0) {
      debug('Timedify: fallback collect - returning', between.length, 'elements');
      return between;
    }

    // Second fallback: collect top-level nodes between start and end within container using a walker
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
    const fallback = [];
    let passedStart = false;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node === startEl) { passedStart = true; continue; }
      if (node === endEl) break;
      if (!passedStart) continue;
      const topChild = findImmediateChildWithin(container, node);
      if (topChild && topChild !== startContainer && topChild !== endContainer && !fallback.includes(topChild)) {
        fallback.push(topChild);
      }
    }
    debug('Timedify: fallback collect (walker) - returning', fallback.length, 'elements');
    return fallback;
  }

  // Control the range of content for a start block
  function controlRange(startEl) {
    // Idempotenz: denselben Start-Block nur einmal verarbeiten
    if (startEl.dataset.timedifyProcessed === 'true') return;
    startEl.dataset.timedifyProcessed = 'true';

    debug('Timedify: controlRange called for start block:', startEl.id);
    
    // Find matching end block (DOM order)
    const endEl = findNextEndMarker(startEl);
    
    if (!endEl) {
      console.warn('Timedify: No end block found for start block', startEl.id);
      return;
    }
    
    debug('Timedify: Found end block:', endEl.id);
    
    // Check if start and end are in the same section (single-section content)
    const startSection = startEl.closest('.shopify-section');
    const endSection = endEl.closest('.shopify-section');
    
    // For single-section detection, check if there are no sections between start and end
    const isSingleSection = checkIfSingleSection(startEl, endEl);
    
    debug('Timedify: isSingleSection:', isSingleSection, 'startSection:', startSection?.id, 'endSection:', endSection?.id);
    
    // Update the data-content-type attribute for debugging
    if (startEl) {
      startEl.setAttribute('data-content-type', isSingleSection ? 'single-section' : 'cross-section');
    }
    if (endEl) {
      endEl.setAttribute('data-content-type', isSingleSection ? 'single-section' : 'cross-section');
    }
    
    // Determine target elements based on content type
    let targetElements;
    if (isSingleSection) {
      debug('Timedify: Using single-section mode - collecting blocks');
      // Single-section: collect blocks between start and end
      targetElements = collectBlocksBetween(startEl, endEl);
    } else {
      debug('Timedify: Using cross-section mode - collecting sections');
      // Cross-section: collect sections between start and end
      targetElements = collectSectionsBetween(startEl, endEl);
    }
    
    debug('Timedify: Found', targetElements.length, 'target elements');
    
    if (targetElements.length === 0) {
      console.warn('Timedify: No target elements found');
      return;
    }
    
    // Set pending state immediately
    const effectiveRangeKey = startEl.id;
    targetElements.forEach(element => {
      element.dataset.timedifyPending = 'true';
      element.dataset.timedifyRange = effectiveRangeKey;
      // Immediate FOUC prevention - hide element before timing check
      element.dataset.timedifyHidden = 'true';
      debug('Timedify: Set pending state for element:', element.id || element.className);
    });
    
    // Check timing
    const isActive = computeActive(startEl, endEl);
    debug('Timedify: Content is active:', isActive);
    
    // Apply visibility
    applyVisibility(targetElements, isActive);
  }

  // Light MutationObserver for late-loaded sections
  function observeLateLoadedSections() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.classList && node.classList.contains('shopify-section')) {
              // Check if this section should be controlled
              const startBlocks = document.querySelectorAll('[data-needs-js-controller="true"]');
              startBlocks.forEach(startEl => {
                const endEl = findNextEndMarker(startEl);
                
                if (endEl) {
                  const startSection = startEl.closest('.shopify-section');
                  const endSection = endEl.closest('.shopify-section');
                  
                  if (startSection && endSection) {
                    // Effiziente Bereichsprüfung ohne Index-Suche: DOM-Positionsvergleich
                    const startToNode = startSection.compareDocumentPosition(node);
                    const nodeFollowsStart = (startToNode & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
                    const nodeToEnd = node.compareDocumentPosition(endSection);
                    const endFollowsNode = (nodeToEnd & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

                    if (nodeFollowsStart && endFollowsNode) {
                      // This section should be controlled
                      const isActive = computeActive(startEl, endEl);
                      const effectiveRangeKey = startEl.id;
                      
                      node.dataset.timedifyPending = 'true';
                      node.dataset.timedifyRange = effectiveRangeKey;
                      
                      if (!isActive) {
                        node.dataset.timedifyHidden = 'true';
                        node.setAttribute('aria-hidden', 'true');
                      }
                      
                      node.removeAttribute('data-timedify-pending');
                      node.dataset.timedifyReady = 'true';
                    }
                  }
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize the system
  function init() {
    console.log('Timedify: Initializing controller');
    
    const startBlocks = document.querySelectorAll('[data-needs-js-controller="true"]');
    
    console.log('Timedify: Found', startBlocks.length, 'start blocks');
    
    if (!startBlocks || !startBlocks.length) {
      console.log('Timedify: No start blocks found, exiting');
      return;
    }
    
    // Process each start block
    startBlocks.forEach((startEl, index) => {
      console.log('Timedify: Processing start block', index + 1, 'of', startBlocks.length, ':', startEl.id);
      controlRange(startEl);
    });
    
    // Set up light MutationObserver for late-loaded sections
    observeLateLoadedSections();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
