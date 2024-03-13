// toolbarActions.js: Deals with toolbar-related actions.

import { updateContainerFrameTitle } from './urlManager.js';
import { setActiveContainerFrame } from './init.js'; // Adjust the path as needed

import {
    closeModal,
    clearAndDisplayModal,
    displayModal,
    adjustModalPosition,
    setupModalDismissal
  } from './modalManager.js';

// Create the toolbar
export function createToolbar(containerFrame, url) {
    const toolbar = document.createElement('div');
    toolbar.className = 'url-toolbar';
    containerFrame.appendChild(toolbar);

    // Add the draggable handle
    const dragHandle = createDragHandle();
    toolbar.appendChild(dragHandle);

    // Add the URL title span
    const urlTitle = createUrlTitle(url, containerFrame);
    toolbar.appendChild(urlTitle);

    // Add the copy, pop out, and fullscreen buttons
    const copyButton = createCopyButton(url);
    toolbar.appendChild(copyButton);

    const popOutButton = createPopOutButton(url);
    toolbar.appendChild(popOutButton);

    const fullscreenButton = createFullscreenButton(containerFrame);
    toolbar.appendChild(fullscreenButton);

    // Return the complete toolbar
    return toolbar;
}

function createDragHandle() {
    const dragHandle = document.createElement('button');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '&#9776;'; // or any appropriate icon
    dragHandle.setAttribute('draggable', true);
    // Add event listeners for dragging
    return dragHandle;
}

function createUrlTitle(url, containerFrame) {
    const urlTitle = document.createElement('span');
    urlTitle.className = 'url-text';
    urlTitle.textContent = 'Loading title...';

    fetch(url)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = doc.querySelector('title').innerText;
      const newTitle = title.replace(/( - Google (Sheets|Docs|Slides))/, '')
      updateContainerFrameTitle(containerFrame, newTitle );
    })
    .catch(error => {
      console.error('Error fetching or parsing URL:', error);
      updateContainerFrameTitle(containerFrame, 'Title unavailable');
    });

    // Add click event listener for the URL title
    urlTitle.addEventListener('click', () => {
        clearAndDisplayModal(modal, containerFrame, (modal, activeContainerFrame) => {
            setActiveContainerFrame(containerFrame); // Update the active container frame reference
            displayModal(modal, activeContainerFrame); // Call displayModal with the modal and the active container frame
            setupModalDismissal(modal, closeModal); // Setup global modal dismissal functionality
        });
    });

    return urlTitle;
}

function createCopyButton(url) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-url-button';
    copyButton.innerHTML = '&#128203;'; // or any appropriate icon
    copyButton.title = 'Copy URL';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        });
    };
    return copyButton;
}

function createPopOutButton(url) {
    const popOutButton = document.createElement('button');
    popOutButton.className = 'pop-out-button';
    popOutButton.innerHTML = '&#8599;'; // or any appropriate icon
    popOutButton.onclick = () => {
        window.open(url, '_blank');
    };
    return popOutButton;
}

function createFullscreenButton(containerFrame) {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'fullscreen-button';
    fullscreenButton.innerHTML = '&#9974;'; // or any appropriate icon
    fullscreenButton.onclick = () => {
        const isExpanded = containerFrame.classList.contains('expanded');
        document.querySelectorAll('.url-container').forEach((cf) => {
            if (cf === containerFrame) {
                if (!isExpanded) {
                    cf.classList.add('expanded');
                    cf.style.flex = "1 1 100%";
                    fullscreenButton.innerHTML = '&#11138;'; // Change to the 'compress' icon
                    console.log(`Expanded: Flex: ${cf.style.flex}`);
                } else {
                    cf.classList.remove('expanded');
                    cf.style.flex = "1 1 auto"; // Restore original flex setting
                    fullscreenButton.innerHTML = '&#9974;'; // Change back to the 'expand' icon
                    console.log(`Restored: Flex: ${cf.style.flex}`);
                }
            } else {
                cf.style.display = isExpanded ? "" : "none"; // Toggle visibility of other frames
            }
        });
    };

    return fullscreenButton;
}

// Further utilities and helper functions can also be included here as needed
