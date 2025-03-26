// iframeManager.js: Manages creation and updates of iframes.
// NOTE: To ensure full styling consistency, shared styles like .tab-item, .checkbox, .favicon, and .launch-splitview-button
// should be added to the global CSS stylesheet used across popup and viewer.

import { adjustModalPosition } from './modalManager.js';
import { getActiveContainerFrame } from './init.js'; // Adjust the path as necessary
import { updateBrowserURL } from './modalManager.js'; // Import updateBrowserURL for URL updates


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
    // console.log('starting')
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.flex = "1";
    containerFrame.appendChild(iframe);

    console.log(`Iframe added for URL: ${url}`);
    setupIframeResizeListener(containerFrame);
    toggleWelcomeMessage(containerFrame.parentNode);

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

      // Determine the current orientation
      const isVertical = iframeContainer.style.flexDirection === 'column';

      // Capture the starting mouse position
      let startPos = isVertical ? e.clientY : e.clientX;
      divider.style.transform = ''; // Reset transform
      let prevIframe = divider.previousElementSibling;
      let nextIframe = divider.nextElementSibling;
      let prevSize = isVertical ? prevIframe.clientHeight : prevIframe.clientWidth;
      let nextSize = isVertical ? nextIframe.clientHeight : nextIframe.clientWidth;

      // Disable pointer events on all iframes to prevent interference
      document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');
      console.log('Drag started');
      let animationFrameId = null;
 
      // Define what happens when the mouse is moved
      // Removed latestDelta; will use delta instead
      let rafPending = false;
      
      function onMouseMove(e) {
        let currentPos = isVertical ? e.clientY : e.clientX;
        let delta = currentPos - startPos;
      
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            let newPrevSize = prevSize + delta;
            let newNextSize = nextSize - delta;

            prevIframe.style.flex = `0 0 ${newPrevSize}px`;
            nextIframe.style.flex = `0 0 ${newNextSize}px`;

            // No transform applied; movement is handled via flex resizing
      
            const modal = document.getElementById('modal');
            if (modal && modal.style.display === 'block') {
              adjustModalPosition(modal, getActiveContainerFrame());
            }
      
            rafPending = false;
          });
        }
      }

      // Define what happens when the mouse button is released
      function onMouseUp(event) {
          let currentPos = isVertical ? event.clientY : event.clientX;
          let delta = currentPos - startPos;
 
          let newPrevSize = prevSize + delta;
          let newNextSize = nextSize - delta;
 
          prevIframe.style.flex = `0 0 ${newPrevSize}px`;
          nextIframe.style.flex = `0 0 ${newNextSize}px`;
 
          divider.style.transform = ''; // reset transform
 
          // Re-enable pointer events
          document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = '');
          
          // Remove the event listeners
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          console.log('Drag ended');
 
          // Update iframe proportions based on the new sizes
          updateIframeProportions(iframeContainer);
          
          // Update the URL with the new proportions
          updateBrowserURLWithProportions();
      }

      // Attach the event listeners for mouse move and mouse up
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  });
}

import { addNewFrame } from './modalManager.js';

