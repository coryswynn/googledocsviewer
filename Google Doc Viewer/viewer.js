
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const urls = params.get('urls') ? decodeURIComponent(params.get('urls')).split(',') : [];
    const iframeContainer = document.getElementById('iframeContainer');

    console.log('URLs to load:', urls);

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

        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const title = doc.querySelector('title').innerText;
                urlTitle.textContent = title; // Set the title as the text content
            })
            .catch(error => {
                console.error('Error fetching or parsing URL:', error);
                urlTitle.textContent = 'Title unavailable'; // Fallback text
            });

        // Add copy URL button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-url-button'; // Use this class for styling
        copyButton.innerHTML = '&#128203;'; // Placeholder icon, replace with actual copy icon
        copyButton.onclick = function() {
            navigator.clipboard.writeText(url).then(() => {
                alert('URL copied to clipboard!');
            });
        };
        toolbar.appendChild(copyButton);

        // Add pop out button
        const popOutButton = document.createElement('button');
        popOutButton.className = 'pop-out-button'; // Use this class for styling
        popOutButton.innerHTML = '&#9974;'; // Placeholder icon, replace with actual pop-out icon
        popOutButton.onclick = function() {
            window.open(url, '_blank');
        };
        toolbar.appendChild(popOutButton);

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
        const totalWidth = iframeContainer.offsetWidth; // Get the total width of the iframe container
        const iframes = document.querySelectorAll('iframe');
        let totalProportionalWidth = 0; // This will store the total proportional width to help adjust last iframe's width correctly

        iframes.forEach((iframe, index) => {
            let proportionalWidth = iframe.offsetWidth / totalWidth;
            totalProportionalWidth += proportionalWidth; // Add to the total
            iframe.setAttribute('data-proportional-width', proportionalWidth.toString()); // Store proportion as an attribute
            if (index === iframes.length - 1 && totalProportionalWidth !== 1) {
                // Adjust for any rounding errors on the last iframe by setting it to fill the remaining space
                iframe.setAttribute('data-proportional-width', (1 - (totalProportionalWidth - proportionalWidth)).toString());
            }
        });
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

    }); // Close window resize event listener

}); // Close DOMContentLoaded event listener
