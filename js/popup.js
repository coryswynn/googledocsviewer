//popup.js

import { loadFromLocalStorage, removeFromLocalStorage, existsInLocalStorage } from './storageUtils.js';
import { adjustModalPosition } from './viewer/modalManager.js';

document.getElementById('docForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Get the IDs of the selected tabs
    const selectedTabIds = Array.from(document.querySelectorAll('#tab-list input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value, 10));

    // Fetch the URLs of the selected tabs
    chrome.tabs.query({}, function (tabs) {
        const selectedUrls = tabs
            .filter(tab => selectedTabIds.includes(tab.id))
            .map(tab => tab.url); // Extract URLs from the selected tabs

        // Fetch saved tabs from localStorage
        const savedTabs = loadFromLocalStorage('savedTabs') || [];

        // Add URLs of selected saved tabs
        savedTabs.forEach((tab, index) => {
            const savedTabId = (index); // Generate a negative unique ID for saved tabs
            if (selectedTabIds.includes(savedTabId)) {
                selectedUrls.push(tab.url); // Add the saved tab URL if selected
            }
        });

        // Join URLs to pass as a single query parameter
        const urlsQueryParam = encodeURIComponent(selectedUrls.join(','));

        // Send a message to the background script to open viewer.html with URLs as query parameters
        chrome.runtime.sendMessage({ action: "openViewerWithUrls", urls: urlsQueryParam });
    });
});

// Function to add tabs to the DOM
function addTabsToDOM(tabs, tabList) {
    const savedTabs = loadFromLocalStorage('savedTabs') || []; // Load saved tabs from local storage
    let validTabsFound = false;

    tabs.forEach(function (tab, index) {
        if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
            const tabItem = document.createElement('label');
            tabItem.className = 'tab-item';

            // Checkbox for tab selection
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `tab-${index}`;
            checkbox.value = tab.id || index; // Use tab ID for open tabs, index for saved tabs
            checkbox.className = 'checkbox';

            // Favicon
            const favicon = document.createElement('img');
            favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
            favicon.className = 'favicon';
            favicon.alt = 'Favicon';

            // Tab title
            let labelText = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Clean up title
            const titleNode = document.createTextNode(labelText);

            // Append elements to tabItem
            tabItem.appendChild(checkbox);
            tabItem.appendChild(favicon);
            tabItem.appendChild(titleNode);

            // Check if the tab is saved and add green checkmark if true
            const isSaved = savedTabs.some(savedTab => savedTab.url === tab.url);
            if (isSaved) {
                const space = document.createTextNode(' '); // Add a space
                const checkmark = document.createElement('i');
                checkmark.className = 'bx bxs-check-circle';
                checkmark.style.color = '#2e8c0b';
                tabItem.appendChild(space); // Add space after the title
                tabItem.appendChild(checkmark); // Add the checkmark after the title
            }

            // Append tabItem to the tabList
            tabList.appendChild(tabItem);
            validTabsFound = true;
        }
    });

    // Handle the case where no valid tabs are found
    if (!validTabsFound) {
        document.querySelector('button[type="submit"]').style.display = 'none';
        const noTabsMessage = document.createElement('p');
        noTabsMessage.id = 'no-tabs-message';
        noTabsMessage.textContent = 'Please open or save a Google Docs, Sheets, or Slides tab to use this feature.';
        document.body.appendChild(noTabsMessage);
    }
}

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', function () {
    const tabList = document.getElementById('tab-list'); // Element where tabs will be listed
    const sidebarToggle = document.getElementById('sidebar-toggle-checkbox');
    const darkModeToggle = document.getElementById('darkmode-toggle-checkbox'); // Dark mode toggle
    const logoImage = document.getElementById('logo-img');

    // Load sidebar state
    chrome.storage.local.get('sidebarEnabled', function(result) {
        const sidebarEnabled = result.sidebarEnabled;
        sidebarToggle.checked = !!sidebarEnabled; // Ensure a boolean value
    });

    // Load and apply dark mode state
    chrome.storage.local.get('darkModeEnabled', function(result) {
        let darkModeEnabled = result.darkModeEnabled;

        // If darkModeEnabled is not set, initialize it to false
        if (darkModeEnabled === undefined) {
            darkModeEnabled = false;
            chrome.storage.local.set({ 'darkModeEnabled': darkModeEnabled });
        }

        console.log('Dark mode enabled:', darkModeEnabled);

        // Apply dark mode if previously enabled
        darkModeToggle.checked = darkModeEnabled;
        if (darkModeEnabled) {
            document.body.classList.add('dark-mode');
            logoImage.src = 'https://i.imgur.com/m4Ge84P.png'; // Dark mode logo
        } else {
            document.body.classList.remove('dark-mode');
            logoImage.src = 'https://i.imgur.com/yUm3oGG.png'; // Light mode logo
            adjustModalPosition(modal, getActiveContainerFrame());
        }
    });

    // Query open tabs and combine with saved tabs
    chrome.tabs.query({}, function (openTabs) {
        chrome.storage.local.get('savedTabs', function(result) {
            const savedTabs = result.savedTabs || [];

            // Convert savedTabs to match open tabs structure (if needed)
            const formattedSavedTabs = savedTabs.map((tab, index) => {
                return {
                    id: `${index}`, // Generate an ID for the saved tab
                    url: tab.url,
                    title: tab.title || 'Untitled Document'
                };
            });

            // Combine open tabs and saved tabs, filtering out duplicates by URL
            const combinedTabs = [...openTabs, ...formattedSavedTabs].reduce((acc, current) => {
                if (!acc.find(tab => tab.url === current.url)) {
                    acc.push(current);
                }
                return acc;
            }, []);

            // Sort tabs alphabetically
            combinedTabs.sort((a, b) => a.title.localeCompare(b.title));

            // Add the combined tabs to the DOM
            addTabsToDOM(combinedTabs, tabList);
        });
    });

    // Add event listener to update Chrome storage when sidebar toggled
    sidebarToggle.addEventListener('change', function () {
        chrome.storage.local.set({ 'sidebarEnabled': sidebarToggle.checked }, function () {
            console.log('sidebarEnabled set to ' + sidebarToggle.checked);
        });
    });

    // Dark mode toggle listener
    darkModeToggle.addEventListener('change', function () {
        const isDarkMode = darkModeToggle.checked;

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            logoImage.src = 'https://i.imgur.com/m4Ge84P.png'; // Dark mode logo
        } else {
            document.body.classList.remove('dark-mode');
            logoImage.src = 'https://i.imgur.com/yUm3oGG.png'; // Light mode logo
        }

        // Update darkModeEnabled in chrome.storage.local
        chrome.storage.local.set({ 'darkModeEnabled': isDarkMode }, function () {
            console.log('darkModeEnabled set to ' + isDarkMode);
        });

        // Notify the viewer page about the dark mode toggle
        chrome.runtime.sendMessage({
            action: "toggleDarkMode",
            enabled: isDarkMode
        });
    });
});