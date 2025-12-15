console.log("✅ Google Docs SplitView content script loaded!");

// Identify the app type and relevant elements.
function getAppType() {
  if (document.querySelector('.kix-appview-editor')) return 'docs';
  if (document.querySelector('.docs-sheet-container')) return 'sheets';
  if (document.querySelector('.punch-filmstrip-scroll')) return 'slides';
  return null;
}

const appType = getAppType();
let scrollable = null;
let rowHeaders = null;
let grid = null;
let observer = null;

if (appType === 'docs') {
  scrollable = document.querySelector('.kix-appview-editor');
} else if (appType === 'slides') {
  scrollable = document.querySelector('.punch-filmstrip-scroll');
} else if (appType === 'sheets') {
  rowHeaders = document.querySelector('.row-headers-content');
  grid = document.querySelector('.waffle-grid-container');
}

if (!appType || (appType !== 'sheets' && !scrollable) || (appType === 'sheets' && (!rowHeaders || !grid))) {
  console.warn("⚠️ No scrollable elements found!");
} else {
  console.log("✅ Found scrollable elements for", appType);

  let isSyncing = false;
  let isLinkedScrollingEnabled = false;
  let previousScroll = 0;

  // Listen for enable/disable linked scrolling.
  window.addEventListener("message", (event) => {
    if (event.data.type === "setLinkedScrolling") {
      isLinkedScrollingEnabled = event.data.linkedScrolling;
      console.log("Iframe: Linked scrolling set to", isLinkedScrollingEnabled);
      if (isLinkedScrollingEnabled) {
        previousScroll = getCurrentScroll();
      }
    }
  });

  // Function to get current scroll position.
  function getCurrentScroll() {
    if (appType === 'sheets') {
      const style = getComputedStyle(rowHeaders);
      const transform = style.transform;
      if (transform === 'none') return 0;
      const matrix = new DOMMatrix(transform);
      return -matrix.m42;
    } else {
      return scrollable.scrollTop;
    }
  }

  // Function to scroll by delta.
  function scrollByDelta(delta) {
    if (appType === 'sheets') {
      const style = getComputedStyle(rowHeaders);
      const matrix = new DOMMatrix(style.transform);
      const newY = matrix.m42 - delta;
      const x = matrix.m41;
      const newTransform = `translate(${x}px, ${newY}px)`;
      rowHeaders.style.transform = newTransform;
      grid.style.transform = newTransform;
    } else {
      scrollable.scrollBy(0, delta);
    }
  }

  // Handle scroll change.
  function handleScrollChange() {
    if (!isLinkedScrollingEnabled) return;
    if (isSyncing) return;
    
    const currentScroll = getCurrentScroll();
    const delta = currentScroll - previousScroll;
    
    if (Math.abs(delta) > 0.01) {
      window.parent.postMessage({ type: "iframeScrollDelta", deltaPixels: delta }, "*");
      console.log("Iframe: Sent deltaPixels:", delta);
      previousScroll = currentScroll;
    }
  }

  // Setup change detection.
  if (appType !== 'sheets') {
    scrollable.addEventListener("scroll", handleScrollChange);
  } else {
    observer = new MutationObserver(handleScrollChange);
    observer.observe(rowHeaders, { attributes: true, attributeFilter: ['style'] });
  }

  // Receive sync delta.
  window.addEventListener("message", (event) => {
    if (event.data.type === "syncScrollDelta") {
      isSyncing = true;
      const delta = event.data.deltaPixels;
      scrollByDelta(delta);
      console.log("Iframe: Synced with deltaPixels", delta);
      previousScroll = getCurrentScroll();
      requestAnimationFrame(() => { isSyncing = false; });
    }
  });
}

chrome.runtime.onMessage.addListener(({ type, name }) => {
  chrome.windows.getCurrent({}, function(wind) {
    let width = wind.width;
    chrome.windows.update(wind.id, { width: width - 1 });
    chrome.windows.update(wind.id, { width: width });
  });
});