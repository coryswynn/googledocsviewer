import { updateContainerFrameTitle } from './urlManager.js';
import { setActiveContainerFrame } from './init.js'; // Adjust the path as needed
import { updateContainerFramesDataId, updateDividers, toggleWelcomeMessage, updateIframeProportions, updateBrowserURLWithProportions } from './iframeManager.js';
import { updateBrowserURL, addNewFrame } from './modalManager.js';
import {
    closeModal,
    clearAndDisplayModal,
    displayModal,
    adjustModalPosition,
    setupModalDismissal,
    encodeAndJoinFrameURLs,
    getSavedTabTitle
} from './modalManager.js';
import { registerScrollableFrame, syncScrollStateToFrame } from './scrollSync.js';
const isScrollSyncEnabled = localStorage.getItem('isScrollSyncEnabled') === 'true';

const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Create the toolbar
export function createToolbar(containerFrame, url) {
    const toolbar = document.createElement('div');
    toolbar.className = 'url-toolbar';
    containerFrame.appendChild(toolbar);

    // Store the URL in the container frame's dataset
    containerFrame.dataset.url = url;
    // Also store the original URL in case we need it
    containerFrame.dataset.originalUrl = url;

    // Add the draggable handle
    const dragHandle = createDragHandle();
    toolbar.appendChild(dragHandle);

    // Create the URL title span using the updated URL from the container's dataset
    const urlTitle = createUrlTitle(containerFrame.dataset.url, containerFrame);
    toolbar.appendChild(urlTitle);

    // Add a refresh frame button
    const refreshButton = createRefreshButton(containerFrame);
    toolbar.appendChild(refreshButton);

    // Add a duplicate frame button
    const duplicateButton = createDuplicateButton(containerFrame);
    toolbar.appendChild(duplicateButton);

    // Add the focus mode toggle button
    const focusModeButton = createFocusModeButton();
    toolbar.appendChild(focusModeButton);

    // Add the copy, pop out, and fullscreen buttons
    const copyButton = createCopyButton(containerFrame);
    toolbar.appendChild(copyButton);

    const popOutButton = createPopOutButton(containerFrame);
    toolbar.appendChild(popOutButton);

    // const shareButton = createShareButton('');
    // toolbar.appendChild(shareButton);

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

// Improved fetch with better error handling and timeout
function fetchWithRetry(url, retries = 3, timeout = 5000) {
    console.log(`Fetching URL: ${url}`);

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.text();
        })
        .catch(err => {
            clearTimeout(timeoutId);
            const isLastAttempt = retries <= 1;
            console.log(`Fetch attempt failed for ${url}. Retries left: ${retries - 1}.`, err);
            if (isLastAttempt) throw err;
            // Wait a bit before retrying
            return new Promise(resolve => setTimeout(resolve, 500))
                .then(() => fetchWithRetry(url, retries - 1, timeout));
        });
}

function createUrlTitle(url, containerFrame) {
    let urlTitle = containerFrame.querySelector('.url-text');
    // If a title element already exists and its text is not a placeholder, assume it's loaded and return it
    if (
        urlTitle &&
        containerFrame.dataset.titleLoaded === 'true' &&
        urlTitle.textContent &&
        !['Loading title...', 'Title unavailable', 'Resolving...'].includes(urlTitle.textContent)
    ) {
        return urlTitle;
    }

    // If no title element exists, create one
    if (!urlTitle) {
        urlTitle = document.createElement('span');
        urlTitle.className = 'url-text';
        urlTitle.title = 'Add or Replace Frame';
        containerFrame.appendChild(urlTitle);
    }

    // Set loading text only when we need to load/update the title
    // Mark as not yet loaded, and show loading indicator
    containerFrame.dataset.titleLoaded = 'false';
    urlTitle.textContent = 'Loading title...';

    // Try multiple methods to get the title, in order of preference
    loadTitleFromAllSources(url, containerFrame);

    urlTitle.addEventListener('click', () => {
        // Get the modal element by ID
        const modal = document.getElementById('modal');
        if (!modal) {
            console.error('Modal element not found');
            return;
        }

        clearAndDisplayModal(modal, containerFrame, (modal, activeContainerFrame) => {
            setActiveContainerFrame(containerFrame);
            displayModal(modal, activeContainerFrame);
            setupModalDismissal(modal, closeModal);
        });
    });

    return urlTitle;
}