export function openAddDocumentModal(iframeContainer) {
  const overlay = document.createElement('div');
  overlay.id = 'add-doc-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';

  const modalContent = document.createElement('div');
  modalContent.id = 'add-doc-modal-content';
  modalContent.style.background = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  modalContent.style.minWidth = '425px';
  modalContent.style.maxWidth = '90%';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflowY = 'auto';
  modalContent.style.fontFamily = "'Poppins', sans-serif";

  const tabNav = document.createElement('div');
  tabNav.style.display = 'flex';
  tabNav.style.marginBottom = '10px';

  const tabs = ['Open Docs', 'Paste URL'];
  const tabButtons = [];
  const tabContents = [];

  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.textContent = tab;
    btn.style.flex = '1';
    btn.style.padding = '10px';
    btn.style.cursor = 'pointer';
    btn.style.border = 'none';
    btn.style.backgroundColor = i === 0 ? '#0078d7' : '#e0e0e0';
    btn.style.color = i === 0 ? 'white' : 'black';
    btn.style.fontWeight = 'bold';
    tabButtons.push(btn);
    tabNav.appendChild(btn);
  });

  modalContent.appendChild(tabNav);

  const tabWrapper = document.createElement('div');

  const tab1 = document.createElement('div');
  tab1.style.display = 'block';
  const openDocsList = document.createElement('div');
  openDocsList.id = 'tab-list-wrapper';
  openDocsList.style.overflowY = 'auto';
  openDocsList.style.maxHeight = '300px';
  tab1.appendChild(openDocsList);
  tabContents.push(tab1);

  const tab2 = document.createElement('div');
  tab2.style.display = 'none';
  const urlInput = document.createElement('input');
  const instructions = document.createElement('div');
  instructions.innerHTML = `
    <p style="margin-bottom: 6px; font-weight: 500; font-size: 13px; color: #333;">Add a document with a URL from Google Docs, Sheets, or Slides:</p>
    <ul style="font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 12px; padding-left: 20px;">
      <li><code>https://docs.google.com/document/d/...</code></li>
      <li><code>https://docs.google.com/spreadsheets/d/...</code></li>
      <li><code>https://docs.google.com/presentation/d/...</code></li>
    </ul>
  `;
  tab2.appendChild(instructions);

  urlInput.type = 'text';
  urlInput.placeholder = 'https://docs.google.com/...';
  urlInput.style.width = '100%';
  urlInput.style.padding = '10px';
  urlInput.style.margin = '10px 0';
  urlInput.style.border = '1px solid #ccc';
  urlInput.style.borderRadius = '5px';
  tab2.appendChild(urlInput);
  tabContents.push(tab2);

  tabContents.forEach(tab => tabWrapper.appendChild(tab));
  modalContent.appendChild(tabWrapper);

  tabButtons.forEach((btn, i) => {
    btn.onclick = () => {
      tabButtons.forEach((b, j) => {
        b.style.backgroundColor = j === i ? '#0078d7' : '#e0e0e0';
        b.style.color = j === i ? 'white' : 'black';
        tabContents[j].style.display = j === i ? 'block' : 'none';
      });
    };
  });

  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Add Document';
  confirmButton.className = 'launch-splitview-button';
  confirmButton.onclick = () => {
    let urlToAdd = urlInput.value.trim();
    if (!urlToAdd) {
      alert('Please paste a URL.');
      return;
    }
    addNewFrame(urlToAdd);
    document.body.removeChild(overlay);
  };

  confirmButton.style.padding = '10px 20px';
  confirmButton.style.fontSize = '14px';
  confirmButton.style.fontWeight = '600';
  confirmButton.style.marginTop = '10px';
  confirmButton.style.backgroundColor = '#0078d7';
  confirmButton.style.color = '#fff';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '5px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.transition = 'background-color 0.3s ease';
  confirmButton.onmouseenter = () => { confirmButton.style.backgroundColor = '#005ea6'; };
  confirmButton.onmouseleave = () => { confirmButton.style.backgroundColor = '#0078d7'; };

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.appendChild(confirmButton);
  tab2.appendChild(buttonContainer);  
  overlay.appendChild(modalContent);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  /* Note: CSS classes like .tab-item, .favicon, .checkbox should match styles defined in the popup CSS
     and optionally be included in the main CSS file. */
  function renderDocs(tabs) {
    openDocsList.innerHTML = '';
    tabs.forEach((tab, index) => {
      const label = document.createElement('label');
      label.className = 'tab-item';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.padding = '8px';
      label.style.margin = '5px 0';
      label.style.background = 'white';
      label.style.border = '1px solid #ccc';
      label.style.borderRadius = '5px';
      label.style.transition = 'all 0.2s';
      label.style.cursor = 'pointer';
      label.addEventListener('mouseenter', () => {
          label.style.backgroundColor = '#f0f0f0';
      });
      label.addEventListener('mouseleave', () => {
          label.style.backgroundColor = 'white';
      });
      label.addEventListener('click', () => {
          addNewFrame(tab.url);
          document.body.removeChild(overlay);
      });
 
      const favicon = document.createElement('img');
      favicon.className = 'favicon';
      favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_generic_favicon.ico';
      if (/document/.test(tab.url)) favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_document_favicon.ico';
      else if (/spreadsheets/.test(tab.url)) favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_spreadsheet_favicon.ico';
      else if (/presentation/.test(tab.url)) favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_presentation_favicon.ico';
      favicon.style.marginRight = '8px';
      favicon.style.width = '16px';
      favicon.style.height = '16px';
 
      const title = document.createElement('span');
      title.textContent = tab.title.replace(/ - Google (Docs|Sheets|Slides)/, '');
      title.style.flex = '1';
 
      label.appendChild(favicon);
      label.appendChild(title);
      openDocsList.appendChild(label);
    });
  }

  if (chrome?.tabs?.query) {
    chrome.tabs.query({}, openTabs => {
      const savedTabs = JSON.parse(localStorage.getItem('savedTabs') || '[]');
      const formatted = savedTabs.map((tab, i) => ({
        id: `saved-${i}`,
        url: tab.url,
        title: tab.title || 'Untitled Document'
      }));
      const combined = [...openTabs, ...formatted].filter((tab, i, self) =>
        tab.url && !self.slice(0, i).some(t => t.url === tab.url)
      ).filter(t => /https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(t.url));
      combined.sort((a, b) => a.title.localeCompare(b.title));
      renderDocs(combined);
    });
  }
}

