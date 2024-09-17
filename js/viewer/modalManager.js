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
import { getActiveContainerFrame, toggleIframeDarkMode } from './init.js';

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
}

export function getSavedTabs() {
  return JSON.parse(localStorage.getItem(savedTabsKey)) || [];
}

export function getSavedTabTitle(url) {
  const savedTabs = getSavedTabs();
  const foundTab = savedTabs.find(tab => tab.url === url);
  return foundTab ? foundTab.title : null;
}

function saveTab(url, title) {
  const savedTabs = getSavedTabs();
  const tab = { url, title }; // Create an object representing the tab
  if (!savedTabs.some(savedTab => savedTab.url === url)) {
    savedTabs.push(tab);
    localStorage.setItem(savedTabsKey, JSON.stringify(savedTabs));
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
  modalBody.innerHTML = ''; // Clear previous content

  // Create combined container for both open and saved tabs
  const combinedTabsContainer = document.createElement('div');
  combinedTabsContainer.className = 'combined-tabs-container';
  modalBody.appendChild(combinedTabsContainer);

  // // Title for the tabs section
  // const tabsTitle = document.createElement('h3');
  // tabsTitle.textContent = 'Open & Saved Tabs';
  // combinedTabsContainer.appendChild(tabsTitle);

  // Populate open tabs
  populateOpenTabsOrMessage(combinedTabsContainer, activeContainerFrame);

  // Populate saved tabs without duplicating already shown open tabs
  const savedTabs = getSavedTabs();
  appendTabsToModal(savedTabs, combinedTabsContainer, activeContainerFrame, 'Saved Tab');
}

function populateOpenTabsOrMessage(combinedTabsContainer, activeContainerFrame) {
  if (isChromeExtension) {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tabs...';
    searchInput.className = 'modal-search-input';
    combinedTabsContainer.appendChild(searchInput);

    // Filter tabs based on search input
    searchInput.addEventListener('keyup', () => {
      const filterText = searchInput.value.toLowerCase();
      const tabItems = combinedTabsContainer.querySelectorAll('.modal-url-option');
      tabItems.forEach(item => {
        const title = item.querySelector('.tab-title').textContent.toLowerCase();
        item.style.display = title.includes(filterText) ? '' : 'none';
      });
    });

    // Query open tabs from the Chrome extension
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
      appendTabsToModal(sortedTabs, combinedTabsContainer, activeContainerFrame, 'Open Tab'); // Append open tabs
    });
  } else {
    // Fallback for web environment
    const extensionMessage = document.createElement('div');
    extensionMessage.className = 'extension-download-prompt';
    extensionMessage.innerHTML = `
      <p>⚠ You're using webview. Get the full functionality by adding the Chrome extension.</p>
      <a href="https://chrome.google.com/webstore/detail/google-docs-splitview/mhekpeihiapfhjefakclpbmdofbmldcb" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="download-extension-btn">Add to Chrome</a>
    `;
    combinedTabsContainer.appendChild(extensionMessage);
  }
}