// New function to try all title sources in sequence
function loadTitleFromAllSources(url, containerFrame) {
    // 1. First try bookmark
    const bookmark = getBookmarkByURL(url);
    if (bookmark) {
        updateContainerFrameTitle(containerFrame, bookmark.name);
        containerFrame.dataset.titleLoaded = 'true';
        return;
    }

    // 2. Then try saved tab
    const savedTitle = getSavedTabTitle(url);
    if (savedTitle) {
        updateContainerFrameTitle(containerFrame, savedTitle);
        containerFrame.dataset.titleLoaded = 'true';
        return;
    }

    // 3. Then try Chrome tabs API (if extension)
    if (isChromeExtension && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
            const matchingTab = tabs.find(tab => tab.url && tab.url.startsWith(url));
            if (matchingTab && matchingTab.title) {
                const newTitle = cleanTitle(matchingTab.title);
                updateContainerFrameTitle(containerFrame, newTitle);
                containerFrame.dataset.titleLoaded = 'true';
            } else {
                // 4. If all else fails, fetch the page
                fetchAndUpdateTitle(url, containerFrame);
            }
        });
    } else {
        // 4. If not extension, just fetch the page
        fetchAndUpdateTitle(url, containerFrame);
    }
}

// Helper to clean/format title text
function cleanTitle(title) {
    return title
        .replace(/( - Google (Sheets|Docs|Slides|Forms))/, '')
        .replace(/( - Google Drive)/, '')
        .trim();
}

// Helper to fetch and update title
function fetchAndUpdateTitle(url, containerFrame) {
    // Set a timeout to prevent titles getting stuck on "Loading title..."
    const loadingTimeout = setTimeout(() => {
        const urlText = containerFrame.querySelector('.url-text');
        if (urlText && (urlText.textContent === 'Loading title...' || urlText.textContent === 'Resolving...')) {
            console.warn('Title loading timed out, setting fallback title');
            // Extract a simple title from the URL as fallback
            const urlObj = new URL(url);
            const domainTitle = urlObj.hostname.replace('www.', '').replace('.com', '');
            const pathTitle = urlObj.pathname.split('/').filter(p => p).pop();
            const fallbackTitle = pathTitle ? `${domainTitle}: ${decodeURIComponent(pathTitle)}` : domainTitle;
            updateContainerFrameTitle(containerFrame, fallbackTitle);
            containerFrame.dataset.titleLoaded = 'true';
        }
    }, 10000); // 10 second timeout

    fetchWithRetry(url)
        .then(html => {
            clearTimeout(loadingTimeout);
            updateTitleFromHtml(html, containerFrame);
        })
        .catch(err => {
            clearTimeout(loadingTimeout);
            console.error('Error fetching title:', err);

            // Extract a simple title from the URL as fallback
            const urlObj = new URL(url);
            const domainTitle = urlObj.hostname.replace('www.', '').replace('.com', '');
            const pathTitle = urlObj.pathname.split('/').filter(p => p).pop();
            const fallbackTitle = pathTitle ? `${domainTitle}: ${decodeURIComponent(pathTitle)}` : domainTitle;

            updateContainerFrameTitle(containerFrame, fallbackTitle);

            // Retry once more after a delay for slow-loading documents
            setTimeout(() => {
                const currentTitle = containerFrame.querySelector('.url-text')?.textContent;
                // Only retry if we're still using the fallback title
                if (currentTitle === fallbackTitle) {
                    fetchWithRetry(url)
                        .then(html => updateTitleFromHtml(html, containerFrame))
                        .catch(() => {
                            // Give up after second attempt
                            console.error('Final attempt to fetch title failed');
                        });
                }
            }, 3000);
        });
}

function updateTitleFromHtml(html, containerFrame) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const titleTag = doc.querySelector('title');
        if (titleTag && titleTag.innerText) {
            const newTitle = cleanTitle(titleTag.innerText);
            updateContainerFrameTitle(containerFrame, newTitle);
        } else {
            updateContainerFrameTitle(containerFrame, 'Title unavailable');
        }
    } catch (parseError) {
        console.error('Error processing fetched HTML:', parseError);
        updateContainerFrameTitle(containerFrame, 'Title unavailable');
    }
}

