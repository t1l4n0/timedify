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
      return null;
    }
  }

  // Compute if content should be active based on start/end times
  function computeActive(startEl, endEl) {
    try {
      var startStr = startEl.getAttribute('data-start-datetime');
      var endStr = endEl ? endEl.getAttribute('data-end-datetime') : null;
      
      if (!startStr && !endStr) return true; // No dates set = always visible
      
      var startAt = startStr ? parseGermanDate(startStr) : null;
      var endAt = endStr ? parseGermanDate(endStr) : null;
      var now = new Date();
      
      if (startAt && now < startAt) return false; // Before start time
      if (endAt && now > endAt) return false;     // After end time
      
      return true;
    } catch (e) {
      console.error('TimedContent: Error computing active state:', e);
      return true; // Default to visible on error
    }
  }

  // Find the next end marker after a start block
  function findNextEndMarker(startEl) {
    var ends = document.querySelectorAll('.timed-sections-end');
    
    for (var i = 0; i < ends.length; i++) {
      var endEl = ends[i];
      if (startEl === endEl) continue;
      
      var pos = startEl.compareDocumentPosition(endEl);
      // Node.DOCUMENT_POSITION_FOLLOWING = 4
      if (pos & 4) {
        return endEl;
      }
    }
    return null;
  }

  // Removed: alternative global search to avoid interfering with theme layout

  // Collect all elements between the app-block sections of start and end
  function collectRangeElements(startEl, endEl) {
    if (!startEl || !endEl) return [];

    // Find enclosing Shopify app-block sections for both markers
    var startBlock = startEl.closest('.shopify-app-block.section') || startEl.parentElement;
    var endBlock = endEl.closest('.shopify-app-block.section') || endEl.parentElement;
    if (!startBlock || !endBlock) return [];

    // If both are under the same parent, traverse siblings between them
    if (startBlock.parentElement && startBlock.parentElement === endBlock.parentElement) {
      var parent = startBlock.parentElement;
      var items = [];
      var cursor = startBlock.nextElementSibling;
      var guard = 0;
      while (cursor && cursor !== endBlock && guard < 1000) {
        // Do not include the start/end blocks themselves or our own helper containers
        if (cursor !== startBlock && cursor !== endBlock) {
          items.push(cursor);
        }
        cursor = cursor.nextElementSibling;
        guard++;
      }
      return items;
    }

    // Fallback: collect nodes that are after startBlock and before endBlock in document order,
    // but only include elements sharing a nearest common ancestor to avoid global grabs
    var result = [];
    try {
      var common = (function(a, b) {
        var set = new Set();
        var n = a;
        while (n) { set.add(n); n = n.parentElement; }
        var m = b;
        while (m) { if (set.has(m)) return m; m = m.parentElement; }
        return document.body;
      })(startBlock, endBlock);

      // Iterate over children of the common ancestor, capturing the span between blocks
      var capturing = false;
      var guard2 = 0;
      for (var child = common.firstElementChild; child && guard2 < 5000; child = child.nextElementSibling) {
        if (child === startBlock) {
          capturing = true;
          continue;
        }
        if (child === endBlock) {
          break;
        }
        if (capturing) {
          result.push(child);
        }
        guard2++;
      }
    } catch (e) {
      // ignore
    }
    return result;
  }

  // Apply visibility state to elements
  function applyState(elements, active) {
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el || !el.classList) continue;
      try {
        if (active) {
          el.classList.remove('ts-hidden');
          el.removeAttribute('hidden');
          el.setAttribute('aria-hidden', 'false');
        } else {
          el.classList.add('ts-hidden');
          el.setAttribute('hidden', '');
          el.setAttribute('aria-hidden', 'true');
        }
      } catch (e) {
        // no-op
      }
    }
  }

  // Control the range of content for a start block
  function controlRange(startEl) {
    
    var endEl = findNextEndMarker(startEl);
    if (!endEl) {
      return;
    }
    
    // Try original method first
    var controlled = collectRangeElements(startEl, endEl);
    
    // No alternative global search; only operate on direct siblings to avoid layout interference
    
    var active = computeActive(startEl, endEl);
    applyState(controlled, active);
  }

  // Main refresh function
  function refresh() {
    
    var starts = document.querySelectorAll('.timed-sections-start');
    
    if (!starts || !starts.length) {
      return;
    }
    
    starts.forEach(function(startEl, index) {
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
    
    var starts = document.querySelectorAll('.timed-sections-start');
    
    if (!starts || !starts.length) {
      return;
    }
    
    var run = function() {
      // In Theme Editor never hide content; only show markers/warnings
      if (window.Shopify && window.Shopify.designMode) return;
      refresh();
    };
    
    run(); // Initial run
    
    // Refresh only in live mode; no periodic hiding in editor
    if (!window.Shopify || !window.Shopify.designMode) {
      setInterval(run, 2000);
    }
    
    // Observe DOM changes in live mode only
    if (!window.Shopify || !window.Shopify.designMode) {
      var mo = new MutationObserver(run);
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      setupThemeEditor();
    });
  } else {
    init();
    setupThemeEditor();
  }
})();