// Function to update iframes' proportions based on current sizes
export function updateIframeProportions(iframeContainer, totalWidth, initialProportions) {
    const iframes = iframeContainer.querySelectorAll('.url-container');
    
    // If there are no iframes, there's nothing to update
    if (iframes.length === 0) {
        console.log('No iframes found, skipping proportion update');
        return [];
    }
    
    const isVertical = iframeContainer.style.flexDirection === 'column';
  
    // Initialize totalWidth if not provided
    if (!totalWidth || isNaN(totalWidth)) {
      totalWidth = 0;
      // First, calculate the total width of all iframes
      iframes.forEach(iframe => {
          const dimension = isVertical ? iframe.offsetHeight : iframe.offsetWidth;
          if (dimension > 0) {
              totalWidth += dimension;
          }
      });
    }
    
    // Ensure we have a valid total width
    if (totalWidth <= 0) {
      console.warn('Invalid total width for proportion calculation, using fallback method');
      // Use fallback method: equal proportions
      const equalProportion = 100 / iframes.length;
      const newProportions = new Array(iframes.length).fill(equalProportion);
      
      // Apply equal proportions
      iframes.forEach((iframe, index) => {
          iframe.style.flex = `1 1 ${equalProportion}%`;
          iframe.setAttribute('data-proportional-width', equalProportion.toFixed(2));
      });
      
      console.log('Applied equal proportions as fallback:', newProportions.map(p => p.toFixed(2)));
      return newProportions;
    }
  
    // Ensure initialProportions is an array and has the proper length
    if (!Array.isArray(initialProportions) || initialProportions.length !== iframes.length) {
      initialProportions = new Array(iframes.length).fill(0);
    }
  
    // Calculate proportions based on current sizes
    iframes.forEach((iframe, index) => {
      // Calculate the proportional width as a percentage of total
      let proportionalWidth = ((isVertical ? iframe.offsetHeight : iframe.offsetWidth) / totalWidth) * 100;
      
      // Ensure we have a valid number
      if (isNaN(proportionalWidth) || !isFinite(proportionalWidth) || proportionalWidth <= 0) {
        console.warn(`Invalid proportion detected for iframe ${index}, using default`);
        proportionalWidth = 100 / iframes.length; // Default to equal proportion
      }
      
      console.log(`Calculated proportion for iframe ${index}: ${proportionalWidth.toFixed(2)}%`);
      
      // Store in the initialProportions array
      initialProportions[index] = proportionalWidth;
      
      // Store the proportion value as a data attribute on the iframe for later reference
      iframe.setAttribute('data-proportional-width', proportionalWidth.toFixed(2));
      
      // Apply the proportion to the flex property so it's visibly consistent
      iframe.style.flex = `1 1 ${proportionalWidth}%`;
    });
    
    // Normalize the proportions to ensure they add up to exactly 100%
    let totalProportion = initialProportions.reduce((sum, prop) => sum + prop, 0);
    
    if (Math.abs(totalProportion - 100) > 0.1) { // If more than 0.1% off from 100%
        console.log(`Normalizing proportions: current total is ${totalProportion.toFixed(2)}%`);
        
        // Apply a scaling factor to each proportion
        const scalingFactor = 100 / totalProportion;
        iframes.forEach((iframe, index) => {
            const normalizedProportion = initialProportions[index] * scalingFactor;
            initialProportions[index] = normalizedProportion;
            iframe.setAttribute('data-proportional-width', normalizedProportion.toFixed(2));
            iframe.style.flex = `1 1 ${normalizedProportion}%`;
            console.log(`Normalized proportion for iframe ${index}: ${normalizedProportion.toFixed(2)}%`);
        });
    }
    
    // Update the browser URL with the new proportions
    updateBrowserURLWithProportions();
  
    // Return the updated proportions
    return initialProportions;
}