function createRefreshButton(containerFrame) {
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-frame-button';
    refreshButton.title = 'Refresh Frame';
    refreshButton.innerHTML = '<i class="bx bx-refresh"></i>'; // Icon for refresh

    refreshButton.onclick = () => {
        // Save focus mode state before refresh
        const focusModeEnabled = containerFrame.dataset.focusModeEnabled === 'true';
        const focusButton = containerFrame.querySelector('.focus-mode-button');
        const isFocusActive = focusButton && focusButton.classList.contains('active');

        const iframe = containerFrame.querySelector('iframe');
        if (iframe) {
            const currentSrc = iframe.src;
            const newSrc = currentSrc.includes('?') ? `${currentSrc}&_ts=${Date.now()}` : `${currentSrc}?_ts=${Date.now()}`;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = newSrc;
            }, 10);

            // Also refresh the title
            setTimeout(() => {
                const urlTitle = containerFrame.querySelector('.url-text');
                if (urlTitle) {
                    urlTitle.textContent = 'Refreshing...';
                    loadTitleFromAllSources(containerFrame.dataset.url, containerFrame);
                }
            }, 1000);

            // If focus mode was active, reapply it after iframe reloads
            if (focusModeEnabled || isFocusActive) {
                iframe.addEventListener('load', () => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ action: 'enterMode' }, '*');

                        // Update the button state
                        if (focusButton) {
                            focusButton.classList.add('active');
                        }
                    }
                }, { once: true });
            }
        }
    };

    return refreshButton;
}

function createDuplicateButton(containerFrame) {
    const duplicateButton = document.createElement('button');
    duplicateButton.className = 'duplicate-frame-button';
    duplicateButton.title = 'Duplicate Frame';
    duplicateButton.innerHTML = '<i class="bx bx-duplicate"></i>'; // Icon for duplicating

    duplicateButton.onclick = () => {
        if (containerFrame) {
            const currentUrl = containerFrame.dataset.url;

            // Preserve original title state
            const originalTitleSpan = containerFrame.querySelector('.url-text');
            const originalTitleText = originalTitleSpan?.textContent;
            const originalTitleLoaded = containerFrame.dataset.titleLoaded;

            // Add new frame
            addNewFrame(currentUrl);

            // Restore title state on original frame
            if (originalTitleSpan && originalTitleText) {
                originalTitleSpan.textContent = originalTitleText;
            }
            if (originalTitleLoaded) {
                containerFrame.dataset.titleLoaded = originalTitleLoaded;
            }

            // Wait for the new frame to appear and resolve its title
            setTimeout(() => {
                const newContainer = document.querySelectorAll('.url-container');
                const lastFrame = newContainer[newContainer.length - 1];
                if (!lastFrame) return;

                lastFrame.dataset.titleLoaded = 'false';
                const url = lastFrame.dataset.url;
                const titleSpan = lastFrame.querySelector('.url-text');
                if (titleSpan) titleSpan.textContent = 'Loading title...';

                loadTitleFromAllSources(url, lastFrame);
                updateBrowserURL();
            }, 0);
        }
    };
    return duplicateButton;
}

