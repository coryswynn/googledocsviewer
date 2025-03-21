console.log("✅ Google Docs SplitView content script loaded!");

// Identify the correct scrollable element.
function getGoogleDocsScrollElement() {
  return document.querySelector('.kix-appview-editor') ||  // Google Docs
         document.querySelector('.docs-sheet-container') || // Google Sheets
         document.querySelector('.punch-filmstrip-scroll'); // Google Slides
}

const scrollable = getGoogleDocsScrollElement();

if (!scrollable) {
  console.warn("⚠️ No scrollable element found inside the iframe!");
} else {
  console.log("✅ Found scrollable element inside iframe:", scrollable);

  // Determine one page's height.
  const pageElement = scrollable.querySelector('.kix-page') || scrollable.querySelector('.filmstrip-slide');
  const onePageHeight = pageElement ? pageElement.clientHeight : scrollable.clientHeight;
  console.log("One page height:", onePageHeight);

  let isSyncing = false; // To prevent feedback loops.
  let isLinkedScrollingEnabled = false; // Default to true.
  let baselineScrollTop = null; // Will be set when linked scrolling is enabled.

  // Listen for a message to enable/disable linked scrolling.
  window.addEventListener("message", (event) => {
    if (event.data.type === "setLinkedScrolling") {
      isLinkedScrollingEnabled = event.data.linkedScrolling;
      console.log("Iframe: Linked scrolling set to", isLinkedScrollingEnabled);
      if (isLinkedScrollingEnabled) {
        // When enabling linked scrolling, record the current scroll position as the baseline.
        baselineScrollTop = scrollable.scrollTop;
        console.log("Iframe: Baseline scroll set to", baselineScrollTop);
      } else {
        baselineScrollTop = null;
      }
    }
  });

  // On scroll: if linked scrolling is enabled, send the change (delta) from baseline in page units.
  scrollable.addEventListener("scroll", () => {
    if (!isLinkedScrollingEnabled) return;
    if (isSyncing) return; // Skip if we're currently applying a sync update.
    
    // If baseline isn't set (should be set when sync is enabled), set it now.
    if (baselineScrollTop === null) {
      baselineScrollTop = scrollable.scrollTop;
    }
    
    const currentScrollTop = scrollable.scrollTop;
    const deltaPages = (currentScrollTop - baselineScrollTop) / onePageHeight;
    
    // Send the delta if it's significant.
    if (Math.abs(deltaPages) > 0.01) {
      window.parent.postMessage({ type: "iframeScrollDelta", deltaPages: deltaPages }, "*");
      console.log("Iframe: Sent deltaPages:", deltaPages);
    }
  });

  // When receiving a sync delta, update our scroll position relative to our own baseline.
  window.addEventListener("message", (event) => {
    if (event.data.type === "syncScrollDelta") {
      isSyncing = true;
      const deltaPages = event.data.deltaPages;
      // If our baseline isn't set, initialize it.
      if (baselineScrollTop === null) {
        baselineScrollTop = scrollable.scrollTop;
      }
      const targetScrollTop = baselineScrollTop + deltaPages * onePageHeight;
      const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
      const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));
      scrollable.scrollTop = clampedScrollTop;
      console.log("Iframe: Synced scroll to", clampedScrollTop, "using deltaPages", deltaPages);
      // Optionally, update baseline here if you want subsequent changes relative to the new position.
      // baselineScrollTop = clampedScrollTop;
      requestAnimationFrame(() => { isSyncing = false; });    }
  });
}

chrome.runtime.onMessage.addListener(({ type, name }) => {
  chrome.windows.getCurrent({}, function(wind) {
    let width = wind.width;
    chrome.windows.update(wind.id, { width: width - 1 });
    chrome.windows.update(wind.id, { width: width });
  });
});