// Function to encode iframe proportions and update the URL
export function updateBrowserURLWithProportions() {
    // Get all iframe containers
    const containerFrames = document.querySelectorAll('.url-container');
    
    // Only proceed if we have container frames
    if (containerFrames.length === 0) {
        console.log('No container frames found, skipping URL update');
        return;
    }
    
    // Validate all proportions before updating the URL
    let allProportionsValid = true;
    
    // Check that all frames have valid proportions
    containerFrames.forEach((frame, index) => {
        const proportion = frame.getAttribute('data-proportional-width');
        if (!proportion || isNaN(parseFloat(proportion)) || parseFloat(proportion) <= 0) {
            console.warn(`Invalid proportion detected for frame ${index}, recalculating...`);
            allProportionsValid = false;
        }
    });
    
    // Declare iframeContainer and layout once for the entire function
    const iframeContainer = containerFrames[0]?.parentNode;
    const isVertical = iframeContainer?.style.flexDirection === 'column';

    // If any proportions are invalid, recalculate them
    if (!allProportionsValid) {
        // Calculate total width for proportion calculation
        let totalWidth = 0;
        containerFrames.forEach(frame => {
            totalWidth += isVertical ? frame.offsetHeight : frame.offsetWidth;
        });
        
        if (totalWidth > 0) {
            // Recalculate proportions for all frames
            containerFrames.forEach((frame, index) => {
                const proportionalWidth = ((isVertical ? frame.offsetHeight : frame.offsetWidth) / totalWidth) * 100;
                frame.setAttribute('data-proportional-width', proportionalWidth.toFixed(2));
                console.log(`Recalculated proportion for frame ${index}: ${proportionalWidth.toFixed(2)}%`);
            });
        } else {
            // If we can't calculate proper proportions, use equal distribution
            const equalProportion = 100 / containerFrames.length;
            containerFrames.forEach(frame => {
                frame.setAttribute('data-proportional-width', equalProportion.toFixed(2));
            });
            console.log(`Applied equal proportions of ${equalProportion.toFixed(2)}% to all frames`);
        }
    }
    
    const url = new URL(window.location);
    const proportions = Array.from(containerFrames).map(f => f.getAttribute('data-proportional-width')).join(',');

    url.searchParams.set('proportions', proportions);
    url.searchParams.set('layout', isVertical ? 'vertical' : 'horizontal');
    
    // Get the current URLs parameter
    const currentURLs = url.searchParams.get('urls');
    if (!currentURLs) {
        // If there's no URLs parameter, get the URLs from the frames and add them
        const frameURLs = Array.from(containerFrames).map(f => encodeURIComponent(f.dataset.url)).join(',');
        url.searchParams.set('urls', frameURLs);
    }
    
    history.replaceState(null, '', url);
    console.log(`Updated URL with proportions: ${proportions} and layout: ${isVertical ? 'vertical' : 'horizontal'}`);
}

