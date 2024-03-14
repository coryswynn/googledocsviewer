// toolbarActions.js: Deals with toolbar-related actions.

import { updateContainerFrameTitle } from './urlManager.js';
import { setActiveContainerFrame } from './init.js'; // Adjust the path as needed
import { updateContainerFramesDataId, updateDividers} from './iframeManager.js';
import { updateBrowserURL} from './modalManager.js';


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

    const closeButton = createCloseButton(containerFrame);
    toolbar.appendChild(closeButton);

    // Return the complete toolbar
    return toolbar;
}

function createDragHandle() {
    const dragHandle = document.createElement('button');
    dragHandle.className = 'drag-handle';
    dragHandle.title = 'Drag Frame';
    dragHandle.innerHTML = '<i class="bx bx-menu"></i>'; // BoxIcon grip lines icon
    // dragHandle.innerHTML = '&#9776;'; // or any appropriate icon
    dragHandle.setAttribute('draggable', true);
    // Add event listeners for dragging
    return dragHandle;
}

function createUrlTitle(url, containerFrame) {
    const urlTitle = document.createElement('span');
    urlTitle.className = 'url-text';
    urlTitle.textContent = 'Loading title...';
    urlTitle.title = 'Add or Replace Frame';

    // First attempt: Try to get the title from the active tabs
    chrome.tabs.query({}, function(tabs) {
        const matchingTab = tabs.find(tab => tab.url === url);
        if (matchingTab && matchingTab.title) {
            // Directly use the title from the matching tab
            const newTitle = matchingTab.title.replace(/( - Google (Sheets|Docs|Slides))/, '');
            updateContainerFrameTitle(containerFrame, newTitle);
        } else {
            // Second attempt: Fetch the HTML content to parse the title
            fetch(url).then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const titleTag = doc.querySelector('title');
                if (titleTag && titleTag.innerText) {
                    const newTitle = titleTag.innerText.replace(/( - Google (Sheets|Docs|Slides))/, '');
                    updateContainerFrameTitle(containerFrame, newTitle);
                } else {
                    throw new Error('Title tag not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching or parsing URL:', error);
                // Fallback: If both methods fail, show a generic message
                updateContainerFrameTitle(containerFrame, 'Title unavailable');
            });
        }
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
    copyButton.innerHTML = '<i class="bx bx-copy"></i>'; // BoxIcons copy icon
    //copyButton.innerHTML = '&#128203;'; // Unicode icon
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
    popOutButton.title = 'Pop Out Frame';
    popOutButton.innerHTML = '<i class="bx bx-link-external"></i>'; // BoxIcons external link icon
    // popOutButton.innerHTML = '&#8599;'; // Unicode icon
    popOutButton.onclick = () => {
        window.open(url, '_blank');
    };
    return popOutButton;
}

function createFullscreenButton(containerFrame) {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'fullscreen-button';
    fullscreenButton.title = 'Enter Fullscreen';
    fullscreenButton.innerHTML = '<i class="bx bx-fullscreen"></i>'; // BoxIcons external link icon
    
    let initialProportions = [];

    // fullscreenButton.innerHTML = '&#9974;'; // Unicode icon
    fullscreenButton.onclick = () => {
        const isExpanded = containerFrame.classList.contains('expanded');
        const containerFrames = iframeContainer.querySelectorAll('.url-container');


        if (!isExpanded) {
            // Store initial proportions if not already expanded
            containerFrames.forEach((cf, index) => {
                let computedStyle = window.getComputedStyle(cf);
                initialProportions[index] = computedStyle.flex; // Use computed style to get actual applied flex value
                console.log('Storing initial proportions: ' + initialProportions[index]);
            });
        }

        document.querySelectorAll('.url-container').forEach((cf) => {
            if (cf === containerFrame) {
                if (!isExpanded) {
                    cf.classList.add('expanded');
                    cf.style.flex = "1 1 100%";
                    fullscreenButton.innerHTML = '<i class="bx bx-exit-fullscreen"></i>'; // BoxIcons external link icon
                    // fullscreenButton.innerHTML = '&#11138;'; // Change to the 'compress' icon
                    // console.log(`Expanded: Flex: ${cf.style.flex}`);
                    fullscreenButton.title = 'Exit Fullscreen';

                } else {
                    cf.classList.remove('expanded');
                    cf.style.flex = initialProportions[Array.prototype.indexOf.call(containerFrames, cf)] || "1 1 auto";
                    fullscreenButton.innerHTML = '<i class="bx bx-fullscreen"></i>'; // BoxIcons external link icon
                    // fullscreenButton.innerHTML = '&#9974;'; // Change back to the 'expand' icon
                    // console.log(`Restored: Flex: ${cf.style.flex}`);
                    fullscreenButton.title = 'Enter Fullscreen';
                }
            } else {
                cf.style.display = isExpanded ? "" : "none"; // Toggle visibility of other frames
            }
        });
    };

    return fullscreenButton;
}

function createCloseButton(containerFrame) {
    const closeButton = document.createElement('button');
    closeButton.className = 'close-frame-button';
    closeButton.innerHTML = '<i class="bx bx-window-close"></i>'; // BoxIcons close icon
    closeButton.title = 'Close Frame';
    closeButton.onclick = () => {
        const iframeContainer = containerFrame.parentNode;
        
        // Remove the containerFrame from the DOM
        containerFrame.remove();
        // Call function to update the layout, dividers, and frame IDs
        updateContainerFramesDataId(iframeContainer);
        updateDividers(iframeContainer);
        updateBrowserURL();
        
    };
    return closeButton;
}




// Further utilities and helper functions can also be included here as needed