function appendTabsToModal(tabs, combinedTabsContainer, activeContainerFrame, type = 'Open Tab') {
  let validTabsFound = false;

  // Sort tabs alphabetically by title, handling undefined titles safely
  tabs.sort((a, b) => {
    const titleA = (a.title || '').toString().trim().toLowerCase(); // Ensure title is a string and not undefined
    const titleB = (b.title || '').toString().trim().toLowerCase(); // Ensure title is a string and not undefined
    return titleA.localeCompare(titleB);
  });

  // Retrieve saved tabs to prevent duplication
  const savedTabs = getSavedTabs();

  tabs.forEach(function (tab) {
    // Check if the tab's URL matches Google Docs, Sheets, or Slides for open tabs
    if (type === 'Open Tab' && !/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
      return; // Skip if it's not a valid open tab
    }

    // If this is an open tab, ensure it's not in the saved tabs
    if (type === 'Open Tab' && savedTabs.some(savedTab => savedTab.url === tab.url)) {
      return; // Skip if this tab is already saved
    }

    validTabsFound = true;
    const tabItem = document.createElement('div');
    tabItem.className = 'modal-url-option'; // Use your existing class for styling

    // Favicon
    const favicon = document.createElement('img');
    favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
    favicon.className = 'favicon';
    tabItem.appendChild(favicon);

    // Title
    const cleanTitle = (tab.title || 'Untitled').toString().trim().replace(/( - Google (Sheets|Docs|Slides))/, ''); // Ensure title is valid
    const titleSpan = document.createElement('span');
    titleSpan.textContent = cleanTitle; 
    titleSpan.className = 'tab-title';
    tabItem.appendChild(titleSpan);

    // Add-frame button
    const plusButton = createPlusButton(activeContainerFrame, tab.url);
    tabItem.appendChild(plusButton);

    // Save button
    const saveButton = createSaveButton(tab.url, cleanTitle);
    tabItem.appendChild(saveButton);

    // Event listener for clicking a tabItem
    tabItem.addEventListener('click', () => {
      const iframe = activeContainerFrame.querySelector('iframe');
      if (iframe) iframe.src = tab.url; // Update the iframe source to the selected URL
      updateBrowserURL();

      const titleElement = activeContainerFrame.querySelector('.url-text');
      if (titleElement) {
        const savedTitle = getSavedTabTitle(tab.url);
        titleElement.textContent = savedTitle || cleanTitle;
      }
      closeModal(modal);
    });

    combinedTabsContainer.appendChild(tabItem); // Append to the modal content
  });

  if (!validTabsFound && type === 'Open Tab') {
    combinedTabsContainer.textContent = 'No Google Docs, Sheets, or Slides tabs found.';
  } else if (!validTabsFound && type === 'Saved Tab') {
    const noSavedTabsMessage = document.createElement('p');
    noSavedTabsMessage.textContent = 'No saved tabs.';
    combinedTabsContainer.appendChild(noSavedTabsMessage);
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
    event.stopPropagation(); // Prevent the click from bubbling up to parent elements
    addNewFrame(url);
  };
  return plusButton;
}


function createSaveButton(url, title) {
  const savedTabs = getSavedTabs(); // Retrieve saved tabs from localStorage
  const isSaved = savedTabs.some(tab => tab.url === url); // Check if the tab is already saved

  const saveButton = document.createElement('button');
  saveButton.className = 'save-button';
  
  // If the tab is saved, show the check-circle icon, otherwise show the save icon
  saveButton.innerHTML = isSaved ? '<i class="bx bxs-check-circle"></i>' : '<i class="bx bx-save"></i>'; 

  saveButton.onclick = (event) => {
    event.stopPropagation(); // Prevent the click from bubbling up to parent elements

    if (saveButton.innerHTML.includes('bx-save')) {
      saveTab(url, title); // Save the tab
      saveButton.innerHTML = '<i class="bx bxs-check-circle"></i>'; // Change to check icon after saving
    } else {
      deleteSavedTab(url); // Remove the tab
      saveButton.innerHTML = '<i class="bx bx-save"></i>'; // Change back to save icon after removing
    }
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
  toggleIframeDarkMode();
}

function appendTabs(tabs, container, type) {
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'modal-url-option'; // Same class as other tab items for consistent styling

      // Favicon
      const favicon = document.createElement('img');
      favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
      favicon.className = 'favicon';
      tabItem.appendChild(favicon);

      // Title
      const titleSpan = document.createElement('span');
      titleSpan.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, ''); // Clean up the title
      titleSpan.className = 'tab-title';
      tabItem.appendChild(titleSpan);

      // Create open button or frame switch for open tabs
      if (type === 'Open Tab') {
        tabItem.onclick = () => {
          const activeContainerFrame = getActiveContainerFrame();
          if (!activeContainerFrame) return;

          const iframe = activeContainerFrame.querySelector('iframe');
          if (iframe) iframe.src = tab.url;
          updateBrowserURL();
          
          const titleElement = activeContainerFrame.querySelector('.url-text');
          if (titleElement) titleElement.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, '');
          
          closeModal(document.querySelector('.modal'));
        };
      }

      // Append the tab to the container
      container.appendChild(tabItem);
    });
  } else {
    const noTabsMessage = document.createElement('p');
    noTabsMessage.textContent = `No ${type} found.`;
    container.appendChild(noTabsMessage);
  }
}