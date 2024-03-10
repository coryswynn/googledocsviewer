
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const urls = params.get('urls') ? decodeURIComponent(params.get('urls')).split(',') : [];
    const iframeContainer = document.getElementById('iframeContainer');

    // Add modal and modal content
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const modalBody = modal.querySelector('.modal-body');

    let activeContainerFrame = null; // Keep track of the active container frame globally
    
    console.log('URLs to load:', urls);

    // Fill 'initialProportions' of each iFrame with equal proportions for each window
    let initialProportions = [];

    urls.forEach((url, index) => {
        // Create a container for each URL
        const containerFrame = document.createElement('div');
        containerFrame.className = 'url-container'; // Use this class for styling
        iframeContainer.appendChild(containerFrame);

        // Create the toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'url-toolbar'; // Use this class for styling
        containerFrame.appendChild(toolbar); // Add the toolbar to the container frame

        // Create the URL title span
        const urlTitle = document.createElement('span');
        urlTitle.className = 'url-text'; // Use this class for styling
        toolbar.appendChild(urlTitle); // Add to the toolbar
        urlTitle.textContent = 'Loading title...'; // Initial text
        
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const title = doc.querySelector('title').innerText;
                urlTitle.textContent = title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Set the title as the text content
            })
            .catch(error => {
                console.error('Error fetching or parsing URL:', error);
                urlTitle.textContent = 'Title unavailable'; // Fallback text
            });
        
        // **Modal Trigger Setup**
        urlTitle.addEventListener('click', function() {
            activeContainerFrame = containerFrame; // Update the active container frame reference
            clearAndDisplayModal(); // Display the modal
            
        });

        // Add copy URL button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-url-button'; // Use this class for styling
        copyButton.innerHTML = '&#128203;'; // Placeholder icon, replace with actual copy icon
        copyButton.onclick = function() {
        copyButton.title = 'Copy URL'
            navigator.clipboard.writeText(url).then(() => {
                alert('URL copied to clipboard!');
            });
        };
        toolbar.appendChild(copyButton);

        // Add pop out button
        const popOutButton = document.createElement('button');
        popOutButton.className = 'pop-out-button'; // Use this class for styling
        popOutButton.innerHTML = '&#8599;'; // Placeholder icon, replace with actual pop-out icon
        popOutButton.onclick = function() {
            window.open(url, '_blank');
        };
        toolbar.appendChild(popOutButton);

        // Add fullscreen toggle button with an icon
        const fullscreenButton = document.createElement('button');
        fullscreenButton.className = 'fullscreen-button';
        fullscreenButton.innerHTML = '&#9974;' // Placeholder, replace with an actual icon
        toolbar.appendChild(fullscreenButton);

        // Functionality to toggle full-width view
        fullscreenButton.addEventListener('click', function() {
            const isExpanded = containerFrame.classList.contains('expanded');
            document.querySelectorAll('.url-container').forEach((cf, cfIndex) => {
                if (cf === containerFrame) {
                    if (!isExpanded) {
                        updateIframeProportions();
                        cf.classList.add('expanded');
                        cf.style.flex = "1 1 100%";
                        fullscreenButton.innerHTML = '&#11138;'; 
                        console.log(`Expanded: ${cfIndex}, Flex: ${cf.style.flex}`);
                    } else {
                        cf.classList.remove('expanded');
                        // Restore original proportions after exiting full-screen
                        cf.style.flex = `1 1 ${initialProportions[cfIndex]}%`; 
                        fullscreenButton.innerHTML = '&#9974;';
                        console.log(`Restored: ${cfIndex}, Flex: ${cf.style.flex}`);
                    }
                } else {
                    cf.style.display = isExpanded ? "" : "none"; // Toggle visibility of other frames
                }
            });
        });

        // Create and add the iframe below the toolbar
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.flex = "1"; // Ensure iframes are flexible
        containerFrame.appendChild(iframe);

        console.log(`Iframe ${index+1} added for URL: ${url}`);

        // If it's not the last iframe, add a divider
        if (index < urls.length - 1) {
            const divider = document.createElement('div');
            divider.className = 'iframe-divider'; // Assuming you have CSS for this class
            iframeContainer.appendChild(divider);
            console.log(`Divider added between iframe ${index+1} and iframe ${index+2}`);
            
            // Make dividers draggable
            let startX, startWidthPrev, startWidthNext; // Variables to store initial mouse position and widths

            // Event listener for mouse down on the divider
            divider.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Prevent text selection during drag
                startX = e.clientX; // Capture the starting mouse position
                const prevIframe = divider.previousElementSibling; // Get the previous iframe element
                const nextIframe = divider.nextElementSibling; // Get the next iframe element
                let prevWidth = prevIframe.clientWidth; // Get the initial width of the previous iframe
                let nextWidth = nextIframe.clientWidth; // Get the initial width of the next iframe

                // Disable pointer events on all iframes to prevent interference
                document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');

                console.log('Drag started');

                // Function to handle mouse movement during dragging
                function onMouseMove(e) {
                    const dx = e.clientX - startX; // Calculate the change in mouse position
                    console.log(`Dragging... DeltaX: ${dx}px`);
                    
                    // Calculate new widths based on drag delta and convert to flex-basis
                    const newPrevWidth = Math.max(prevWidth + dx, 0); // Prevent negative widths
                    const newNextWidth = Math.max(nextWidth - dx, 0); // Prevent negative widths
                    
                    prevIframe.style.flex = `1 1 ${newPrevWidth}px`; // Update flex-basis for the previous iframe
                    nextIframe.style.flex = `1 1 ${newNextWidth}px`; // Update flex-basis for the next iframe
                };

                // Function to handle mouse up event, i.e., when dragging ends
                function onMouseUp() {
                    // Re-enable pointer events on all iframes
                    document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = '');

                    // Remove event listeners for mousemove and mouseup
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    console.log('Drag ended');
                    updateIframeProportions(); // Update proportions when dragging stops
                }
                
                // Add event listeners for mousemove and mouseup to the document
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    });

    // Function to update iframes' proportions based on current sizes
    function updateIframeProportions() {
        const totalWidth = iframeContainer.offsetWidth; 
        const iframes = document.querySelectorAll('.url-container');
        let totalProportionalWidth = 0;

        iframes.forEach((iframe, index) => {
            let proportionalWidth = (iframe.offsetWidth / totalWidth) * 100;
            totalProportionalWidth += proportionalWidth;
            initialProportions[index] = proportionalWidth; // Store initial proportions
            if (index === iframes.length - 1 && totalProportionalWidth !== 100) {
                // Adjust the last iframe proportion to account for rounding errors
                initialProportions[index] = 100 - (totalProportionalWidth - proportionalWidth);
            }
        });
    }
    
    // Clear modal content and hide modal - Refactor this functionality into a single function
    function closeModal() {
        const modalBody = modal ? modal.querySelector('.modal-body') : null;
        if (modalBody) {
            modalBody.innerHTML = ''; // Clear previous dynamic content
        }
        if (modal) {
            modal.style.display = 'none'; // Hide the modal
        }
    }
    
    // Listen for clicks outside the modal to close it
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close button event listener
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', closeModal);

    function clearAndDisplayModal() {
        // Clear any previous content and then display the modal
        closeModal(); // First, ensure the modal is reset
        displayModal(); // Then display the modal with the new content
    }
    
    function displayModal() {
        console.log("Displaying modal...");

        if (!activeContainerFrame) return; // Ensure there's an active container frame

        // Calculate and set modal position and size based on activeContainerFrame's bounds
        const rect = activeContainerFrame.getBoundingClientRect();
        modal.style.position = 'absolute';
        modal.style.top = `${rect.top}px`;
        modal.style.left = `${rect.left}px`;
        modal.style.width = `${rect.width}px`;
        modal.style.height = `${rect.height}px`;
        modal.style.display = 'block';

        // Populate modal with filtered URLs
        const modalBody = modal.querySelector('.modal-body'); // Reference to the dynamic content area
        console.log("Modal body found:", modalBody);

        modalBody.innerHTML = ''; // Clear previous dynamic content
        console.log("Cleared modal body content.");

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
                        closeModal(); 
                    });
                    modalBody.appendChild(tabItem); // Append to the modal content
                }
            });

            if (!validTabsFound) {
                modalBody.textContent = 'No Google Docs, Sheets, or Slides tabs found.';
            }
        });
    }

    function adjustModalPosition() {
        if (!activeContainerFrame) return; // Ensure there's an active container frame

        // Calculate and set modal position and size based on activeContainerFrame's bounds
        const rect = activeContainerFrame.getBoundingClientRect();
        modal.style.position = 'absolute';
        modal.style.top = `${rect.top}px`;
        modal.style.left = `${rect.left}px`;
        modal.style.width = `${rect.width}px`;
        modal.style.height = `${rect.height}px`;
        modal.style.display = 'block';
    }

    // Window resize event listener to adjust iframe sizes based on their flex-basis
    window.addEventListener('resize', () => {
        const totalWidth = iframeContainer.offsetWidth; // Get the new total width of the iframe container
        const iframes = document.querySelectorAll('iframe');

        // Total proportional width should be recalculated based on the new container size
        let totalProportionalWidth = 0;
        iframes.forEach(iframe => {
            const proportionalWidth = parseFloat(iframe.getAttribute('data-proportional-width')); // Get the stored proportion
            totalProportionalWidth += proportionalWidth;
        });

        iframes.forEach((iframe, index) => {
            const proportionalWidth = parseFloat(iframe.getAttribute('data-proportional-width')); // Get the stored proportion
            // Use flex-basis for adjusting sizes to maintain consistency with divider dragging
            const newFlexBasis = `${(proportionalWidth / totalProportionalWidth) * 100}%`;
            iframe.style.flex = `1 1 ${newFlexBasis}`;
        });

        // Initial call to update proportions when content is loaded
        updateIframeProportions();
        if (modal.style.display === 'block') {
            adjustModalPosition(); // Adjust modal position on window resize
        }

    }); // Close window resize event listener
    updateIframeProportions();
}); // Close DOMContentLoaded event listener
