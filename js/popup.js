//popup.js

document.getElementById('docForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get the IDs of the selected tabs
    const selectedTabIds = Array.from(document.querySelectorAll('#tab-list input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.value, 10));

    // Fetch the URLs of the selected tabs
    chrome.tabs.query({}, function(tabs) {
        const selectedUrls = tabs
            .filter(tab => selectedTabIds.includes(tab.id))
            .map(tab => tab.url); // Extract URLs from the selected tabs

        // Join URLs to pass as a single query parameter
        const urlsQueryParam = encodeURIComponent(selectedUrls.join(','));

        // Send a message to the background script to open viewer.html with URLs as query parameters
        chrome.runtime.sendMessage({action: "openViewerWithUrls", urls: urlsQueryParam});
    });
});

// This should be outside and directly executed when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // var queryInfo = { currentWindow: true }; //Query only the current window

    // Query the current window tabs
    chrome.tabs.query({}, function(tabs) {
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
        filteredAndSortedTabs.forEach(function(tab, index) {
            // Check if the tab's URL matches Google Docs, Sheets, or Slides
            if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
                const tabItem = document.createElement('label');
                // tabItem.textContent = tab.url; // Display tab title. You can also use `tab.url` if needed.
                tabItem.className = 'tab-item'; 

                // Add checkboxes and tie checkboxes to tabs
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `tab-${index}`;
                checkbox.value = tab.id; // Use tab ID as value for easy identification
                checkbox.className = 'checkbox'; 

                // Create an image element for the favicon
                const favicon = document.createElement('img');
                favicon.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url='+tab.url;
                favicon.className = 'favicon'; // Use this class for additional styling (size, margin, etc.)
                favicon.alt = 'Favicon'; // Alternative text for accessibility

                // Extract the title from the tab's URL and remove the unwanted suffixes
                let labelText = tab.title.replace(/( - Google (Sheets|Docs|Slides))/, ''); // Remove "- Google Sheets," "- Google Docs," or "- Google Slides" from the title

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
            // Display a message within the popup instead of an alert
            const noTabsMessage = document.createElement('p');
            noTabsMessage.id = 'no-tabs-message';
            noTabsMessage.textContent = 'Please open a Google Docs, Sheets, or Slides tab to use this feature.';
            document.body.appendChild(noTabsMessage);

        }
    });
});