// Function to apply proportions from URL parameters
export function applyProportionsFromURL(iframeContainer) {
    // Set container layout based on URL parameter
    const layoutParam = new URLSearchParams(window.location.search).get('layout');
    if (layoutParam === 'vertical') {
      iframeContainer.style.flexDirection = 'column';
    } else if (layoutParam === 'horizontal') {
      iframeContainer.style.flexDirection = 'row';
    }

    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const proportionsParam = params.get('proportions');
    
    if (!proportionsParam) {
        console.log('No proportions found in URL parameters');
        return false; // No proportions to apply
    }
    
    // Parse proportions and validate them
    const proportions = proportionsParam.split(',')
        .map(p => {
            const value = parseFloat(p);
            return isNaN(value) || !isFinite(value) ? 0 : value;
        });
    
    // Check if we have any valid proportions
    if (proportions.every(p => p === 0)) {
        console.log('No valid proportions found in URL parameters');
        return false;
    }
    
    const containerFrames = iframeContainer.querySelectorAll('.url-container');
    
    // Check if we have the correct number of proportions
    if (proportions.length !== containerFrames.length) {
        console.log(`Mismatch between number of proportions (${proportions.length}) and frames (${containerFrames.length})`);
        return false; // Mismatch in numbers, cannot apply
    }
    
    console.log('Applying proportions from URL:', proportions);
    
    // Calculate total to ensure it adds up to something
    const total = proportions.reduce((sum, p) => sum + p, 0);
    
    if (total <= 0) {
        console.error('Total of proportions is zero or negative, cannot apply');
        return false;
    }
    
    // Apply proportions to each frame
    containerFrames.forEach((frame, index) => {
        // Store the proportion on the frame
        const proportion = proportions[index];
        frame.setAttribute('data-proportional-width', proportion.toString());
        
        // Calculate normalized proportion as percentage of the total
        const normalizedProportion = (proportion / total) * 100;
        
        // Apply flex basis to set the size
        frame.style.flex = `1 1 ${normalizedProportion}%`;
        console.log(`Applied proportion to frame ${index}: ${normalizedProportion.toFixed(2)}%`);
    });
    
    return true; // Successfully applied proportions
}
  
  // Function to dynamically update the positions of dividers according to the current order of iframes
  export function updateDividers(iframeContainer) {
    // Remove existing dividers
    const existingDividers = iframeContainer.querySelectorAll('.iframe-divider');
    existingDividers.forEach(divider => divider.remove());

    // After removing dividers, check the current number of frames
    const containerFrames = iframeContainer.querySelectorAll('.url-container');

    // If only one frame remains, no dividers should be added
    if (containerFrames.length <= 1) {
        console.log('Only one frame remains, no dividers needed.');
        return; // Exit the function early as no dividers are needed
    }

    // Determine the current orientation
    const isVertical = iframeContainer.style.flexDirection === 'column';

    // Add new dividers and make them draggable if more than one frame exists
    containerFrames.forEach((container, index) => {
        if (index < containerFrames.length - 1) {
            const divider = document.createElement('div');
            divider.className = 'iframe-divider';

            // Set the cursor and style based on orientation
            if (isVertical) {
                divider.style.height = '5px'; // Adjust thickness as needed
                divider.style.width = '100%';
                divider.style.cursor = 'row-resize';
            } else {
                divider.style.width = '5px'; // Adjust thickness as needed
                divider.style.height = '100%';
                divider.style.cursor = 'col-resize';
            }

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
      const activeContainerFrame = getActiveContainerFrame();
      const containerFrames = document.querySelectorAll('.url-container');
      
      // Skip processing if there are no container frames
      if (containerFrames.length === 0) {
        return;
      }
  
      // Check if we have stored proportions in the data attributes
      let hasStoredProportions = false;
      let totalProportionalWidth = 0;
      let validProportions = [];
      
      // Collect and validate stored proportions
      containerFrames.forEach(frame => {
        const proportionalWidth = parseFloat(frame.getAttribute('data-proportional-width'));
        if (!isNaN(proportionalWidth) && isFinite(proportionalWidth) && proportionalWidth > 0) {
          hasStoredProportions = true;
          totalProportionalWidth += proportionalWidth;
          validProportions.push(proportionalWidth);
        } else {
          validProportions.push(0); // Placeholder for invalid proportion
        }
      });
  
      if (hasStoredProportions && totalProportionalWidth > 0) {
        // Apply stored proportions
        containerFrames.forEach((frame, index) => {
          if (validProportions[index] > 0) {
            // Calculate the normalized proportion as percentage of the total
            const normalizedProportion = (validProportions[index] / totalProportionalWidth) * 100;
            frame.style.flex = `1 1 ${normalizedProportion}%`;
            console.log(`Resize: Applied saved proportion to frame ${index}: ${normalizedProportion.toFixed(2)}%`);
          } else {
            // Calculate default proportion for frames with invalid stored values
            const defaultProportion = 100 / containerFrames.length;
            frame.style.flex = `1 1 ${defaultProportion}%`;
            frame.setAttribute('data-proportional-width', defaultProportion.toString());
            console.log(`Resize: Applied default proportion to frame ${index}: ${defaultProportion.toFixed(2)}%`);
          }
        });
      } else {
        // Fallback to equal distribution if no valid stored proportions
        console.log('No valid stored proportions found, using equal distribution');
        const equalProportion = 100 / containerFrames.length;
        containerFrames.forEach(frame => {
          frame.style.flex = `1 1 ${equalProportion}%`;
          frame.setAttribute('data-proportional-width', equalProportion.toFixed(2));
        });
      }

      // Only update URL if we have validly resized frames
      if (containerFrames.length > 0) {
        // Recalculate actual proportions based on current sizes after resize
        const totalWidth = iframeContainer.style.flexDirection === 'column'
          ? iframeContainer.offsetHeight
          : iframeContainer.offsetWidth;
        if (totalWidth > 0) {
          // Use updateIframeProportions to recalculate and update URL
          updateIframeProportions(iframeContainer, totalWidth);
        }
      }

      // Ensure modal is defined
      const modalElement = modal || document.getElementById('modal');
      
      // Adjust modal position if displayed
      if (modalElement && modalElement.style.display === 'block' && activeContainerFrame) {
        adjustModalPosition(modalElement, activeContainerFrame);
      }
    });
  }


  export function setupIframeResizeListener(containerFrame) {
    const fullTitles = new Map(); // Store full titles mapped to their elements for later restoration

    function shortenTitle(title, frameWidth) {
      // Fine-tune the estimated space taken up by toolbar buttons/icons
      const estimatedButtonsWidth = 100; // Adjust based on actual button sizes
      const adjustedWidth = (frameWidth - estimatedButtonsWidth)/1.5; // Adjust this based on your toolbar's layout
      const averageCharWidth = 8; // Adjust this based on the average character width of your font at its current size
      
      // Calculate max allowed characters based on the adjusted available width
      const maxAllowedChars = Math.max(Math.floor(adjustedWidth / averageCharWidth), 10); // Ensure at least 10 characters are shown
      
      if (title.length > maxAllowedChars) {
          return title.substring(0, maxAllowedChars - 3) + "...";
      }
      return title;
  }

    // Create a ResizeObserver instance and pass the callback function
    const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const containerFrame = entry.target;
            const frameWidth = entry.contentRect.width;

                  // Adjust modal position based on the resized iframe
      if (modal.style.display === 'block') {
        adjustModalPosition(modal, getActiveContainerFrame());
      }


            // Define width thresholds for button visibility
            const thresholds = {
                urlTitle: 1000, // Width at which the URL title disappears or becomes shorter
                dragHandle: 250,
                closeButton: 50,
                fullscreenButton: 100,
                popOutButton: 450,
                copyButton: 500,
                focusButton: 200,
                refreshButton: 500,
                duplicateButton: 250
            };

            // Get all buttons from the toolbar
            const toolbarButtons = containerFrame.querySelectorAll('.url-toolbar button');

            // Adjust button visibility based on the current width of the frame
            toolbarButtons.forEach(button => {
                if (button.classList.contains('drag-handle') && frameWidth < thresholds.dragHandle) {
                    button.style.display = 'none';
                } else if (button.classList.contains('close-frame-button') && frameWidth < thresholds.closeButton) {
                    button.style.display = 'none';
                } else if (button.classList.contains('fullscreen-button') && frameWidth < thresholds.fullscreenButton) {
                    button.style.display = 'none';
                } else if (button.classList.contains('pop-out-button') && frameWidth < thresholds.popOutButton) {
                    button.style.display = 'none';
                } else if (button.classList.contains('copy-url-button') && frameWidth < thresholds.copyButton) {
                    button.style.display = 'none';
                } else if (button.classList.contains('duplicate-frame-button') && frameWidth < thresholds.duplicateButton) {
                    button.style.display = 'none';
            } else if (button.classList.contains('refresh-frame-button') && frameWidth < thresholds.refreshButton) {
                  button.style.display = 'none';
            } else if (button.classList.contains('focus-mode-button') && frameWidth < thresholds.focusButton) {
                  button.style.display = 'none';
            } else {
                    button.style.display = ''; // This resets the display property to default
            }
            });

            // Adjust URL title visibility or formatting based on the current width
            const urlTitle = containerFrame.querySelector('.url-text');
            if (
              urlTitle &&
              urlTitle.textContent &&
              !['Loading title...', 'Title unavailable', 'Resolving...'].includes(urlTitle.textContent)
            ) {
              const original = fullTitles.get(urlTitle) || urlTitle.textContent;
              if (!fullTitles.has(urlTitle)) {
                fullTitles.set(urlTitle, original);
              }
              urlTitle.textContent = shortenTitle(original, frameWidth);
              urlTitle.title = original;
            }
        });
    });

    // Start observing the container frame
    resizeObserver.observe(containerFrame);
}

