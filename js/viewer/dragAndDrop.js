// dragAndDrop.js

import { updateContainerFramesDataId, updateDividers } from './iframeManager.js';
import { updateBrowserURL } from './modalManager.js';

// Helper function to find the closest ancestor of an element that matches a selector
function closestFrom(el, selector) {
    while (el && el !== document.body) {
        if (el.matches(selector)) return el;
        el = el.parentElement;
    }
    return null;
}

export const initializeDragAndDrop = (iframeContainer) => {
    let draggedItem = null;

    // Drag start event with event delegation
    iframeContainer.addEventListener('dragstart', function(e) {
        const dragHandle = closestFrom(e.target, '.drag-handle');
        if (dragHandle) {
            const containerFrame = dragHandle.closest('.url-container');
            if (containerFrame) {
                draggedItem = containerFrame;
                setTimeout(() => containerFrame.classList.add('dragging'), 0);
            }
        }
    }, false);

    // Drag over event with event delegation
    iframeContainer.addEventListener('dragover', function(e) {
        e.preventDefault(); // Necessary to allow dropping
        const containerFrame = closestFrom(e.target, '.url-container');
        if (containerFrame && draggedItem) {
            const halfwayPoint = containerFrame.getBoundingClientRect().height / 2;
            const mousePositionRelativeToTarget = e.clientY - containerFrame.getBoundingClientRect().top;
            containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear previous position classes
            if (mousePositionRelativeToTarget < halfwayPoint) {
                containerFrame.classList.add('drag-over-top');
            } else {
                containerFrame.classList.add('drag-over-bottom');
            }
        }
    });

    // Drag enter event with event delegation
    iframeContainer.addEventListener('dragenter', function(e) {
        e.preventDefault(); // Necessary to allow dropping
    });

    // Drag leave event with event delegation
    iframeContainer.addEventListener('dragleave', function(e) {
        const containerFrame = closestFrom(e.target, '.url-container');
        if (containerFrame) {
            containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear visual cues
        }
    });

    // Drop event with event delegation
    iframeContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const containerFrame = closestFrom(e.target, '.url-container');
        if (containerFrame && draggedItem) {
            containerFrame.classList.remove('drag-over-top', 'drag-over-bottom'); // Clear visual cues

            // Perform the drop logic here
            const draggedId = parseInt(draggedItem.getAttribute('data-id'), 10);
            const targetId = parseInt(containerFrame.getAttribute('data-id'), 10);
            const insertBefore = draggedId > targetId;

            let referenceElement = insertBefore ? containerFrame : containerFrame.nextElementSibling;
            iframeContainer.insertBefore(draggedItem, referenceElement);

            // Update container frames and dividers to reflect new order
            updateContainerFramesDataId(iframeContainer);
            updateDividers(iframeContainer);
            updateBrowserURL();
            console.log('Dividers Updated');

            // Cleanup
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

    // Cleanup on dragend
    document.addEventListener('dragend', function() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });
};