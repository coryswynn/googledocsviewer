console.log("✅ Google Docs SplitView content script loaded!");

function findScrollableAncestor(el) {
  let node = el;
  while (node && node !== document.body) {
    const canScroll =
      node.scrollHeight > node.clientHeight &&
      getComputedStyle(node).overflowY !== "hidden";
    if (canScroll) return node;
    node = node.parentElement;
  }
  return null;
}

function getGoogleDocsScrollElement() {
  // Google Docs
  const docs =
    document.querySelector(".kix-appview-editor-content") ||
    document.querySelector(".kix-appview-editor");
  if (docs) return docs;

  // Google Slides (authoritative)
  const slidesExact = document.getElementById("workspace");
  if (slidesExact) return slidesExact;

  const slidesFallback = document.querySelector(".punch-filmstrip-scroll");
  if (slidesFallback) return slidesFallback;

  // Google Sheets (authoritative)
  const sheetsExact = document.getElementById("scrollable_right_1");
  if (sheetsExact) return sheetsExact;

  const sheetsBase =
    document.querySelector(".docs-sheet-container") ||
    document.querySelector(".grid-container") ||
    document.querySelector("div.grid-view-container");

  if (sheetsBase) {
    const scrollableSheets = findScrollableAncestor(sheetsBase);
    if (scrollableSheets) return scrollableSheets;
  }

  return null;
}

function waitForScrollableElement(callback, timeout = 5000) {
  const start = Date.now();

  const interval = setInterval(() => {
    const el = getGoogleDocsScrollElement();

    const isReady =
      el &&
      el.clientHeight > 0 &&
      (
        el.scrollHeight > el.clientHeight ||
        el === document.querySelector(".kix-appview-editor-content") ||
        el === document.querySelector(".kix-appview-editor")
      );

    if (isReady) {
      clearInterval(interval);
      callback(el);
      return;
    }

    if (Date.now() - start > timeout) {
      clearInterval(interval);
      console.warn("⚠️ Unable to resolve scroll targets (timed out)");
    }
  }, 100);
}

waitForScrollableElement((scrollable) => {
  console.log("✅ Found scrollable element inside iframe:", scrollable);

  function recomputePageHeight() {
    const el =
      scrollable.querySelector(".kix-page") ||      // Docs
      scrollable.querySelector(".filmstrip-slide"); // Slides (legacy)
    return el ? el.clientHeight : scrollable.clientHeight;
  }

  function getScrollRatio() {
    const max =
      scrollable.scrollHeight - scrollable.clientHeight;
    if (max <= 0) return 0;
    return scrollable.scrollTop / max;
  }

  function applyScrollRatio(ratio) {
    const max =
      scrollable.scrollHeight - scrollable.clientHeight;
    scrollable.scrollTop = ratio * max;
  }

  let onePageHeight = recomputePageHeight();

  let isSyncing                = false;
  let isLinkedScrollingEnabled = false;
  let baselineScrollTop        = null;

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;

    if (event.data.type === "setLinkedScrolling") {
      isLinkedScrollingEnabled = event.data.linkedScrolling;
      baselineScrollTop = isLinkedScrollingEnabled
        ? scrollable.scrollTop
        : null;
      return;
    }

    // 🔹 HYBRID: Parent requesting ratio (Sheets / Slides)
    if (event.data.type === "syncScrollRatioRequest") {
      window.parent.postMessage(
        {
          type: "syncScrollRatio",
          ratio: getScrollRatio(),
        },
        "*"
      );
      return;
    }

    // 🔹 HYBRID: Apply absolute scroll (Sheets / Slides)
    if (event.data.type === "syncScrollRatio") {
      if (!isLinkedScrollingEnabled) return;
      isSyncing = true;
      applyScrollRatio(event.data.ratio);
      requestAnimationFrame(() => {
        isSyncing = false;
      });
      return;
    }

    // Existing delta-based path (Docs)
    if (event.data.type === "syncScrollDelta") {
      isSyncing = true;

      if (baselineScrollTop === null) {
        baselineScrollTop = scrollable.scrollTop;
      }

      onePageHeight = recomputePageHeight();

      const targetScrollTop =
        baselineScrollTop + event.data.deltaPages * onePageHeight;

      const maxScroll =
        scrollable.scrollHeight - scrollable.clientHeight;

      scrollable.scrollTop = Math.max(
        0,
        Math.min(targetScrollTop, maxScroll)
      );

      baselineScrollTop = scrollable.scrollTop;

      requestAnimationFrame(() => {
        isSyncing = false;
      });
    }
  });

  // Existing delta emission (Docs only)
  scrollable.addEventListener("scroll", () => {
    if (!isLinkedScrollingEnabled || isSyncing) return;

    if (baselineScrollTop === null) {
      baselineScrollTop = scrollable.scrollTop;
      return;
    }

    onePageHeight = recomputePageHeight();

    const deltaPages =
      (scrollable.scrollTop - baselineScrollTop) / onePageHeight;

    if (Math.abs(deltaPages) > 0.01) {
      window.parent.postMessage(
        { type: "iframeScrollDelta", deltaPages },
        "*"
      );
      baselineScrollTop = scrollable.scrollTop;
    }
  });

  window.parent.postMessage({ type: "contentScriptReady" }, "*");
});