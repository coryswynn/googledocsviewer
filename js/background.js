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

chrome.runtime.setUninstallURL(
    'https://www.gdocssplitview.com/uninstall',
    () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log('Uninstall URL set successfully.');
      }
    }
  );

chrome.runtime.onMessage.addListener(({ type, name }) => {
  chrome.windows.getCurrent({},function(wind) {
    // This is the only way to force a relayout to update the caret position
    let width = wind.width;
    chrome.windows.update(wind.id, { width: width + 1 });
    chrome.windows.update(wind.id, { width: width });
  });
});