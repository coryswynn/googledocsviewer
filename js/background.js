chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("../html/viewer.html") });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openDocument" && message.docUrl) {
        // Open a new tab for each URL received
        chrome.tabs.create({ url: message.docUrl }, function(tab) {
            // Optionally, do something with the tab
            sendResponse({status: "success", tabId: tab.id});
        });
        return true; // Keep the messaging channel open for the response
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openViewerWithUrls" && message.urls) {
        chrome.tabs.create({ url: chrome.runtime.getURL("../html/viewer.html") + "?urls=" + message.urls });
    }
});
