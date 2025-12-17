let isScrollSyncEnabled = false;
let activeFrame           = null;
let lastActiveFrame       = null; // Track the last frame interacted with
let scrolling             = false;
let scrollTimeout         = null;

const smoothFactor  = 1.0;   // Adjust for smoother scrolling
const maxScrollStep = 100;   // Prevent large sudden jumps

function isSheetsOrSlidesIframe(iframe) {
  const src = iframe?.src || "";
  return (
    src.includes("spreadsheets.google.com") ||
    src.includes("presentation.google.com")
  );
}

/**
 * Initialize scroll sync by setting up scroll listeners on all existing frame containers.
 * Also, observe dynamically added frames.
 */
export function initScrollSync() {
  const iframeContainer = document.getElementById("iframeContainer");
  if (!iframeContainer) return;

  setupScrollListeners();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.classList.contains("url-container")
        ) {
          setupFrameScrollListener(node);
        }
      });
    });
  });

  observer.observe(iframeContainer, { childList: true });

  // 🔹 Listen for ratio responses from iframes (Sheets / Slides)
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "syncScrollRatio") return;

    const ratio = event.data.ratio;
    if (!Number.isFinite(ratio)) return;

    const frames = document.querySelectorAll(".url-container");

    frames.forEach((frame) => {
      if (frame === activeFrame || frame === lastActiveFrame) return;

      const iframe = frame.querySelector("iframe");
      if (!iframe) return;

      iframe.contentWindow.postMessage(
        { type: "syncScrollRatio", ratio },
        "*"
      );
    });
  });
}

/**
 * Set up scroll listeners for all iframe containers.
 */
function setupScrollListeners() {
  const frames = document.querySelectorAll(".url-container");
  frames.forEach(setupFrameScrollListener);
}

/**
 * Set up an overlay and attach scroll event listeners.
 */
function setupFrameScrollListener(containerFrame) {
  if (containerFrame.querySelector(".scroll-overlay")) return;

  const scrollOverlay = document.createElement("div");
  scrollOverlay.className = "scroll-overlay";
  scrollOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: transparent;
    pointer-events: ${isScrollSyncEnabled ? "auto" : "none"};
  `;

  containerFrame.style.position = "relative";
  containerFrame.appendChild(scrollOverlay);

  const iframe = containerFrame.querySelector("iframe");
  if (!iframe) return;

  containerFrame.addEventListener(
    "wheel",
    (e) => {
      if (!isScrollSyncEnabled || scrolling) return;
      if (containerFrame !== activeFrame) return;

      e.preventDefault();
      transmitScrollDelta(e.deltaY, iframe);
    },
    { passive: false }
  );

  let touchStartY = 0;

  containerFrame.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  containerFrame.addEventListener(
    "touchmove",
    (e) => {
      if (!isScrollSyncEnabled || scrolling) return;
      if (containerFrame !== activeFrame) return;

      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
      transmitScrollDelta(deltaY, iframe);
    },
    { passive: false }
  );

  containerFrame.addEventListener("click", () => {
    if (activeFrame !== containerFrame) {
      lastActiveFrame = activeFrame;
      activeFrame     = containerFrame;
      console.log("🔄 Active frame updated. Last active frame is now ignored.");
    }
  });
}

/**
 * Calculate and transmit scroll update (HYBRID).
 */
function transmitScrollDelta(deltaY, sourceIframe) {
  if (scrolling) return;
  scrolling = true;

  if (Math.abs(deltaY) > maxScrollStep) {
    deltaY *= 0.95;
  }

  const frames = document.querySelectorAll(".url-container");

  frames.forEach((frame) => {
    if (frame === activeFrame || frame === lastActiveFrame) return;

    const iframe = frame.querySelector("iframe");
    if (!iframe) return;

    requestAnimationFrame(() => {
      // 🔹 HYBRID DISPATCH
      if (isSheetsOrSlidesIframe(iframe)) {
        iframe.contentWindow.postMessage(
          { type: "syncScrollRatioRequest" },
          "*"
        );
      } else {
        iframe.contentWindow.postMessage(
          { type: "syncScroll", deltaY },
          "*"
        );
      }
    });
  });

  scrollTimeout = setTimeout(() => {
    scrolling = false;
  }, 20);
}

/**
 * Toggle scroll syncing on or off.
 */
export function toggleSyncScroll(isLinkedScrolling) {
  isScrollSyncEnabled = isLinkedScrolling;

  const iframes = document.querySelectorAll("iframe");

  iframes.forEach((iframe) => {
    iframe.contentWindow.postMessage(
      { type: "setLinkedScrolling", linkedScrolling: isLinkedScrolling },
      "*"
    );
  });
}

/**
 * Set the active frame.
 */
export function setActiveFrame(frame) {
  if (activeFrame !== frame) {
    lastActiveFrame = activeFrame;
    activeFrame     = frame;
    console.log("🔄 Active frame updated. Last active frame is now ignored.");
  }
}

export function registerScrollableFrame(containerFrame) {
  const iframe = containerFrame.querySelector("iframe");
  if (!iframe) return;

  iframe.addEventListener(
    "load",
    () => {
      iframe.contentWindow.postMessage(
        { type: "setLinkedScrolling", linkedScrolling: isScrollSyncEnabled },
        "*"
      );
    },
    { once: true }
  );
}

export function syncScrollStateToFrame(containerFrame, enabled) {
  const iframe = containerFrame.querySelector("iframe");
  if (!iframe) return;

  iframe.contentWindow.postMessage(
    { type: "setLinkedScrolling", linkedScrolling: enabled },
    "*"
  );
}