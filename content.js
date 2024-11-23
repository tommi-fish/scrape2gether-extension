let highlightedElements = new Set();
let observers = [];
let currentGroups = [];
let debounceTimer;
const DEBUG_MODE = false;

// Add debug logging
function debugLog(message, data) {
  if (DEBUG_MODE) {
    console.log(`[Element Collector] ${message}`, data);
  }
}

// Function to collect data from elements with nested structure
function collectData() {
  debugLog('Collecting data from groups:', currentGroups);
  const data = [];
  
  currentGroups.forEach(group => {
    // Find all container elements
    const containers = document.querySelectorAll(group.containerSelector);
    debugLog(`Found ${containers.length} containers for selector: ${group.containerSelector}`);
    
    containers.forEach(container => {
      const containerData = {};
      
      // Collect data for each child selector
      group.childSelectors.forEach(childSelector => {
        const elements = container.querySelectorAll(childSelector.selector);
        debugLog(`Found ${elements.length} elements for child selector: ${childSelector.selector}`);
        
        const values = Array.from(elements).map(el => el.textContent.trim());
        
        // Apply regex filter if specified
        const filteredValues = childSelector.regex 
          ? values.filter(value => new RegExp(childSelector.regex).test(value))
          : values;
        
        // Store single value if only one result, otherwise store array
        containerData[childSelector.name] = filteredValues.length === 1 
          ? filteredValues[0] 
          : filteredValues;
      });
      
      data.push(containerData);
    });
  });
  
  debugLog('Collected data:', data);
  return data;
}

// Function to highlight elements
function highlightElements(groups) {
  debugLog('Highlighting elements for groups:', groups);
  
  // Clear existing highlights and observers
  highlightedElements.forEach(el => {
    el.style.removeProperty('background-color');
    el.style.removeProperty('box-shadow');
    el.style.removeProperty('transition');
    el.style.removeProperty('border-radius');
  });
  highlightedElements.clear();
  observers.forEach(observer => observer.disconnect());
  observers = [];
  
  currentGroups = groups;

  // Highlight container and child elements
  groups.forEach(group => {
    try {
      // Highlight containers
      const containers = document.querySelectorAll(group.containerSelector);
      debugLog(`Found ${containers.length} containers to highlight for selector: ${group.containerSelector}`);
      
      containers.forEach(container => {
        // Container highlighting with green glow
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        container.style.backdropFilter = 'blur(2px)';
        container.style.boxShadow = '0 0 0 1px rgba(0, 255, 157, 0.1), 0 4px 12px rgba(0, 255, 157, 0.1)';
        container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.borderRadius = '8px';
        container.style.position = 'relative';
        highlightedElements.add(container);

        // Green border glow animation
        const glowAnimation = `
          @keyframes borderGlow {
            0% { border-color: rgba(0, 255, 157, 0.1); }
            50% { border-color: rgba(0, 255, 157, 0.2); }
            100% { border-color: rgba(0, 255, 157, 0.1); }
          }
        `;
        
        // Add styles to head if they don't exist
        if (!document.querySelector('#highlight-styles')) {
          const styleSheet = document.createElement('style');
          styleSheet.id = 'highlight-styles';
          styleSheet.textContent = glowAnimation;
          document.head.appendChild(styleSheet);
        }

        // Highlight child elements
        group.childSelectors.forEach(childSelector => {
          const childElements = container.querySelectorAll(childSelector.selector);
          
          childElements.forEach(el => {
            // Child element highlighting with green theme
            el.style.backgroundColor = 'rgba(0, 255, 157, 0.05)';
            el.style.backdropFilter = 'blur(1px)';
            el.style.boxShadow = '0 0 0 1px rgba(0, 255, 157, 0.1)';
            el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.borderRadius = '4px';
            el.style.padding = '2px 4px';
            el.style.margin = '2px 0';
            highlightedElements.add(el);

            // Enhanced hover effect with green theme
            el.addEventListener('mouseenter', () => {
              el.style.backgroundColor = 'rgba(0, 255, 157, 0.1)';
              el.style.boxShadow = '0 0 0 1px rgba(0, 255, 157, 0.2), 0 2px 8px rgba(0, 255, 157, 0.1)';
              el.style.transform = 'translateY(-1px)';
            });
            
            el.addEventListener('mouseleave', () => {
              el.style.backgroundColor = 'rgba(0, 255, 157, 0.05)';
              el.style.boxShadow = '0 0 0 1px rgba(0, 255, 157, 0.1)';
              el.style.transform = 'translateY(0)';
            });
          });
        });
      });

      // Set up mutation observer
      setupObserver();
      
    } catch (e) {
      if (DEBUG_MODE) {
        console.error(`Error highlighting elements for group: ${group.name}`, e);
      }
    }
  });
}

function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    // Clear existing timer
    clearTimeout(debounceTimer);
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        highlightElements(currentGroups);
      });
    }, 100); // Wait 100ms before updating
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false, // Only observe DOM changes, not attribute changes
    characterData: false // Don't observe text content changes
  });
  
  observers.push(observer);
}

function isValidRegex(pattern) {
  try {
    new RegExp(pattern);
    return true;
  } catch(e) {
    return false;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('Received message:', message);

  try {
    switch (message.action) {
      case "updateSelectorGroups":
        highlightElements(message.selectorGroups);
        sendResponse({ success: true });
        break;
        
      case "loadSelectorGroup":
        const newGroups = [...currentGroups];
        const exists = newGroups.some(g => g.id === message.selectorGroup.id);
        if (!exists) {
          newGroups.push(message.selectorGroup);
        }
        highlightElements(newGroups);
        sendResponse({ success: true });
        break;
        
      case "getData":
        const data = collectData();
        sendResponse({ data: data });
        break;
        
      default:
        debugLog('Unknown action:', message.action);
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse({ error: error.message });
  }
  
  return true;  // Keep the message channel open for the async response
});

// Log that content script has loaded
debugLog('Content script loaded and ready');