function createFocusModeButton() {
    const button = document.createElement('button');
    button.className = 'focus-mode-button';
    button.title = 'Toggle Focus Mode';
    button.innerHTML = '<i class="bx bx-disc"></i>'; // Use the same glyph as in focusMode.js

    // Add click handler
    button.addEventListener('click', () => {
        const containerFrame = button.closest('.url-container');
        if (!containerFrame) return;

        const iframe = containerFrame.querySelector('iframe');
        if (!iframe) return;

        // Always use postMessage for cross-origin communication
        try {
            // Check if the iframe is loaded
            if (!iframe.contentWindow) {
                console.warn('Iframe content window not available');
                return;
            }

            // Toggle focus mode state in the container's dataset
            const isActive = button.classList.contains('active');
            containerFrame.dataset.focusModeEnabled = (!isActive).toString();

            // Send message to toggle focus mode
            const message = {
                action: isActive ? 'exitMode' : 'enterMode'
            };

            iframe.contentWindow.postMessage(message, '*');
            console.log(`Sent ${message.action} message to iframe`);

            // Toggle button state
            button.classList.toggle('active');

        } catch (e) {
            console.warn('Error toggling focus mode:', e);
        }
    });

    // Function to sync focus mode state for a specific frame
    const syncFocusModeState = (iframe, button) => {
        if (!iframe || !iframe.contentWindow) return;

        const containerFrame = iframe.closest('.url-container');
        if (!containerFrame) return;

        const isEnabled = containerFrame.dataset.focusModeEnabled === 'true' ||
            button.classList.contains('active');

        if (isEnabled) {
            iframe.contentWindow.postMessage({ action: 'enterMode' }, '*');
        }
    };

    // Listen for messages from the iframe to sync button state
    window.addEventListener('message', (event) => {
        // Check if the message is from one of our iframes
        const iframe = Array.from(document.querySelectorAll('iframe'))
            .find(iframe => iframe.contentWindow === event.source);

        if (!iframe) return;

        // Update button state based on iframe's focus mode state
        if (event.data.type === 'focusModeState') {
            const containerFrame = iframe.closest('.url-container');
            if (!containerFrame) return;

            const button = containerFrame.querySelector('.focus-mode-button');
            if (button) {
                button.classList.toggle('active', event.data.isEnabled);
                containerFrame.dataset.focusModeEnabled = event.data.isEnabled.toString();
            }
        }
    });

    // Initialize the button state after creation
    // We need to defer this to ensure the button is in the DOM
    setTimeout(() => {
        const containerFrame = button.closest('.url-container');
        if (containerFrame) {
            // Initialize the focus mode state
            containerFrame.dataset.focusModeEnabled = 'false';

            const iframe = containerFrame.querySelector('iframe');
            if (iframe) {
                iframe.addEventListener('load', () => {
                    // When iframe loads, check if we need to activate focus mode
                    if (containerFrame.dataset.focusModeEnabled === 'true') {
                        syncFocusModeState(iframe, button);
                    }
                });
            }
        }
    }, 0);

    return button;
}

function createCopyButton(containerFrame) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-url-button';
    copyButton.innerHTML = '<i class="bx bx-paste bx-flip-horizontal"></i>'; // BoxIcons copy icon
    //copyButton.innerHTML = '&#128203;'; // Unicode icon
    copyButton.title = 'Copy URL';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(containerFrame.dataset.url).then(() => {
            const toast = document.createElement('div');
            toast.textContent = 'URL copied to clipboard!';
            toast.style.position = 'absolute';
            toast.style.bottom = '10px';
            toast.style.right = '10px';
            toast.style.background = '#333';
            toast.style.color = '#fff';
            toast.style.padding = '8px 14px';
            toast.style.borderRadius = '4px';
            toast.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
            toast.style.zIndex = '1000';
            toast.style.fontSize = '13px';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';

            containerFrame.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.addEventListener('transitionend', () => {
                    toast.remove();
                }, { once: true });
            }, 2000);
        });
    };
    return copyButton;
}

function createPopOutButton(containerFrame) {
    const popOutButton = document.createElement('button');
    popOutButton.className = 'pop-out-button';
    popOutButton.title = 'Pop Out Frame';
    popOutButton.innerHTML = '<i class="bx bx-link-external"></i>'; // BoxIcons external link icon
    // popOutButton.innerHTML = '&#8599;'; // Unicode icon
    popOutButton.onclick = () => {
        window.open(containerFrame.dataset.url, '_blank');
    };
    return popOutButton;
}

export function createShareButton() {
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button';
    shareButton.title = 'Share Frame';
    shareButton.innerHTML = '<i class="bx bx-share bx-flip-horizontal"></i>'; // BoxIcons external link icon

    shareButton.onclick = () => {
        console.log("Share button clicked.");

        // Get all container frames
        const containerFrames = document.querySelectorAll('.url-container');
        const iframeContainer = containerFrames[0]?.parentNode;
        
        // Get layout (vertical or horizontal)
        const isVertical = iframeContainer?.style.flexDirection === 'column';
        const layout = isVertical ? 'vertical' : 'horizontal';
        
        // Get the proportions
        const proportions = Array.from(containerFrames)
                                .map(f => f.getAttribute('data-proportional-width') || '0')
                                .join(',');
        
        // Build the share URL with URLs, proportions, and layout
        const frameURLs = encodeAndJoinFrameURLs();
        let newURL = 'https://coryswynn.github.io/SplitViewWeb/?urls=' + frameURLs;
        
        // Add proportions if available
        if (proportions && proportions !== '0') {
            newURL += '&proportions=' + proportions;
        }
        
        // Add layout
        newURL += '&layout=' + layout;

        // Open the share URL in a new tab
        window.open(newURL, '_blank');
    };

    return shareButton;
}

