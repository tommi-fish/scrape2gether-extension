let highlightedElements = new Set();
let observers = [];
let currentGroups = [];

// Add debug logging
function debugLog(message, data) {
  console.log(`[Element Collector] ${message}`, data);
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
    el.style.removeProperty('transition');
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
        container.style.backgroundColor = '#FFEB3B';
        container.style.transition = 'background-color 0.3s';
        highlightedElements.add(container);

        // Highlight child elements
        group.childSelectors.forEach(childSelector => {
          const childElements = container.querySelectorAll(childSelector.selector);
          debugLog(`Found ${childElements.length} child elements for selector: ${childSelector.selector}`);
          
          childElements.forEach(el => {
            el.style.backgroundColor = '#90EE90';
            el.style.transition = 'background-color 0.3s';
            highlightedElements.add(el);
          });
        });
      });

      // Set up mutation observer
      const observer = new MutationObserver((mutations) => {
        requestAnimationFrame(() => {
          highlightElements(currentGroups);
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      observers.push(observer);
    } catch (e) {
      console.error(`Error highlighting elements for group: ${group.name}`, e);
    }
  });
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