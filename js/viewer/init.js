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

    // Apply dark mode and then toggle iframe dark mode
    applyDarkMode(() => {
      toggleIframeDarkMode(); // Ensure iframe dark mode is applied only after body dark mode is set
    });
  
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
function applyDarkMode(callback) {
  // Set an explicit default state first (light mode)
  const bodyElement = document.body;
  bodyElement.classList.remove('dark-mode'); // Remove dark-mode by default

  // Then fetch the darkModeEnabled value from chrome storage
  chrome.storage.local.get(['darkModeEnabled'], function (result) {
    const darkModeEnabled = (result.darkModeEnabled !== undefined && result.darkModeEnabled !== null) ? result.darkModeEnabled : false;

    console.log("Dark Mode Enabled from storage:", darkModeEnabled); // Debugging log

    // Apply dark-mode class only if darkModeEnabled is true
    if (darkModeEnabled) {
      console.log("Adding dark-mode class");
      bodyElement.classList.add('dark-mode');
    } else {
      console.log("Dark mode not enabled");
    }

    // Call the callback function (like toggleIframeDarkMode) after applying dark mode
    if (callback && typeof callback === 'function') {
      callback();
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
          toggleIframeDarkMode(); // Also toggle iframe dark mode
      } else {
          bodyElement.classList.remove('dark-mode');
          toggleIframeDarkMode(); // Also toggle iframe dark mode
      }
  }
});

// Add dark mode effect to the iframe
function applyIframeDarkMode(iframe) {
  iframe.style.filter = 'invert(1) hue-rotate(180deg)';
  iframe.style.mixBlendMode = 'difference';  // This blends with the background in a different way
}

// Remove dark mode effect from the iframe
function removeIframeDarkMode(iframe) {
  iframe.style.filter = '';  // Reset filter to its default state
  iframe.style.mixBlendMode = '';  // Reset mix-blend-mode to its default state
}

// Toggle dark mode for all iframes
export function toggleIframeDarkMode() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
      const isDarkMode = document.body.classList.contains('dark-mode');
      if (isDarkMode) {
          applyIframeDarkMode(iframe);
      } else {
          iframe.style.filter = ''; // Reset to default
          removeIframeDarkMode(iframe);
      }
  });
}