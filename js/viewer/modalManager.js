// modalManager.js: Manages modal functionality.

import {
  createIframeContainer,
  setupIframe,
  updateContainerFramesDataId,
  updateDividers,
  makeDividerDraggable,
  updateIframeProportions,
  createDivider
} from './iframeManager.js';
import { createToolbar } from './toolbarActions.js';
import { getActiveContainerFrame } from './init.js';

const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Utilize localStorage to manage saved tabs
const savedTabsKey = 'savedTabs'; // Key used in localStorage

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

  // Assuming the sidebar element is identifiable by the class name 'sidebar'
  const sidebar = document.querySelector('.sidebar');
  const isSidebarClosed = sidebar.classList.contains('close');

  // Determine the sidebar's width based on its open or closed state
  // Using 300px for open and 78px for closed as indicated in your CSS
  const sidebarWidth = isSidebarClosed ? 78 : 300;

  const rect = activeContainerFrame.getBoundingClientRect();
  modal.style.position = 'absolute';
  modal.style.top = `${rect.top}px`;
  modal.style.left = `${rect.left - sidebarWidth}px`;
  modal.style.width = `${rect.width}px`;
  modal.style.height = `${rect.height}px`;
  modal.style.display = 'block';

  populateModalWithContent(modal, activeContainerFrame);
  updateSavedTabsDisplay(); // Ensure the saved tabs are up-to-date
}

export function getSavedTabs() {
  return JSON.parse(localStorage.getItem(savedTabsKey)) || [];
}

export function getSavedTabTitle(url) {
  const savedTabs = getSavedTabs();
  const foundTab = savedTabs.find(tab => tab.url === url);
  return foundTab ? foundTab.title : null;
}

function updateSavedTabsDisplay() {
  const savedTabsContainer = document.querySelector('.saved-tabs-container');
  savedTabsContainer.innerHTML = ''; // Clear existing saved tabs

  const savedTabs = getSavedTabs();
  if (savedTabs.length > 0) {
    savedTabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'modal-url-option'; // Same class as other tab items for consistent styling

      // Implement click functionality for switching or adding a new frame
      tabItem.onclick = () => {
        // Find the first iframe container (you can customize this based on your logic)
        const iframeContainers = document.querySelectorAll('.url-container');
        const activeContainerFrame = getActiveContainerFrame(); // Ensure this function returns the active frame

        if (iframeContainers.length > 0) {
        } else {
          console.error('No iframe containers found.');
          return;
        }

        const iframe = activeContainerFrame.querySelector('iframe');
        if (iframe) {
          iframe.src = tab.url; // Update the iframe source to the selected URL
        }

        // Update the URL in the browser
        updateBrowserURL();

        // Update the title in the toolbar associated with the active container frame
        const titleElement = activeContainerFrame.querySelector('.url-text');
        if (titleElement) {
          // First, check if a saved title is available for the tab's URL
          const savedTitle = getSavedTabTitle(tab.url);

          if (savedTitle) {
            // If a saved title exists, use it
            titleElement.textContent = savedTitle;
          } else {
            // If no saved title exists, fall back to the tab's title
            titleElement.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, ''); // Clean up the title
          }
        }

        // Hide the modal after selection
        closeModal(document.querySelector('.modal'));
      };

      // Favicon
      const favicon = document.createElement('img');
      favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
      favicon.className = 'favicon'; // Ensure this matches the class used for other tab items
      favicon.alt = 'Favicon';
      tabItem.appendChild(favicon);

      // Title
      const titleSpan = document.createElement('span');
      titleSpan.textContent = tab.title;
      titleSpan.className = 'tab-title'; // Ensure this matches the class used for other tab items
      tabItem.appendChild(titleSpan);

      // Delete Button
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="bx bx-trash"></i>'; // Using Boxicons for the delete icon
      deleteButton.className = 'delete-button'; // Optionally, match this with your other action buttons
      deleteButton.onclick = (event) => {
        event.stopPropagation(); // Prevent click from bubbling to the tab item's click event
        deleteSavedTab(tab.url);
        updateSavedTabsDisplay(); // Refresh the display after deletion
      };
      tabItem.appendChild(deleteButton);

      savedTabsContainer.appendChild(tabItem);
    });
  } else {
    savedTabsContainer.textContent = 'No saved tabs.';
  }
}



