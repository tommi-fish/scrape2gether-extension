let highlightedElements = new Set();
let observers = [];
let currentSelectors = [];

// Function to collect data from elements
function collectData() {
  const data = {};
  currentSelectors.forEach(selectorObj => {
    const elements = document.querySelectorAll(selectorObj.selector);
    const values = Array.from(elements).map(el => el.textContent.trim());
    
    // Validate regex if provided
    const filteredValues = selectorObj.regex 
      ? values.filter(value => new RegExp(selectorObj.regex).test(value))
      : values;
    
    data[selectorObj.name] = filteredValues;
    
    if (selectorObj.regex && filteredValues.length !== values.length) {
      console.warn(`Some values filtered for regex: ${selectorObj.regex} (${selectorObj.name})`);
    }
  });
  return data;
}

// Function to highlight elements and set up observers
function highlightElements(selectorData) {
  // Clear existing
  highlightedElements.forEach(el => {
    el.style.removeProperty('background-color');
    el.style.removeProperty('transition');
  });
  highlightedElements.clear();
  observers.forEach(observer => observer.disconnect());
  observers = [];
  
  currentSelectors = selectorData;

  // Set up new highlights and observers
  selectorData.forEach(selectorObj => {
    try {
      document.querySelectorAll(selectorObj.selector).forEach(el => {
        el.style.backgroundColor = '#90EE90';
        el.style.transition = 'background-color 0.3s';
        highlightedElements.add(el);
      });

      const observer = new MutationObserver((mutations) => {
        const newElements = document.querySelectorAll(selectorObj.selector);
        newElements.forEach(el => {
          if (!highlightedElements.has(el)) {
            el.style.backgroundColor = '#90EE90';
            el.style.transition = 'background-color 0.3s';
            highlightedElements.add(el);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      observers.push(observer);
    } catch (e) {
      console.log(`Invalid selector: ${selectorObj.selector}`);
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSelectors") {
      highlightElements(message.selectorData);
  } else if (message.action === "getData") {
      sendResponse({ data: collectData() });
  } else if (message.action === "loadSelector") {
      const newSelectors = message.selectorData;
      
      // Merge new selectors with existing ones, avoiding duplicates
      newSelectors.forEach(newSelector => {
          // Check if this selector is already in the current list
          const exists = currentSelectors.some(s => s.id === newSelector.id);
          
          if (!exists) {
              currentSelectors.push(newSelector);
          }
      });

      // Highlight all current selectors
      highlightElements(currentSelectors);
  }
  return true;
});

// Initial load of selectors -- NOT REQUIRED ANYMORE or ever?
//chrome.storage.local.get(['selectorData'], function(result) {
//  if (result.selectorData) {
//    currentSelectors = currentSelectors.concat(result.selectorData)
//  }
//});