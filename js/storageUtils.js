/**
 * storageUtils.js
 * Utility functions for saving and loading data from local storage
 */

/**
 * Save data to local storage
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store (will be stringified)
 */
export function saveToLocalStorage(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

/**
 * Load data from local storage
 * @param {string} key - The key to retrieve data from
 * @returns {any|null} The parsed data or null if not found
 */
export function loadFromLocalStorage(key) {
    try {
        const serializedData = localStorage.getItem(key);
        if (serializedData === null) {
            return null;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error('Error loading from local storage:', error);
        return null;
    }
}

/**
 * Remove data from local storage
 * @param {string} key - The key to remove
 */
export function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from local storage:', error);
    }
}

/**
 * Clear all data from local storage
 */
export function clearLocalStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing local storage:', error);
    }
}

/**
 * Check if a key exists in local storage
 * @param {string} key - The key to check
 * @returns {boolean} True if the key exists, false otherwise
 */
export function existsInLocalStorage(key) {
    return localStorage.getItem(key) !== null;
}