function createFullscreenButton(containerFrame) {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'fullscreen-button';
    fullscreenButton.title = 'Enter Fullscreen';
    fullscreenButton.innerHTML = '<i class="bx bx-area"></i>'; // BoxIcons external link icon

    let initialProportions = [];

    // fullscreenButton.innerHTML = '&#9974;'; // Unicode icon
    fullscreenButton.onclick = () => {
        const isExpanded = containerFrame.classList.contains('expanded');
        // Get the iframeContainer correctly through the parent node
        const iframeContainer = containerFrame.parentNode;
        const containerFrames = iframeContainer.querySelectorAll('.url-container');

        if (!isExpanded) {
            // Store initial proportions if not already expanded
            containerFrames.forEach((cf, index) => {
                let computedStyle = window.getComputedStyle(cf);
                initialProportions[index] = computedStyle.flex; // Use computed style to get actual applied flex value
                console.log('Storing initial proportions: ' + initialProportions[index]);
            });
        }

        containerFrames.forEach((cf) => {
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
                    fullscreenButton.innerHTML = '<i class="bx bx-area"></i>'; // BoxIcons external link icon
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
        
        // Recalculate and update the proportions of the remaining frames
        if (iframeContainer.querySelectorAll('.url-container').length > 0) {
            updateIframeProportions(iframeContainer);
            updateBrowserURLWithProportions();
        }
        
        // Update the browser URL
        updateBrowserURL();

        // Ensure the welcome message is shown if there are no document frames open.
        if (iframeContainer.querySelectorAll('.url-container').length === 0) {
            toggleWelcomeMessage(iframeContainer);
        }
    };
    return closeButton;
}

// Helper function to get the bookmark by URL
export function getBookmarkByURL(url) {
    const sidebarData = JSON.parse(localStorage.getItem('sidebarData')) || { folders: [] };
    for (let folder of sidebarData.folders) {
        const bookmark = folder.bookmarks.find(bookmark => bookmark.url === url);
        if (bookmark) {
            return bookmark;
        }
    }
    return null;
}

// Create a function to update iframe URL and ensure all toolbar components use the correct URL
export function updateIframeURL(containerFrame, newURL) {
    if (!containerFrame || !newURL) {
        console.error('Invalid containerFrame or newURL in updateIframeURL');
        return;
    }

    console.log(`Updating iframe URL from ${containerFrame.dataset.url} to ${newURL}`);

    // Update the dataset URL
    containerFrame.dataset.url = newURL;

    // Update the iframe src
    const iframe = containerFrame.querySelector('iframe');
    if (iframe) {
        // Only update if the URL is different (ignoring cache-busting parameters)
        if (cleanUrl(iframe.src) !== cleanUrl(newURL)) {
            iframe.src = newURL;
        }
    }
    // 🔑 bind scroll sync on the *next load*
    iframe.addEventListener('load', () => {
        registerScrollableFrame(containerFrame, { rebind: true });
        syncScrollStateToFrame(containerFrame, isScrollSyncEnabled);
    }, { once: true });

    // Refresh the title
    const urlTitle = containerFrame.querySelector('.url-text');
    if (urlTitle) {
        urlTitle.textContent = 'Updating...';
        loadTitleFromAllSources(newURL, containerFrame);
    }
}

// Helper function to clean URLs (remove cache-busting parameters)
function cleanUrl(url) {
    try {
        const urlObj = new URL(url);
        // Remove _ts and other cache-busting parameters
        urlObj.searchParams.delete('_ts');
        return urlObj.toString();
    } catch (e) {
        console.error('Error cleaning URL:', e);
        return url;
    }
}

window.addEventListener('message', (event) => {
    if (event.data.type === 'resolveFrameTitle') {
        const { url } = event.data;
        const frame = Array.from(document.querySelectorAll('iframe'))
            .find(f => f.src.startsWith(url));
        if (frame) {
            const container = frame.closest('.url-container');
            const titleSpan = container?.querySelector('.url-text');
            if (titleSpan) titleSpan.textContent = 'Resolving...';
            fetchWithRetry(url).then(html => updateTitleFromHtml(html, container));
        }
    }
});