function saveTab(url, title) {
  const savedTabs = getSavedTabs();
  const tab = { url, title }; // Create an object representing the tab
  if (!savedTabs.some(savedTab => savedTab.url === url)) {
    savedTabs.push(tab);
    localStorage.setItem(savedTabsKey, JSON.stringify(savedTabs));
    updateSavedTabsDisplay(); // Refresh the display of saved tabs
  } else {
    alert("Tab is already saved.");
  }
}

function deleteSavedTab(url) {
  let savedTabs = getSavedTabs();
  savedTabs = savedTabs.filter(tab => tab.url !== url);
  localStorage.setItem(savedTabsKey, JSON.stringify(savedTabs));
}

// Function to populate modal with content, such as iframe titles
function populateModalWithContent(modal, activeContainerFrame) {
  const modalBody = modal.querySelector('.modal-body');
  modalBody.innerHTML = ''; // Clear previous dynamic content

  // Create container for open tabs (if using Chrome extension) or static message
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  modalBody.appendChild(tabsContainer);

  // Populate container with open tabs or static message
  populateOpenTabsOrMessage(tabsContainer, activeContainerFrame);

  // Section for saved tabs
  const savedTabsSection = document.createElement('div');
  savedTabsSection.className = 'saved-tabs-section';
  modalBody.appendChild(savedTabsSection);

  // Title for the saved tabs section
  const savedTabsTitle = document.createElement('h3');
  savedTabsTitle.textContent = 'Saved Tabs';
  savedTabsSection.appendChild(savedTabsTitle);

  // Container for saved tabs
  const savedTabsContainer = document.createElement('div');
  savedTabsContainer.className = 'saved-tabs-container';
  savedTabsSection.appendChild(savedTabsContainer);

  // Fetch and display saved tabs
  const savedTabs = getSavedTabs();
  if (savedTabs.length > 0) {
    savedTabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'modal-url-option saved-tab';

      // Create a span for the tab title
      const titleSpan = document.createElement('span');
      titleSpan.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, '');      // Remove "- Google Sheets," "- Google Docs," or "- Google Slides" from the title
      titleSpan.className = 'tab-title'; // Add class for styling
      tabItem.appendChild(titleSpan);

      // Create and append the delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button'; // Optionally, add class for styling
      deleteButton.onclick = () => {
        deleteSavedTab(tab.url);
        tabItem.remove(); // Remove this tab item from the modal
      };
      tabItem.appendChild(deleteButton);

      savedTabsContainer.appendChild(tabItem);
    });
  } else {
    savedTabsContainer.textContent = 'No saved tabs.';
  }
}

