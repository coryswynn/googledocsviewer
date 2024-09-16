//popup.js

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

        // Join URLs to pass as a single query parameter
        const urlsQueryParam = encodeURIComponent(selectedUrls.join(','));

        // Send a message to the background script to open viewer.html with URLs as query parameters
        chrome.runtime.sendMessage({ action: "openViewerWithUrls", urls: urlsQueryParam });
    });
});

// This should be outside and directly executed when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle-checkbox');
    const darkModeToggle = document.getElementById('darkmode-toggle-checkbox'); // Get dark mode toggle checkbox

    // Load the sidebarEnabled and darkModeEnabled values from local storage
    chrome.storage.local.get(['sidebarEnabled', 'darkModeEnabled'], function (result) {
        sidebarToggle.checked = result.sidebarEnabled || false;
        darkModeToggle.checked = result.darkModeEnabled || false;

        // Apply dark mode if previously enabled
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
        }
    });

    // Add event listener to update local storage when sidebar is toggled
    sidebarToggle.addEventListener('change', function () {
        chrome.storage.local.set({ 'sidebarEnabled': sidebarToggle.checked }, function () {
            console.log('sidebarEnabled set to ' + sidebarToggle.checked);
        });
    });

    // Add event listener to toggle dark mode and update local storage
    // Add event listener to toggle dark mode and update local storage
    darkModeToggle.addEventListener('change', function () {
        const isDarkMode = darkModeToggle.checked;
        const logoImage = document.getElementById('logo-img');

        // Toggle the dark mode styles for the popup
        if (isDarkMode) {
            document.body.classList.add('dark-mode'); // Apply dark mode
            logoImage.src = 'https://i.imgur.com/m4Ge84P.png'; // Change to dark mode logo
        } else {
            document.body.classList.remove('dark-mode'); // Remove dark mode
            logoImage.src = 'https://i.imgur.com/yUm3oGG.png'; // Remove dark mode logo
        }

        // Save the dark mode state in local storage
        chrome.storage.local.set({ 'darkModeEnabled': isDarkMode }, function () {
            console.log('darkModeEnabled set to ' + isDarkMode);

            // Send a message to the viewer page to toggle dark mode
            chrome.runtime.sendMessage({
                action: "toggleDarkMode",
                enabled: isDarkMode
            });
        });
    });

    // Query the current window tabs
    chrome.tabs.query({}, function (tabs) {
        const tabList = document.getElementById('tab-list'); // Ensure this element exists in your HTML

        // Filter for Google Docs, Slides, Sheets, remove duplicates, and sort tabs
        const filteredAndSortedTabs = tabs
            .filter(tab => /https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url))
            .reduce((acc, current) => {
                const x = acc.find(item => item.title === current.title);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, [])
            .sort((a, b) => a.title.localeCompare(b.title));

        let validTabsFound = false; // Flag to track if valid tabs are found

        // For each tab, create a new div element to display the tab's title
        filteredAndSortedTabs.forEach(function (tab, index) {
            // Check if the tab's URL matches Google Docs, Sheets, or Slides
            if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
                const tabItem = document.createElement('label');
                tabItem.className = 'tab-item';

                // Add checkboxes and tie checkboxes to tabs
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `tab-${index}`;
                checkbox.value = tab.id; // Use tab ID as value for easy identification
                checkbox.className = 'checkbox';

                // Create an image element for the favicon
                const favicon = document.createElement('img');
                favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + tab.url;
                favicon.className = 'favicon';
                favicon.alt = 'Favicon';

                // Extract the title from the tab's URL and remove the unwanted suffixes
                let labelText = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Remove "- Google Sheets," "- Google Docs," or "- Google Slides"

                // Combine checkbox and tab label
                labelText = document.createTextNode(labelText);
                tabItem.appendChild(checkbox);
                tabItem.appendChild(favicon);
                tabItem.appendChild(labelText);

                tabList.appendChild(tabItem); // Append the tab item to the list
                validTabsFound = true;
            }
        });

        if (!validTabsFound) {
            document.querySelector('button[type="submit"]').style.display = 'none';
            const noTabsMessage = document.createElement('p');
            noTabsMessage.id = 'no-tabs-message';
            noTabsMessage.textContent = 'Please open a Google Docs, Sheets, or Slides tab to use this feature.';
            document.body.appendChild(noTabsMessage);
        }
    });
});