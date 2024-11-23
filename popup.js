document.addEventListener('DOMContentLoaded', function() {
  const dropdown = document.getElementById('selectorDropdown'); // The dropdown element
  const nameInput = document.getElementById('nameInput');
  const selectorInput = document.getElementById('selectorInput');
  
  const addButton = document.getElementById('addSelector');
  const viewDataButton = document.getElementById('viewData');
  const loadSelectorButton = document.getElementById('loadSelector');

  const selectorList = document.getElementById('selectorList');
  const jsonOutput = document.getElementById('jsonOutput');
  const inputMode = document.getElementById('inputMode');
  const regexInput = document.getElementById('regexInput');

  // Load existing selectors into the dropdown
  function loadSelectors() {
    chrome.storage.local.get(['selectorData'], function(result) {
      const selectorData = result.selectorData || [];
      console.log(selectorData); // Log to verify the data
      if (selectorData.length > 0) {
        populateDropdown(selectorData);
      }
    });
  }

  function populateDropdown(selectorData) {
    // Clear existing options
    dropdown.innerHTML = '';

    // Create default "Select" option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a selector';
    defaultOption.value = '';
    dropdown.appendChild(defaultOption);

    // Add options for each selector
    selectorData.forEach(selector => {
      const option = document.createElement('option');
      option.textContent = selector.name; // The name of the selector
      option.value = selector.id; // Use the unique ID for the option value
      dropdown.appendChild(option);
    });
  }

  // Call loadSelectors when popup opens
  loadSelectors();

  // Add new selector
  addButton.addEventListener('click', function() {
    const name = nameInput.value.trim();
    const selector = selectorInput.value.trim();
    const regex = regexInput.value.trim();

    if (name && selector) {
      chrome.storage.local.get(['selectorData'], function(result) {
        const selectorData = result.selectorData || [];
        const newSelector = {
          name: name,
          selector: selector,
          regex: regex,
          id: Date.now().toString()
        };

        selectorData.push(newSelector);
        chrome.storage.local.set({ selectorData });

        // Update the dropdown
        populateDropdown(selectorData);

        // Notify content script
        updateContentScript(selectorData);

        // Clear input fields
        nameInput.value = '';
        selectorInput.value = '';
        regexInput.value = '';
      });
    }
  });

  function updateContentScript(selectorData) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateSelectors",
        selectorData: selectorData
      });
    });
  }

  // View collected data
  viewDataButton.addEventListener('click', async function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "getData"
      }, function(response) {
        if (response && response.data) {
          jsonOutput.style.display = 'block';
          jsonOutput.textContent = JSON.stringify(response.data, null, 2);
          inputMode.style.display = 'none';

          const backBtn = document.createElement('button');
          backBtn.textContent = 'Back';
          backBtn.style.marginBottom = '10px';
          backBtn.onclick = function() {
            jsonOutput.style.display = 'none';
            inputMode.style.display = 'block';
            this.remove();
          };
          jsonOutput.parentElement.insertBefore(backBtn, jsonOutput);
        }
      });
    });
  });

  // Load Selector button click handler
  loadSelectorButton.addEventListener('click', function() {
    const selectedSelectorId = dropdown.value;
    
    if (!selectedSelectorId) {
      alert('Please select a selector');
      return;
    }

    // Retrieve the full selector data from storage
    chrome.storage.local.get(['selectorData'], function(result) {
      const selectorData = result.selectorData || [];
      const selectedSelector = selectorData.find(s => s.id === selectedSelectorId);

      if (selectedSelector) {
        // Send message to content script to load and highlight the selector
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "loadSelector",
            selectorData: [selectedSelector]
          });
        });
      }
    });
  });
});