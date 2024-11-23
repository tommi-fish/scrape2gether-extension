document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const groupNameInput = document.getElementById('groupNameInput');
  const containerSelectorInput = document.getElementById('containerSelectorInput');
  const childNameInput = document.getElementById('childNameInput');
  const childSelectorInput = document.getElementById('childSelectorInput');
  const childRegexInput = document.getElementById('childRegexInput');
  const addChildButton = document.getElementById('addChildSelector');
  const saveGroupButton = document.getElementById('saveGroup');
  const loadGroupButton = document.getElementById('loadGroup');
  const viewDataButton = document.getElementById('viewData');
  const groupDropdown = document.getElementById('selectorGroupDropdown');
  const jsonOutput = document.getElementById('jsonOutput');
  const inputMode = document.getElementById('inputMode');

  let currentGroup = {
    name: '',
    containerSelector: '',
    childSelectors: [],
    id: Date.now().toString()
  };

  function debugLog(message, data) {
    console.log(`[Popup] ${message}`, data);
  }

  // Load existing groups into dropdown
  function loadGroups() {
    chrome.storage.local.get(['selectorGroups'], function(result) {
      const groups = result.selectorGroups || [];
      debugLog('Loaded groups:', groups);
      
      // Clear existing options
      groupDropdown.innerHTML = '<option value="">Select a group</option>';

      // Add options for each group
      groups.forEach(group => {
        const option = document.createElement('option');
        option.textContent = group.name;
        option.value = group.id;
        groupDropdown.appendChild(option);
      });
    });
  }

  // Add child selector to current group
  addChildButton.addEventListener('click', function() {
    const name = childNameInput.value.trim();
    const selector = childSelectorInput.value.trim();
    const regex = childRegexInput.value.trim();

    if (regex && !isValidRegex(regex)) {
      alert('Invalid regex pattern');
      return;
    }

    if (name && selector) {
      currentGroup.childSelectors.push({
        name,
        selector,
        regex,
        id: Date.now().toString()
      });

      debugLog('Added child selector:', currentGroup.childSelectors);

      // Clear inputs
      childNameInput.value = '';
      childSelectorInput.value = '';
      childRegexInput.value = '';
    }
  });

  // Save entire selector group
  saveGroupButton.addEventListener('click', function() {
    const groupName = groupNameInput.value.trim();
    const containerSelector = containerSelectorInput.value.trim();

    if (groupName && containerSelector && currentGroup.childSelectors.length > 0) {
      chrome.storage.local.get(['selectorGroups'], function(result) {
        const groups = result.selectorGroups || [];
        
        currentGroup.name = groupName;
        currentGroup.containerSelector = containerSelector;

        groups.push(currentGroup);
        debugLog('Saving groups:', groups);
        
        chrome.storage.local.set({ selectorGroups: groups }, function() {
          // Update content script
          updateContentScript(groups);

          // Reset form
          groupNameInput.value = '';
          containerSelectorInput.value = '';
          currentGroup = {
            name: '',
            containerSelector: '',
            childSelectors: [],
            id: Date.now().toString()
          };

          // Reload groups in dropdown
          loadGroups();
        });
      });
    } else {
      alert('Please fill in all required fields and add at least one child selector');
    }
  });

  // Load selected group
  loadGroupButton.addEventListener('click', function() {
    const selectedGroupId = groupDropdown.value;
    
    if (!selectedGroupId) {
      alert('Please select a group');
      return;
    }

    chrome.storage.local.get(['selectorGroups'], function(result) {
      const groups = result.selectorGroups || [];
      const selectedGroup = groups.find(g => g.id === selectedGroupId);

      if (selectedGroup) {
        debugLog('Loading group:', selectedGroup);
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs[0]?.id) {
            alert('Cannot access the current tab. Please try again.');
            return;
          }
          
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "loadSelectorGroup",
            selectorGroup: selectedGroup
          }, function(response) {
            debugLog('Load group response:', response);
            if (chrome.runtime.lastError) {
              console.error('Error:', chrome.runtime.lastError);
            }
          });
        });
      }
    });
  });

  // View collected data
  viewDataButton.addEventListener('click', async function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getData" }, function(response) {
        if (response && response.data) {
          jsonOutput.style.display = 'block';
          jsonOutput.textContent = JSON.stringify(response.data, null, 2);
          inputMode.style.display = 'none';
  
          // Add Download button
          const downloadBtn = document.createElement('button');
          downloadBtn.textContent = 'Download';
          downloadBtn.style.marginBottom = '10px';
          downloadBtn.onclick = function() {
            const data = JSON.stringify(response.data, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
  
            const link = document.createElement('a');
            link.href = url;
            link.download = 'data.json'; // Specify the file name
            link.click();
  
            // Cleanup
            URL.revokeObjectURL(url);
          };
          jsonOutput.parentElement.insertBefore(downloadBtn, jsonOutput);
  
          // Add Back button
          const backBtn = document.createElement('button');
          backBtn.textContent = 'Back';
          backBtn.style.marginBottom = '10px';
          backBtn.onclick = function() {
            jsonOutput.style.display = 'none';
            inputMode.style.display = 'block';
            this.remove();
            downloadBtn.remove(); // Remove the Download button when returning
          };
          jsonOutput.parentElement.insertBefore(backBtn, jsonOutput);
        }
      });
    });
  });

  function updateContentScript(groups) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]?.id) {
        alert('Cannot access the current tab. Please try again.');
        return;
      }
      
      debugLog('Updating content script with groups:', groups);
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateSelectorGroups",
        selectorGroups: groups
      }, function(response) {
        debugLog('Update response:', response);
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
        }
      });
    });
  }

  // Load groups when popup opens
  loadGroups();
  debugLog('Popup initialized');
});