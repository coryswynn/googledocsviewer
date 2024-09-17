// init.js: Services as the application entry point,

import { getURLs } from './urlManager.js';
import {
  createIframeContainer,
  setupIframe,
  updateContainerFramesDataId,
  createDivider,
  makeDividerDraggable,
  updateIframeProportions,
  updateDividers,
  setupWindowResizeListener
} from './iframeManager.js';
import {
  closeModal,
  clearAndDisplayModal,
  displayModal,
  adjustModalPosition,
  setupModalDismissal
} from './modalManager.js';
import { createToolbar } from './toolbarActions.js';
import { initializeDragAndDrop } from './dragAndDrop.js';
import './keyboardShortcuts.js';
import { setupSidebarNavigation } from './sidebar.js';

let activeContainerFrame = null; // Keep track of the active container frame globally

document.addEventListener('DOMContentLoaded', function () {
  const iframeContainer = document.getElementById('iframeContainer');
  const modal = document.getElementById('modal'); // Initialize the modal

  const urls = getURLs(); // This function would parse URL params and return the 'urls' query as an array.
  console.log(urls);

  urls.forEach((url, index) => {
    console.log(index + url);
    const containerFrame = createIframeContainer(url, index, iframeContainer);

    createToolbar(containerFrame, url); // Add toolbar actions (buttons, drag handle) to each iframe container.
    setupIframe(containerFrame, url); // This function sets up the iframe and returns its container.
    if (index < urls.length - 1) {
      const divider = createDivider(iframeContainer, index, urls.length);
      makeDividerDraggable(divider, iframeContainer, updateIframeProportions);
    }
  });

  initializeDragAndDrop(iframeContainer, updateContainerFramesDataId, updateIframeProportions); // Initialize drag and drop functionality for iframe containers.
  setupWindowResizeListener(iframeContainer, updateIframeProportions, adjustModalPosition, modal);

  // Check if the sidebar is enabled
  const sidebarEnabled = localStorage.getItem('sidebarEnabled') === 'true';
    console.log('sidebar status:' + sidebarEnabled)
    setupSidebarNavigation();
});

// Function to get the currently active container frame
export function getActiveContainerFrame() {
  return activeContainerFrame;
}

// Function to set a new active container frame
export function setActiveContainerFrame(frame) {
  activeContainerFrame = frame;
  return activeContainerFrame;
}

// In init.js

// Function to apply dark mode based on local storage or message from popup.js
function applyDarkMode() {
  chrome.storage.local.get(['darkModeEnabled'], function (result) {
      const darkModeEnabled = (result.darkModeEnabled !== undefined && result.darkModeEnabled !== null) ? result.darkModeEnabled : false;
      const bodyElement = document.body;

      console.log("Dark Mode Enabled:", darkModeEnabled); // Debugging log

      // Only add dark-mode class if it was previously enabled
      if (darkModeEnabled) {
          console.log("Adding dark-mode class");
          bodyElement.classList.add('dark-mode');
      } else {
          console.log("Removing dark-mode class");
          bodyElement.classList.remove('dark-mode');
      }
  });
}

// Call applyDarkMode on initial page load
document.addEventListener('DOMContentLoaded', function () {
  applyDarkMode();
});

// Listen for messages from popup.js to toggle dark mode
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleDarkMode") {
      const bodyElement = document.body;

      console.log("Toggling Dark Mode:", request.enabled); // Debugging log

      if (request.enabled) {
          bodyElement.classList.add('dark-mode');
      } else {
          bodyElement.classList.remove('dark-mode');
      }
  }
});