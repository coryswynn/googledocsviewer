// modalManager.js: Manages modal functionality.

// Function to close the modal
export function closeModal(modal) {
    const modalBody = modal ? modal.querySelector('.modal-body') : null;
    if (modalBody) {
      modalBody.innerHTML = ''; // Clear previous dynamic content
    }
    if (modal) {
      modal.style.display = 'none'; // Hide the modal
    }
  }
  
  // Function to clear any previous content and then display the modal
  export function clearAndDisplayModal(modal, activeContainerFrame, displayModalCallback) {
    closeModal(modal); // First, ensure the modal is reset
    if (displayModalCallback && typeof displayModalCallback === 'function') {
      displayModalCallback(modal, activeContainerFrame); // Then display the modal with the new content
    }
  }
  
  // Function to display the modal
  export function displayModal(modal, activeContainerFrame) {
    if (!activeContainerFrame) return; // Ensure there's an active container frame
  
    const rect = activeContainerFrame.getBoundingClientRect();
    modal.style.position = 'absolute';
    modal.style.top = `${rect.top}px`;
    modal.style.left = `${rect.left}px`;
    modal.style.width = `${rect.width}px`;
    modal.style.height = `${rect.height}px`;
    modal.style.display = 'block';
  
    populateModalWithContent(modal, activeContainerFrame);
  }
  
  // Function to populate modal with content, such as iframe titles
  function populateModalWithContent(modal, activeContainerFrame) {
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = ''; // Clear previous dynamic content
  
    // Query the current window tabs
    chrome.tabs.query({}, function(tabs) {
        let validTabsFound = false;

        tabs.forEach(function(tab) {
            // Check if the tab's URL matches Google Docs, Sheets, or Slides
            if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
                validTabsFound = true;
                const tabItem = document.createElement('div');
                tabItem.className = 'modal-url-option'; // Reuse your existing class for styling

                // Create an image element for the favicon
                const favicon = document.createElement('img');
                favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url='+tab.url;
                favicon.className = 'favicon'; // Use this class for additional styling (size, margin, etc.)
                favicon.alt = 'Favicon'; // Alternative text for accessibility

                // Create a span element for the tab's title
                const titleSpan = document.createElement('span');
                titleSpan.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Remove "- Google Sheets," "- Google Docs," or "- Google Slides" from the title
                titleSpan.className = 'tab-title'; // Use this class for styling

                // Append the favicon and title span to the tabItem
                tabItem.appendChild(favicon);
                tabItem.appendChild(titleSpan); // Append the title span to the tabItem

    // Event listener for clicking a tabItem
    tabItem.addEventListener('click', () => {
                    // Find the iframe within the active container frame to update its source
                    const iframe = activeContainerFrame.querySelector('iframe');
                    if (iframe) {
                        iframe.src = tab.url; // Update the iframe source to the selected URL
                    }

                    // Update the title in the toolbar
                    const titleElement = activeContainerFrame.querySelector('.url-text');
                    if (titleElement) {
                        titleElement.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, '');
                    }

                    // Update the copy button functionality with the new URL
                    const copyButton = activeContainerFrame.querySelector('.copy-url-button');
                    if (copyButton) {
                        copyButton.onclick = function() {
                            copyButton.title = 'Copy URL';
                            navigator.clipboard.writeText(tab.url).then(() => {
                                alert('URL copied to clipboard!');
                            });
                        };
                    }

                    // Update the pop-out button functionality with the new URL
                    const popOutButton = activeContainerFrame.querySelector('.pop-out-button');
                    if (popOutButton) {
                        popOutButton.onclick = function() {
                            window.open(tab.url, '_blank');
                        };
                    }

                    // Hide the modal after selection
                    closeModal(modal); 
                });
                modalBody.appendChild(tabItem); // Append to the modal content
            }
        });

        if (!validTabsFound) {
            modalBody.textContent = 'No Google Docs, Sheets, or Slides tabs found.';
        }
    });
  }
  // Function to adjust modal position based on the active container frame's bounds
  export function adjustModalPosition(modal, activeContainerFrame) {
    if (!modal || !activeContainerFrame) {
        console.log('No modal');
        console.error('Modal or activeContainerFrame is not defined.');
        return;
    }

    console.log('Starting adjustment of modal');
    const rect = activeContainerFrame.getBoundingClientRect();
    modal.style.position = 'absolute';
    modal.style.top = `${rect.top}px`;
    modal.style.left = `${rect.left}px`;
    modal.style.width = `${rect.width}px`;
    modal.style.height = `${rect.height}px`;
    modal.style.display = 'block';
  }
  
  // Event listener for clicks outside the modal to close it
  export function setupModalDismissal(modal, closeModalCallback) {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        if (closeModalCallback && typeof closeModalCallback === 'function') {
          closeModalCallback(modal);
        }
      }
    });
  
    // Close button event listener
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => closeModalCallback(modal));
    }
  }
  
  