function populateOpenTabsOrMessage(tabsContainer, activeContainerFrame) {
  // The search input and tab querying logic previously inside populateModalWithContent
  if (isChromeExtension) {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tabs...';
    searchInput.className = 'modal-search-input';
    tabsContainer.appendChild(searchInput);

    // Filter tabs based on search input
    searchInput.addEventListener('keyup', () => {
      const filterText = searchInput.value.toLowerCase();
      const tabItems = tabsContainer.querySelectorAll('.modal-url-option');
      tabItems.forEach(item => {
        const title = item.querySelector('.tab-title').textContent.toLowerCase();
        item.style.display = title.includes(filterText) ? '' : 'none';
      });
    });

    chrome.tabs.query({}, function (tabs) {
      const uniqueTabs = tabs.reduce((acc, current) => {
        const x = acc.find(item => item.title === current.title);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      const sortedTabs = uniqueTabs.sort((a, b) => a.title.localeCompare(b.title));
      appendTabsToModal(sortedTabs, tabsContainer, activeContainerFrame);
    });
  } else {
    // Web environment fallback: Static message
    const extensionMessage = document.createElement('div');
    extensionMessage.className = 'extension-download-prompt';
    extensionMessage.innerHTML = `
      <p>⚠ You're using webview. Get the full functionality by adding the Chrome extension.</p>
      <a href="https://chrome.google.com/webstore/detail/google-docs-splitview/mhekpeihiapfhjefakclpbmdofbmldcb" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="download-extension-btn">Add to Chrome</a>
    `;
    tabsContainer.appendChild(extensionMessage);
  }
}


function appendTabsToModal(tabs, tabsContainer, activeContainerFrame) {
  let validTabsFound = false;

  // Use 'tabs' instead of 'sortedTabs'
  tabs.forEach(function (tab) {
    // Check if the tab's URL matches Google Docs, Sheets, or Slides
    if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
      validTabsFound = true;
      const tabItem = document.createElement('div');
      tabItem.className = 'modal-url-option'; // Use your existing class for styling

      // Create an image element for the favicon
      const favicon = document.createElement('img');
      favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
      favicon.className = 'favicon'; // Use this class for additional styling (size, margin, etc.)
      favicon.alt = 'Favicon'; // Alternative text for accessibility

      // Create a span element for the tab's title
      const titleSpan = document.createElement('span');
      titleSpan.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Remove "- Google Sheets," "- Google Docs," or "- Google Slides" from the title
      titleSpan.className = 'tab-title'; // Use this class for styling

      // Create a button to open new tabs
      const plusButton = createPlusButton(activeContainerFrame, tab.url); // Corrected to use 'activeContainerFrame'

      const saveButton = createSaveButton(tab.url, tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, ''));

      // Append the favicon, title span, and plus button to the tabItem
      tabItem.appendChild(favicon);
      tabItem.appendChild(titleSpan);
      tabItem.appendChild(plusButton);
      tabItem.appendChild(saveButton);

      // Event listener for clicking a tabItem
      tabItem.addEventListener('click', () => {
        const iframe = activeContainerFrame.querySelector('iframe');
        if (iframe) {
          iframe.src = tab.url; // Update the iframe source to the selected URL
        }

        // Update the URL
        updateBrowserURL();

        // Update the title in the toolbar associated with the active container frame
        const titleElement = activeContainerFrame.querySelector('.url-text');
        if (titleElement) {
          // First, check if a saved title is available for the tab's URL
          const savedTitle = getSavedTabTitle(tab.url);

          if (savedTitle) {
            // If a saved title exists, use it
            console.log(`Using saved title for URL ${tab.url}: ${savedTitle}`);
            titleElement.textContent = savedTitle;
          } else {
            // If no saved title exists, fall back to the tab's title
            console.log(`No saved title found for URL ${tab.url}. Using the fetched title.`);
            titleElement.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, ''); // Clean up the fetched title
          }
        }

        // Hide the modal after selection
        closeModal(modal);
      });

      tabsContainer.appendChild(tabItem); // Append to the modal content
    }
  });

  if (!validTabsFound) {
    tabsContainer.textContent = 'No Google Docs, Sheets, or Slides tabs found.';
  }
}

// Function to adjust modal position based on the active container frame's bounds
export function adjustModalPosition(modal, activeContainerFrame) {
  if (!activeContainerFrame) return; // Ensure there's an active container frame

  console.log('adjusting NOW');
  // Assuming the sidebar element is identifiable by the class name 'sidebar'
  const sidebar = document.querySelector('.sidebar');
  const isSidebarClosed = sidebar.classList.contains('close');

  // Determine the sidebar's width based on its open or closed state
  // Using 300x for open and 78px for closed as indicated in your CSS
  const sidebarWidth = isSidebarClosed ? 78 : 300;

  // console.log('Starting adjustment of modal');
  const rect = activeContainerFrame.getBoundingClientRect();
  modal.style.position = 'absolute';
  modal.style.top = `${rect.top}px`;
  modal.style.left = `${rect.left - sidebarWidth}px`;
  modal.style.width = `${rect.width}px`;
  modal.style.height = `${rect.height}px`;
  modal.style.display = 'block';
}

