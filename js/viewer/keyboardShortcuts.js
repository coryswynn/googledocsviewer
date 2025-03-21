// keyboardShortcuts.js
// Import necessary functions and handlers from other modules

import { getActiveContainerFrame } from './init.js';
import { closeModal } from './modalManager.js';

document.addEventListener('keydown', (event) => {
    const activeContainerFrame = getActiveContainerFrame();
    
    // Handle the Esc key for closing the modal
    if (event.key === 'Escape') {
        const modal = document.getElementById('modal'); 
        if (modal.style.display === 'block') {
            closeModal(modal);
        }
        event.preventDefault();
    }
});
