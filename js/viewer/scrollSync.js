let isScrollSyncEnabled = false;
let activeFrame = null;
let lastActiveFrame = null; // Track the last frame interacted with
let scrolling = false;
let scrollTimeout = null;
const smoothFactor = 1.0; // Adjust for smoother scrolling
const maxScrollStep = 100; // Prevent large sudden jumps

/**
 * Initialize scroll sync by setting up scroll listeners on all existing frame containers.
 * Also, observe dynamically added frames.
 */
export function initScrollSync() {
  const iframeContainer = document.getElementById("iframeContainer");
  if (!iframeContainer) return;

  setupScrollListeners();

  // Observe dynamically added frames.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("url-container")) {
          setupFrameScrollListener(node);
        }
      });
    });
  });
  observer.observe(iframeContainer, { childList: true });
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

  // Listen for user scrolling **only in the active frame**
  containerFrame.addEventListener("wheel", (e) => {
    if (!isScrollSyncEnabled || scrolling) return;
    if (containerFrame === activeFrame) {
      e.preventDefault();
      transmitScrollDelta(e.deltaY);
    }
  }, { passive: false });

  let touchStartY = 0;
  containerFrame.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  containerFrame.addEventListener("touchmove", (e) => {
    if (!isScrollSyncEnabled || scrolling) return;
    if (containerFrame === activeFrame) {
      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
      transmitScrollDelta(deltaY);
    }
  }, { passive: false });

  // Detect user clicking to change active frame
  containerFrame.addEventListener("click", () => {
    if (activeFrame !== containerFrame) {
      lastActiveFrame = activeFrame;
      activeFrame = containerFrame;
      console.log(`🔄 Active frame updated. Last active frame is now ignored.`);
    }
  });

  // **NEW**: Detect scrollbar drags and sync delta
  iframe.contentWindow?.document?.addEventListener("scroll", () => {
    if (!isScrollSyncEnabled || scrolling || isUserScrolling) return; 
    if (containerFrame === activeFrame) {
        syncScrollFromScrollbar(iframe);
    }
}, { passive: true });
}

/**
 * **Calculate and Transmit `deltaY` Scroll**
 * Captures how much the user scrolled in the active window and applies
 * the same movement (`deltaY`) to all other frames **except the last active frame**.
 */
function transmitScrollDelta(deltaY) {
  if (scrolling) return;
  scrolling = true;

  // Prevent sudden large jumps
  if (Math.abs(deltaY) > maxScrollStep) {
    deltaY *= 0.95; // Gradually reduce large jumps instead of hard-capping them
}

  const frames = document.querySelectorAll(".url-container");
  frames.forEach((frame) => {
    if (frame === activeFrame || frame === lastActiveFrame) return; // NEVER update the active or last active frame

    const iframe = frame.querySelector("iframe");
    if (!iframe) return;

    try {
      if (!Number.isFinite(deltaY)) {
        console.warn("⚠️ Skipping invalid scroll update:", deltaY);
        return;
      }

      requestAnimationFrame(() => {
        iframe.contentWindow.postMessage(
          { type: "syncScroll", deltaY: deltaY },
          "*"
        );
      });

    } catch (e) {
      console.debug("⚠️ Failed to postMessage to frame:", e);
    }
  });

  scrollTimeout = setTimeout(() => {
    scrolling = false;
  }, 20); // Prevent jittering
}

/**
 * Toggle scroll syncing on or off.
 */
export function toggleSyncScroll(isLinkedScrolling) {
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    iframe.contentWindow.postMessage(
      { type: "setLinkedScrolling", linkedScrolling: isLinkedScrolling },
      "*"
    );
    console.log("Parent: set linkedScrolling to", isLinkedScrolling, "for an iframe");
  });
}

/**
 * Set the active frame (frame currently being interacted with).
 */
export function setActiveFrame(frame) {
  if (activeFrame !== frame) {
    lastActiveFrame = activeFrame;
    activeFrame = frame;
    console.log(`🔄 Active frame updated. Last active frame is now ignored.`);
  }
}

export function syncScrollStateToFrame(containerFrame, enabled) {
  const iframe = containerFrame?.querySelector('iframe');
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage({ type: 'setLinkedScrolling', enabled }, '*');
}

export function registerScrollableFrame(containerFrame, { rebind = false } = {}) {
  const iframe = containerFrame?.querySelector('iframe');
  if (!iframe) return;

  // Avoid stacking listeners unless explicitly rebinding
  if (rebind) {
    iframe.dataset.scrollSyncBound = 'false';
  }
  if (iframe.dataset.scrollSyncBound === 'true') return;
  iframe.dataset.scrollSyncBound = 'true';

  iframe.addEventListener(
    'load',
    () => {
      // After new document loads, push current sync state into it
      syncScrollStateToFrame(containerFrame, isScrollSyncEnabled);
    },
    { once: true }
  );
}