
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const urls = params.get('urls') ? decodeURIComponent(params.get('urls')).split(',') : [];
    const iframeContainer = document.getElementById('iframeContainer');

    console.log('URLs to load:', urls);

    urls.forEach((url, index) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframeContainer.appendChild(iframe);

        console.log(`Iframe ${index+1} added for URL: ${url}`);
          
        if (index < urls.length - 1) { // Check if it's not the last iframe
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

                    // Update flex-basis to maintain the layout after resizing
                    prevIframe.style.flex = `0 1 ${prevIframe.offsetWidth}px`;
                    nextIframe.style.flex = `0 1 ${nextIframe.offsetWidth}px`;

                    // Remove event listeners for mousemove and mouseup
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    console.log('Drag ended');
                }
                
                // Add event listeners for mousemove and mouseup to the document
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    });
});