// Function to toggle the display of the welcome message when no documents are open.
export function toggleWelcomeMessage(iframeContainer) {
    let welcomeMessage = document.getElementById('welcome-message');
    if (!welcomeMessage) {
         welcomeMessage = document.createElement('div');
         welcomeMessage.id = 'welcome-message';
         welcomeMessage.className = 'welcome-message';
         welcomeMessage.innerHTML = `
             <h1>Welcome to Google Docs SplitView</h1>
             <p>Add a document to get started</p>
         `;
         const addDocButton = document.createElement('button');
         addDocButton.textContent = 'Open Document';
         addDocButton.addEventListener('click', () => {
             openAddDocumentModal(iframeContainer);
         });
         welcomeMessage.appendChild(addDocButton);
         
         // Base styling for welcome message
         welcomeMessage.style.position = 'absolute';
         welcomeMessage.style.top = '0';
         welcomeMessage.style.left = '0';
         welcomeMessage.style.right = '0';
         welcomeMessage.style.bottom = '0';
         welcomeMessage.style.display = 'flex';
         welcomeMessage.style.flexDirection = 'column';
         welcomeMessage.style.alignItems = 'center';
         welcomeMessage.style.justifyContent = 'center';
         welcomeMessage.style.zIndex = '0';
         
         // Improved design styles
         welcomeMessage.style.background = 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
         welcomeMessage.style.color = '#333';
         welcomeMessage.style.fontFamily = 'Arial, sans-serif';
         welcomeMessage.style.textAlign = 'center';
         welcomeMessage.style.padding = '20px';
         
         // Style the Add Document button
         addDocButton.style.padding = '12px 24px';
         addDocButton.style.fontSize = '16px';
         addDocButton.style.backgroundColor = '#4CAF50';
         addDocButton.style.color = '#fff';
         addDocButton.style.border = 'none';
         addDocButton.style.borderRadius = '4px';
         addDocButton.style.cursor = 'pointer';
         addDocButton.style.marginTop = '20px';
         
         // Append the welcome message to the iframeContainer
         iframeContainer.appendChild(welcomeMessage);
    }
    
    // Show the welcome message if there are no documents (iframe containers), otherwise hide it.
    const frameCount = iframeContainer.querySelectorAll('.url-container').length;
    if (frameCount === 0) {
         welcomeMessage.style.display = 'flex';
    } else {
         welcomeMessage.style.display = 'none';
    }
}

