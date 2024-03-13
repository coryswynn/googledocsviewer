// iframeManager.js: Manages creation and updates of iframes.

import { adjustModalPosition } from './modalManager.js';
import { getActiveContainerFrame } from './init.js'; // Adjust the path as necessary


// Function to create and return a container for the iframe
export function createIframeContainer(url, index, iframeContainer, dragStartCallback, dragEnterCallback, dragOverCallback, dragLeaveCallback, dropCallback) {
    const containerFrame = document.createElement('div');
    containerFrame.className = 'url-container';
    containerFrame.setAttribute('data-id', index);
    iframeContainer.appendChild(containerFrame);
  
    return containerFrame;
  }
  
  // Function to create and setup an iframe inside the container
  export function setupIframe(containerFrame, url) {
    console.log('starting')
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.flex = "1";
    containerFrame.appendChild(iframe);

    console.log(`Iframe added for URL: ${url}`);

    return iframe;
  }
  
  // Function to update 'data-id' attributes on container frames
  export function updateContainerFramesDataId(iframeContainer) {
    const containerFrames = iframeContainer.querySelectorAll('.url-container');
    
    console.log("Before update:");
    containerFrames.forEach((frame) => {
        console.log(frame.getAttribute('data-id'));
    });
    
    containerFrames.forEach((containerFrame, index) => {
      containerFrame.setAttribute('data-id', index);
    });

    console.log("After update:");
        containerFrames.forEach((frame) => {
            console.log(frame.getAttribute('data-id'));
    });
  }
  
  // Function to make a divider draggable and update iframe proportions
  export function makeDividerDraggable(divider, iframeContainer, updateIframeProportions) {
    divider.addEventListener('mousedown', function onMouseDown(e) {
        e.preventDefault(); // Prevent text selection during drag

        // Capture the starting mouse position
        let startX = e.clientX;
        let prevIframe = divider.previousElementSibling;
        let nextIframe = divider.nextElementSibling;
        let prevWidth = prevIframe.clientWidth;
        let nextWidth = nextIframe.clientWidth;

        // Disable pointer events on all iframes to prevent interference
        document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');
        console.log('Drag started');

        // Define what happens when the mouse is moved
        function onMouseMove(e) {
            let dx = e.clientX - startX;
            console.log(`Dragging... DeltaX: ${dx}px`);

            let newPrevWidth = Math.max(prevWidth + dx, 0);
            let newNextWidth = Math.max(nextWidth - dx, 0);

            prevIframe.style.width = `${newPrevWidth}px`;
            nextIframe.style.width = `${newNextWidth}px`;
        }

        // Define what happens when the mouse button is released
        function onMouseUp() {
            // Re-enable pointer events
            document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = '');
            
            // Remove the event listeners
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            console.log('Drag ended');


            // Update iframe proportions based on the new sizes
            updateIframeProportions(iframeContainer);
        }

        // Attach the event listeners for mouse move and mouse up
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
  }
  
  // Function to update iframes' proportions based on current sizes
  export function updateIframeProportions(iframeContainer, totalWidth, initialProportions) {
    const iframes = iframeContainer.querySelectorAll('.url-container');
    let totalProportionalWidth = 0;
  
    iframes.forEach((iframe, index) => {
      let proportionalWidth = (iframe.offsetWidth / totalWidth) * 100;
      totalProportionalWidth += proportionalWidth;
      initialProportions[index] = proportionalWidth;
      if (index === iframes.length - 1 && totalProportionalWidth !== 100) {
        initialProportions[index] = 100 - (totalProportionalWidth - proportionalWidth);
      }
    });
  }
  
  // Function to dynamically update the positions of dividers according to the current order of iframes
  export function updateDividers(iframeContainer) {
    // Remove existing dividers
    console.log('Starting update dividers');
    const existingDividers = iframeContainer.querySelectorAll('.iframe-divider');
    existingDividers.forEach(divider => divider.remove());
  
    // Add new dividers and make them draggable
    const containerFrames = iframeContainer.querySelectorAll('.url-container');
    containerFrames.forEach((container, index) => {
      if (index < containerFrames.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'iframe-divider';
        iframeContainer.insertBefore(divider, container.nextSibling);
        makeDividerDraggable(divider, iframeContainer, updateIframeProportions);
      }
    });
    console.log('Dividers updated');
  }

  // Function to create and insert a divider in the DOM
  export function createDivider(iframeContainer, index, urlsLength) {
    let divider; // Declare `divider` outside the if block to ensure it's in the function scope

    // If it's not the last iframe, add a divider
    if (index < urlsLength - 1) {
        divider = document.createElement('div');
        divider.className = 'iframe-divider'; // Use this class for styling
        iframeContainer.appendChild(divider);
        console.log(`Divider added between iframe ${index + 1} and iframe ${index + 2}`);
    }

    return divider; // Now `divider` is always defined when the function returns
  }

  export function setupWindowResizeListener(iframeContainer, updateIframeProportions, adjustModalPosition, modal) {
    window.addEventListener('resize', () => {
      console.log('window resized')
      const activeContainerFrame = getActiveContainerFrame();
      const totalWidth = iframeContainer.offsetWidth; // Get the new total width of the iframe container
      const iframes = iframeContainer.querySelectorAll('iframe');
  
      // Total proportional width should be recalculated based on the new container size
      let totalProportionalWidth = 0;
      let initialProportions = [];

      iframes.forEach(iframe => {
        const proportionalWidth = parseFloat(iframe.style.flexBasis); // Assuming flexBasis is being used to store proportion
        totalProportionalWidth += proportionalWidth;
      });
  
      iframes.forEach((iframe, index) => {
        const proportionalWidth = parseFloat(iframe.style.flexBasis); // Get the stored proportion
        // Use flex-basis for adjusting sizes to maintain consistency with divider dragging
        const newFlexBasis = `${(proportionalWidth / totalProportionalWidth) * 100}%`;
        iframe.style.flex = `1 1 ${newFlexBasis}`;
      });

      console.log('updating proportions')
      updateIframeProportions(iframeContainer, totalWidth, initialProportions)
      adjustModalPosition(modal, activeContainerFrame);

    });
  }