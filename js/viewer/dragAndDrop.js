// dragAndDrop.js

import { updateContainerFramesDataId, updateDividers} from './iframeManager.js';

export const initializeDragAndDrop = (iframeContainer) => {
    let draggedItem = null; // Keep track of the item being dragged
    let draggedIndex = null; // To track which item is being dragged

    const addDraggableHandlers = (containerFrame, index) => {
        const dragHandle = containerFrame.querySelector('.drag-handle');
        
        dragHandle.addEventListener('dragstart', function(e) {
            draggedItem = containerFrame;
            draggedIndex = index; // Track the index of the dragged item
            setTimeout(() => containerFrame.classList.add('dragging'), 0);
        });

        containerFrame.addEventListener('dragenter', dragEnterHandler);
        containerFrame.addEventListener('dragover', dragOverHandler);
        containerFrame.addEventListener('dragleave', dragLeaveHandler);
        containerFrame.addEventListener('drop', (e) => dropHandler(containerFrame, index, e));
    };

    const dragEnterHandler = (e) => {
        e.preventDefault();
        const containerFrame = e.target.closest('.url-container'); // Find the closest container frame

        const halfwayPoint = containerFrame.getBoundingClientRect().height / 2;
        const mousePositionRelativeToTarget = e.clientY - containerFrame.getBoundingClientRect().top;
        containerFrame.classList.remove('drag-over-top', 'drag-over-bottom');
        if (mousePositionRelativeToTarget < halfwayPoint) {
            containerFrame.classList.add('drag-over-top');
        } else {
            containerFrame.classList.add('drag-over-bottom');
        }
    };

    const dragOverHandler = (e) => {
        e.preventDefault();
        const containerFrame = e.target.closest('.url-container'); // Find the closest container frame

        const halfwayPoint = containerFrame.getBoundingClientRect().height / 2;
        const mousePositionRelativeToTarget = e.clientY - containerFrame.getBoundingClientRect().top;
        containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear previous position classes
        if (mousePositionRelativeToTarget < halfwayPoint) {
            containerFrame.classList.add('drag-over-top');
        } else {
            containerFrame.classList.add('drag-over-bottom');
        }
    };

    const dragLeaveHandler = (e) => {
        const containerFrame = e.target.closest('.url-container'); // Find the closest container frame

        containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear visual cues
    };

    const dropHandler = (containerFrame, index, e) => {
        e.preventDefault();
        containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear visual cues
    
            if (draggedItem) {
                // Get the current 'data-id' for the draggedItem and the drop target
                const draggedId = parseInt(draggedItem.getAttribute('data-id'), 10);
                const targetId = parseInt(containerFrame.getAttribute('data-id'), 10);
        
                // Determine the insert location
                const insertBefore = draggedId > targetId; // If dragging down, insert before the targetId
        
                // Find the reference element based on the 'data-id'
                let referenceElement = null;
                if (insertBefore) {
                    referenceElement = containerFrame;
                } else {
                    // If not inserting before and this is not the last element, insert after the next sibling
                    const nextElement = containerFrame.nextElementSibling;
                    if (nextElement && nextElement.classList.contains('url-container')) {
                        referenceElement = nextElement.nextElementSibling; // This would be the divider after the target container
                    }
                }
        
                // Insert the draggedItem at the new position based on referenceElement
                iframeContainer.insertBefore(draggedItem, referenceElement);
            }
    
        // Update container frames and dividers to reflect new order
        updateContainerFramesDataId(iframeContainer);
        updateDividers(iframeContainer);
        console.log('Dividers Updated');
    
        // Clean up
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        draggedIndex = null;
    };

    const containerFrames = iframeContainer.querySelectorAll('.url-container');
    containerFrames.forEach((containerFrame, index) => {
        addDraggableHandlers(containerFrame, index);
    });

    document.addEventListener('dragend', function() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            draggedIndex = null;
        }
    });
};

