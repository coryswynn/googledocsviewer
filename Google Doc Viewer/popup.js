
document.getElementById('docForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const docUrls = document.getElementById('docUrl').value.split('\n').filter(Boolean); // Split URLs by new line and filter out empty strings

    // Join URLs to pass as a single query parameter
    const urlsQueryParam = encodeURIComponent(docUrls.join(','));

    // Open viewer.html with URLs as query parameters
    chrome.runtime.sendMessage({action: "openViewerWithUrls", urls: urlsQueryParam});
});