window.addEventListener("message", (event) => {
  const { type, url } = event.data;
  if (type === "preserveTitleState") {
    const frame = findFrameByUrl(url);
    if (!frame) return;
    const titleEl = frame.querySelector('.url-text');
    if (titleEl) {
      frame.dataset.prevTitle = titleEl.textContent;
      frame.dataset.prevTitleLoaded = frame.dataset.titleLoaded || 'false';
    }
  }

  if (type === "restoreTitleState") {
    const frame = findFrameByUrl(url);
    if (!frame) return;
    const titleEl = frame.querySelector('.url-text');
    if (titleEl && frame.dataset.prevTitle) {
      titleEl.textContent = frame.dataset.prevTitle;
      frame.dataset.titleLoaded = frame.dataset.prevTitleLoaded || 'false';
 
      // Avoid reloading on resize/reflow after restore
      if (frame.dataset.titleLoaded === 'true') {
        frame.querySelector('.url-text').textContent = frame.dataset.prevTitle;
      }
    }
  }
});

window.addEventListener("beforeunload", () => {
  const containerFrames = document.querySelectorAll('.url-container');
  containerFrames.forEach(frame => {
    const titleEl = frame.querySelector('.url-text');
    if (titleEl && titleEl.textContent && titleEl.textContent !== 'Loading title...') {
      frame.dataset.prevTitle = titleEl.textContent;
      frame.dataset.prevTitleLoaded = 'true';
    }
  });
});