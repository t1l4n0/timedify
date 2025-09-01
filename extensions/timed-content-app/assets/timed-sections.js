/**
 * Timed Sections JavaScript
 * Controls visibility of content between start and end blocks based on time
 * UNIVERSAL - works with ANY Shopify theme
 */

(function() {
  'use strict';

  // Parse German date format (DD.MM.YYYY HH:MM)
  function parseGermanDate(value) {
    if (!value) return null;
    
    try {
      var parts = value.trim().split(/[\s:.-]/);
      if (parts.length < 5) return new Date(value);
      
      var day = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      var year = parseInt(parts[2], 10);
      var hour = parseInt(parts[3], 10) || 0;
      var minute = parseInt(parts[4], 10) || 0;
      
      return new Date(year, month, day, hour, minute, 0);
    } catch (e) {
      console.warn('Failed to parse date:', value, e);
      return null;
    }
  }

  // Compute if content should be active based on start/end times
  function computeActive(startEl) {
    try {
      var startStr = startEl.getAttribute('data-start-datetime');
      var endStr = startEl.getAttribute('data-end-datetime');
      
      if (!startStr && !endStr) return true; // No dates set = always visible
      
      var startAt = startStr ? parseGermanDate(startStr) : null;
      var endAt = endStr ? parseGermanDate(endStr) : null;
      var now = new Date();
      
      // Debug logging
      console.log('Timed Sections Debug:', {
        startStr: startStr,
        endStr: endStr,
        startAt: startAt,
        endAt: endAt,
        now: now,
        shouldShow: !(startAt && now < startAt) && !(endAt && now > endAt)
      });
      
      if (startAt && now < startAt) return false; // Before start time
      if (endAt && now > endAt) return false;     // After end time
      
      return true;
    } catch (e) {
      console.error('Error computing active state:', e);
      return true; // Default to visible on error
    }
  }

  // Find the next end marker after a start block
  function findNextEndMarker(startEl) {
    var ends = document.querySelectorAll('.timed-sections-end');
    console.log('Found end markers:', ends.length);
    
    for (var i = 0; i < ends.length; i++) {
      var endEl = ends[i];
      if (startEl === endEl) continue;
      
      var pos = startEl.compareDocumentPosition(endEl);
      // Node.DOCUMENT_POSITION_FOLLOWING = 4
      if (pos & 4) {
        console.log('Found next end marker:', endEl);
        return endEl;
      }
    }
    console.log('No end marker found');
    return null;
  }

  // Alternative method to find elements between start and end
  function findElementsBetween(startEl, endEl) {
    if (!startEl || !endEl) return [];
    
    var result = [];
    
    // Method 1: Look for elements with data attributes that might be content
    var potentialContent = document.querySelectorAll('[data-section-id], [id^="shopify-section-"], .shopify-section, [class*="section"], [class*="block"]');
    console.log('Found potential content elements:', potentialContent.length);
    
    for (var i = 0; i < potentialContent.length; i++) {
      var el = potentialContent[i];
      if (el === startEl || el === endEl) continue;
      
      // Check if this element is between start and end
      var startPos = startEl.compareDocumentPosition(el);
      var endPos = endEl.compareDocumentPosition(el);
      
      // Element should be after start (4) and before end (2)
      if ((startPos & 4) && (endPos & 2)) {
        console.log('Found content element between start/end:', el, 'tagName:', el.tagName);
        result.push(el);
      }
    }
    
    // Method 2: Look for common content containers
    var contentSelectors = [
      'div[class*="content"]',
      'div[class*="Content"]', 
      'section[class*="content"]',
      'section[class*="Content"]',
      'div[class*="block"]',
      'div[class*="Block"]',
      'div[class*="section"]',
      'div[class*="Section"]'
    ];
    
    for (var j = 0; j < contentSelectors.length; j++) {
      var contentElements = document.querySelectorAll(contentSelectors[j]);
      for (var k = 0; k < contentElements.length; k++) {
        var contentEl = contentElements[k];
        if (contentEl === startEl || contentEl === endEl || result.indexOf(contentEl) !== -1) continue;
        
        var startPos = startEl.compareDocumentPosition(contentEl);
        var endPos = endEl.compareDocumentPosition(contentEl);
        
        if ((startPos & 4) && (endPos & 2)) {
          console.log('Found content element with selector method:', contentEl, 'tagName:', contentEl.tagName);
          result.push(contentEl);
        }
      }
    }
    
    console.log('Total elements found with alternative method:', result.length);
    return result;
  }

  // Collect all elements between start and end blocks
  function collectRangeElements(startEl, endEl) {
    if (!endEl) {
      console.log('No end element, cannot collect range');
      return [];
    }
    
    var result = [];
    var cursor = startEl.nextElementSibling;
    var count = 0;
    
    while (cursor && cursor !== endEl && count < 100) { // Safety limit
      // Skip our own content containers and already hidden elements
      if (cursor.classList && 
          !cursor.classList.contains('timed-sections-content') &&
          !cursor.classList.contains('ts-hidden') &&
          cursor !== startEl) {
        result.push(cursor);
        console.log('Added element to range:', cursor);
      }
      cursor = cursor.nextElementSibling;
      count++;
    }
    
    console.log('Collected range elements:', result.length);
    return result;
  }

  // Apply visibility state to elements
  function applyState(elements, active) {
    console.log('Applying state:', active ? 'visible' : 'hidden', 'to', elements.length, 'elements');
    
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el || !el.classList) continue;
      
      try {
        if (active) {
          el.classList.remove('ts-hidden');
          el.classList.add('ts-visible');
          el.style.removeProperty('display');
          el.style.removeProperty('visibility');
          el.style.removeProperty('opacity');
          console.log('Made element visible:', el);
        } else {
          el.classList.add('ts-hidden');
          el.classList.remove('ts-visible');
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          console.log('Made element hidden:', el);
        }
      } catch (e) {
        console.error('Error applying state to element:', e);
      }
    }
  }

  // Control the range of content for a start block
  function controlRange(startEl) {
    console.log('Controlling range for start element:', startEl);
    
    var endEl = findNextEndMarker(startEl);
    if (!endEl) {
      console.log('No end marker found, cannot control range');
      return;
    }
    
    // Try original method first
    var controlled = collectRangeElements(startEl, endEl);
    console.log('Elements found with original method:', controlled.length);
    
    // OPTIMIZED: Only try alternative method if no elements found AND we're in live mode
    if (controlled.length === 0 && (!window.Shopify || !window.Shopify.designMode)) {
      console.log('No elements found with original method, trying alternative...');
      var alternativeElements = findElementsBetween(startEl, endEl);
      controlled = alternativeElements;
      console.log('Elements found with alternative method:', controlled.length);
    }
    
    var active = computeActive(startEl);
    
    console.log('Range control result:', {
      controlledElements: controlled.length,
      shouldBeActive: active
    });
    
    applyState(controlled, active);
  }

  // Main refresh function
  function refresh() {
    console.log('Refreshing timed sections...');
    
    var starts = document.querySelectorAll('.timed-sections-start');
    console.log('Found start blocks:', starts.length);
    
    if (!starts || !starts.length) {
      console.log('No start blocks found');
      return;
    }
    
    starts.forEach(function(startEl, index) {
      console.log('Processing start block', index + 1, ':', startEl);
      controlRange(startEl);
    });
  }

  // Theme Editor validation - only runs in editor
  function setupThemeEditor() {
    if (window.Shopify && window.Shopify.designMode) {
      document.addEventListener('DOMContentLoaded', function() {
        var startBlocks = document.querySelectorAll('.timed-sections-start');
        startBlocks.forEach(function(startBlock) {
          if (!startBlock) return;
          
          var marker = startBlock.querySelector('.ts-marker');
          if (marker && !marker.querySelector('.ts-warning-message')) {
            var warningDiv = document.createElement('div');
            warningDiv.className = 'ts-warning-message';
            warningDiv.style.cssText = 'background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 8px; margin-top: 8px; border-radius: 4px; font-size: 12px;';
            warningDiv.innerHTML = 'ℹ️ Place your timed content after this block. <br />Don\'t forget to place an end-block after your content.';
            
            marker.appendChild(warningDiv);
          }
        });
      });
    }
  }

  // Initialize the system
  function init() {
    console.log('Initializing timed sections...');
    
    var starts = document.querySelectorAll('.timed-sections-start');
    console.log('Initial start blocks found:', starts.length);
    
    if (!starts || !starts.length) {
      console.log('No start blocks found during init');
      return;
    }
    
    var run = function() {
      refresh();
    };
    
    run(); // Initial run
    
    // FAST REFRESH: Check every 2 seconds for immediate response
    var interval = window.Shopify && window.Shopify.designMode ? 10000 : 2000; // 10s for editor, 2s for live
    console.log('Setting refresh interval:', interval, 'ms');
    setInterval(run, interval);
    
    // Observe DOM changes in live mode only
    if (!window.Shopify || !window.Shopify.designMode) {
      console.log('Setting up MutationObserver for live mode');
      var mo = new MutationObserver(run);
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    console.log('DOM loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOMContentLoaded fired, initializing...');
      init();
      setupThemeEditor();
    });
  } else {
    console.log('DOM already ready, initializing immediately...');
    init();
    setupThemeEditor();
  }
})();
