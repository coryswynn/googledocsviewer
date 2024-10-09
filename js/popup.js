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
            const savedTabId = -[index]; // Generate a negative unique ID for saved tabs
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
    let savedTabs = loadFromLocalStorage('savedTabs') || []; // Load saved tabs from local storage
    let validTabsFound = false;

    tabs.forEach(function (tab, index) {
        if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
            const tabItem = document.createElement('label');
            tabItem.className = 'tab-item';
            tabItem.setAttribute('data-url', tab.url); // Store the URL in a data attribute

            // Checkbox for tab selection
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `tab-${index}`;
            checkbox.value = tab.id || index; // Use tab ID for open tabs, index for saved tabs
            checkbox.className = 'checkbox';

            // Favicon
            const favicon = document.createElement('img');
            favicon.className = 'favicon';
            favicon.alt = 'Favicon';

            // Check the URL to determine the appropriate favicon
            if (/https:\/\/docs\.google\.com\/document\//.test(tab.url)) {
                // Google Docs favicon
                favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_document_favicon.ico';
            } else if (/https:\/\/docs\.google\.com\/spreadsheets\//.test(tab.url)) {
                // Google Sheets favicon
                favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_spreadsheet_favicon.ico';
            } else if (/https:\/\/docs\.google\.com\/presentation\//.test(tab.url)) {
                // Google Slides favicon
                favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_presentation_favicon.ico';
            } else {
                // Default favicon if the URL doesn't match Docs, Sheets, or Slides
                favicon.src = 'https://ssl.gstatic.com/docs/doclist/images/icon_11_generic_favicon.ico'; // Generic Google Docs favicon
            }

            // Tab title
            let labelText = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Clean up title

            // Check if the tab is already in savedTabs by URL
            if (!savedTabs.some(savedTab => savedTab.url === tab.url)) {
                const matchingTab = tabs.find(t => t.url === tab.url);
                labelText = matchingTab ? matchingTab.title.replace(/( - Google (Sheets|Docs|Slides))/, '') : 'Title Unavailable';
            }

            const titleNode = document.createElement('span');
            titleNode.textContent = labelText; // Set the title (saved or default)

            // Append elements to tabItem
            tabItem.appendChild(checkbox);
            tabItem.appendChild(favicon);
            tabItem.appendChild(titleNode);

            // Check if the tab is saved and add green checkmark if true
            const isSaved = savedTabs.some(savedTab => savedTab.url === tab.url);
            const savedTab = savedTabs.find(savedTab => savedTab.url === tab.url);
            
            console.log(savedTab);
            if (isSaved) {
                const space = document.createTextNode(' '); // Add a space
                const checkmark = document.createElement('i');
                checkmark.className = 'bx bxs-check-circle';
                checkmark.style.color = '#2e8c0b';
                tabItem.appendChild(space); // Add space after the title
                tabItem.appendChild(checkmark); // Add the checkmark after the title

                // Update the title with the saved title if available, otherwise use the labelText
                titleNode.textContent = savedTab.title || labelText;
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
    chrome.storage.local.get('sidebarEnabled', function (result) {
        let sidebarEnabled = result.sidebarEnabled;

        // If sidebarEnabled is not set, initialize it to true by default
        if (sidebarEnabled === undefined) {
            sidebarEnabled = true; // or false, depending on your default preference
            chrome.storage.local.set({ 'sidebarEnabled': sidebarEnabled });
        }

        sidebarToggle.checked = !!sidebarEnabled; // Ensure a boolean value and sync toggle
    });

    // Load and apply dark mode state
    chrome.storage.local.get('darkModeEnabled', function (result) {
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
        chrome.storage.local.get('savedTabs', function (result) {
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

    chrome.storage.local.get('savedTabs', function (result) {
        const savedTabs = result.savedTabs || [];

        // After you load the saved tabs:
        savedTabs.forEach(tab => {
            const { url, title } = tab;
            console.log('UPDATED BOOKMARK NAME')
            updatePopupBookmarkTitle(url, title); // Apply the saved title on popup load
        });
    });

    // Add event listener to update Chrome storage when sidebar toggled
    sidebarToggle.addEventListener('change', function () {
        chrome.storage.local.set({ 'sidebarEnabled': sidebarToggle.checked }, function () {
            console.log('sidebarEnabled set to ' + sidebarToggle.checked);
        });
    });

    // Listen for changes to the bookmarks in chrome.storage.local
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.savedTabs) {
            const updatedTabs = changes.savedTabs.newValue;

            // Iterate over the updated tabs to find which one has changed
            updatedTabs.forEach(tab => {
                const { url, title } = tab;
                updatePopupBookmarkTitle(url, title); // Update the title in the popup
            });
        }
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

// Function to update the popup's bookmark title
export function updatePopupBookmarkTitle(url, newName) {
    const tabItems = document.querySelectorAll('.tab-item');
    console.log("TAB ITEMS BABY: ", tabItems);

    tabItems.forEach(tabItem => {
        const tabUrl = tabItem.getAttribute('data-url');
        const tabTitleNode = tabItem.querySelector('span'); // Select the span element containing the title

        // Ensure that both tabUrl and tabTitleNode exist before proceeding
        if (tabUrl && tabUrl === url && tabTitleNode) {
            tabTitleNode.textContent = newName; // Update the tab title in the popup
        }
    });
}
