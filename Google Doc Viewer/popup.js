
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
    var queryInfo = { currentWindow: true };

    // Query the current window tabs
    chrome.tabs.query(queryInfo, function(tabs) {
        const tabList = document.getElementById('tab-list'); // Ensure this element exists in your HTML

        // For each tab, create a new div element to display the tab's title
        tabs.forEach(function(tab, index) {
            // Check if the tab's URL matches Google Docs, Sheets, or Slides
            if (/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)/.test(tab.url)) {
                const tabItem = document.createElement('label');
                // tabItem.textContent = tab.url; // Display tab title. You can also use `tab.url` if needed.
                tabItem.className = 'tab-item'; // Ensure you have defined this class in your CSS for styling

                // Add checkboxes and tie checkboxes to tabs
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `tab-${index}`;
                checkbox.value = tab.id; // Use tab ID as value for easy identification
                checkbox.className = 'checkbox'; // Assuming you have CSS for this class

                // Combine checkbox and tab label
                const labelText = document.createTextNode(tab.title);
                tabItem.appendChild(checkbox);
                tabItem.appendChild(labelText);

                // // When a tab item is clicked, make that tab active
                // tabItem.onclick = function() {
                //     chrome.tabs.update(tab.id, {active: true});
                // };

                tabList.appendChild(tabItem); // Append the tab item to the list
            }
        });
    });
});