// Event listener for clicks outside the modal to close it
export function setupModalDismissal(modal, closeModalCallback) {
  modal.addEventListener('click', function (event) {
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

// Planned functionality to update URL bar for easy sharing

export function updateBrowserURL() {
  let newURL;
  if (isChromeExtension) {
    newURL = 'viewer.html?urls=' + encodeAndJoinFrameURLs();
  } else {
    newURL = '?urls=' + encodeAndJoinFrameURLs();
  }

  const state = { page: newURL };
  const title = ''; // Optional: You can set a title for the new state
  const url = newURL; // The new URL you want to show in the browser

  history.pushState(state, title, url);
}

export function encodeAndJoinFrameURLs() {
  // Select all iframe elements within the document
  const iframes = document.querySelectorAll('iframe');
  const encodedURLs = [];
  // console.log('encoding');

  // Iterate over each iframe to access its URL
  iframes.forEach((iframe) => {
    // Get the iframe's src attribute, which contains its URL
    const url = iframe.src;
    // Encode the URL
    const encodedUrl = encodeURIComponent(url);
    // Add the encoded URL to the array
    encodedURLs.push(encodedUrl);
    // console.log(encodedURLs)
  });

  // Join the encoded URLs with a comma
  const result = encodedURLs.join(',');

  // Here you can return the result or do something else with it
  return result;
}

function createPlusButton(iframeContainer, url) {
  const plusButton = document.createElement('button');
  plusButton.className = 'add-frame-button';
  plusButton.innerHTML = '<i class="bx bx-add-to-queue"></i>'; // BoxIcons plus icon
  plusButton.onclick = (event) => {
    // Assume `addNewFrame` is a function that handles adding a new frame
    // console.log("adding new frame");
    event.stopPropagation(); // Prevent the click from bubbling up to parent elements
    addNewFrame(url);

  };
  return plusButton;
}

function createSaveButton(url, title) {
  const saveButton = document.createElement('button');
  saveButton.className = 'save-button';
  saveButton.innerHTML = '<i class="bx bx-save"></i>'; // BoxIcons plus icon
  saveButton.onclick = (event) => {
    event.stopPropagation(); // Prevent the click from bubbling up to parent elements
    saveTab(url, title); // Pass an object with url and title to match `saveTab` function's parameter
    updateSavedTabsDisplay(); // Refresh the saved tabs display

  };
  return saveButton;
}

export function addNewFrame(url) {
  const iframeContainer = document.getElementById('iframeContainer'); // Ensure this is the correct container element ID
  if (!iframeContainer) {
    console.error('Iframe container not found');
    return;
  }

  const index = iframeContainer.querySelectorAll('.url-container').length;
  const containerFrame = createIframeContainer(url, index, iframeContainer);
  // console.log('ContainerFrame and iFrameCreated')

  closeModal(modal);

  createToolbar(containerFrame, url); // Assuming createToolbar also appends the toolbar to the containerFrame
  setupIframe(containerFrame, url);

  // If it's not the first iframe, create and insert a new divider
  if (index > 0) {
    const divider = document.createElement('div');
    divider.className = 'iframe-divider';
    iframeContainer.insertBefore(divider, containerFrame); // Insert the divider before the new frame
    makeDividerDraggable(divider, iframeContainer, updateIframeProportions); // Make the new divider draggable
  }

  updateContainerFramesDataId(iframeContainer);
  // console.log('ContainerFrames Updated')

  updateDividers(iframeContainer);

  updateBrowserURL(); // If you have a function to update the browser's address bar
  // console.log('BrowserUpdated')
}
