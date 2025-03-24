(function() {

  const _css = `
    body:-webkit-full-screen {
      width: 100%;
      height: 100%;
    }

    /* Hide distracting elements in distraction-free mode */
    .df-enabled .kix-document-top-shadow-inner,
    .df-enabled #docs-instant-button-bubble,  
    .df-enabled .navigation-widget,
    .df-enabled #docs-instant-bubble {
      display: none;
    }

    .df-enabled .docs-slidingdialog-holder {
      z-index: 1000;
    }

    #df-menu {
      top: 30px;
      left: 5px;
      display: none;
    }

    #df-menu-button {
      display: none;
    }

    .df-menuitem-theme::before {
      display: block;
      content: "";
      width: 10px;
      height: 10px;
      position: absolute;
      top: 10px;
      left: 15px;
      border-radius: 2px;
      border: 1px solid #111;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
    }

    .df-menuitem-theme {
      text-indent: 15px;
    }

    #df-mi-default::before { background-color: #eee; }
    #df-mi-paper::before { background-color: #fff; }
    #df-mi-dark::before { background-color: #222; }
    #df-mi-sepia::before { background-color: rgba(244,236,217,1); }
    #df-mi-midnight::before { background-color: #000; }

    /* Custom menu button styling with new icon (changes on exit/enter) */
    .df-enabled #df-menu-button {
      display: block;
      position: fixed;
      font-family: arial, sans-serif;
      top: 0;
      left: 0;
      font-size: 22px;
      line-height: 30px;
      background: transparent;
      border: 0;
      opacity: 0.2;
      cursor: pointer;
      z-index: 1000;
      color: #000;
      outline: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #df-menu-button:hover {
      opacity: 0.5;
    }

    #df-menu .goog-menuitem-content {
      pointer-events: none;
    }
    #df-menu .goog-menuitem:hover {
      background: #eee;
    }

    .df-enabled #kix-horizontal-ruler,
    .df-enabled .docs-explore-widget {
      pointer-events: none;
      opacity: 0;
    }

    .docs-df-hidemenus .goog-menu {
      opacity: 0.0 !important;
    }

    .df-enabled #docs-chrome >:not(#docs-palettes) {
      display: none;
      pointer-events: none;
      opacity: 0;
    }

    .df-enabled .docs-navigation-tab-button,
    .df-enabled .docs-companion-app-switcher-container {
      display: none;
    }

    .df-enabled #docs-editor.companion-enabled {
      width: 100% !important;
    }

    .gdocs-df-fade {
      display: none;
    }
    .df-enabled .gdocs-df-fade {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: transparent;
      content: "";
      height: 25px;
      z-index: 999;
      pointer-events: none;
    }

    .df-enabled .kix-page-compact::before {
      border: 0;
    }
    .df-enabled #docs-chrome,
    .df-enabled #docs-editor,
    .df-enabled .kix-page,
    .df-enabled .docs-ui-unprintable,
    .df-enabled .kix-appview-editor,
    .df-enabled .kix-canvas-tile-content,
    .df-enabled .kix-page-content-wrapper {
      background: transparent !important;
    }

    .df-enabled .kix-canvas-tile-content svg rect {
      fill: transparent !important;
    }

    .df-enabled.df-dark canvas.kix-canvas-tile-content,
    .df-enabled.df-midnight canvas.kix-canvas-tile-content {
      filter: invert(1);
    }
    .df-enabled.df-midnight canvas.kix-canvas-tile-content {
      opacity: 0.6;
    }
    .df-enabled .kix-page-paginated .kix-stacked-tile-page-shadow {
      box-shadow: none !important;
    }
    .df-enabled .kix-page-canvas-compact-mode {
      border-top: transparent;
    }
    .df-enabled .kix-commentoverlayrenderer-highlighted {
      background: #ffe168 !important;
    }
    .df-enabled .kix-paginateddocumentplugin-compact-mode,
    .df-enabled .kix-page-paginated,
    .df-enabled .kik-page,
    .df-enabled .kix-page-compact,
    .df-enabled .kix-page-compact-first {
      box-shadow: none !important;
    }

    /** SLIDES **/
    .df-enabled.df-slides .two-panel-layout .filmstrip,
    .df-enabled.df-slides #sketchy-horizontal-ruler,
    .df-enabled.df-slides #sketchy-vertical-ruler,
    .df-enabled.df-slides .speakernotes-dragger-thumb {
      display: none;
    }
    .df-enabled.df-slides #speakernotes,
    .df-enabled.df-slides #speakernotes-dragger {
      background: transparent !important;
      border-bottom-width: 0;
    }
    .df-enabled.df-slides #canvas {
      border: 0 !important;
      background-image: none;
      box-shadow: none !important;
    }

    /** DEFAULT **/
    .df-enabled.df-default,
    .df-enabled.df-default #docs-editor-container,
    .df-enabled.df-default #workspace-container,
    .df-enabled.df-default #workspace {
      background: #eee !important;
    }
    .df-enabled.df-slides #speakernotes-dragger {
      border-color: rgba(0,0,0,0.4);
    }
    .df-enabled.df-default #df-menu-button {
      color: #000 !important;
    }
    .df-enabled.df-default .gdocs-df-fade {
      background: -webkit-linear-gradient(top, rgba(238,238,238,1) 85%, rgba(238,238,238,0) 100%);
    }
    .df-enabled.df-default .kix-selection-overlay {
      background: #76a7fa !important;
      border-color: #76a7fa !important;
    }

    /** PAPER **/
    .df-enabled.df-paper #docs-editor-container {
      background: #fff !important;
    }
    .df-enabled.df-paper #df-menu-button {
      color: #000 !important;
    }
    .df-enabled.df-paper .gdocs-df-fade {
      background: -webkit-linear-gradient(top, rgba(255,255,255,1) 85%, rgba(255,255,255,0) 100%);
    }
    .df-enabled.df-paper .kix-selection-overlay {
      background: #76a7fa !important;
      border-color: #76a7fa !important;
    }

    /** DARK **/
    .df-enabled.df-dark ::-webkit-scrollbar-thumb {
      background-color: rgba(255,255,255,0.2);
    }
    .df-enabled.df-dark,
    .df-enabled.df-dark #docs-editor-container,
    .df-enabled.df-dark #workspace-container,
    .df-enabled.df-dark #workspace {
      background: #000 !important;
    }
    .df-enabled.df-slides.df-dark #speakernotes-dragger {
      border-color: rgba(255,255,255,0.1);
    }
    .df-enabled.df-dark .kix-cursor-caret {
      border-color: #ddd !important;
    }
    .df-enabled.df-dark.df-slides #speakernotes svg rect {
      fill: #ddd !important;
    }
    .df-enabled.df-dark #df-menu-button,
    .df-enabled.df-dark .kix-wordhtmlgenerator-word-node,
    .df-enabled.df-dark .goog-inline-block.kix-lineview-text-block {
      color: #ddd !important;
    }
    .df-enabled.df-dark #speakernotes .sketchy-text-content-text text {
      fill: #ddd !important;
    }
    .df-enabled.df-dark .kix-lineview-decorations div {
      border-color: #ddd !important;
    }
    .df-enabled.df-dark .gdocs-df-fade {
      background: -webkit-linear-gradient(top, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%);
    }
    .df-enabled.df-dark tr,
    .df-enabled.df-dark td {
      border-color: #fff !important;
    }
    .df-enabled.df-dark .kix-selection-overlay {
      background: #6A6A6A !important;
      border-color: #6A6A6A !important;
    }
    .df-enabled.df-dark .kix-commentoverlayrenderer-highlighted {
      background: #325e80 !important;
    }
    .df-enabled.df-dark .goog-menu {
      background-color: #111;
    }
    .df-enabled.df-dark .goog-menuitem:hover {
      color: #000;
    }
    .df-enabled.df-dark .df-menuitem-theme::before {
      border: 1px solid #eee;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5);
    }
    .df-enabled.df-dark .goog-menuitem:hover .docs-icon-img-container {
      filter: invert(0%);
    }
    .df-enabled.df-dark .docs-icon-img-container {
      filter: invert(100%);
    }
    .df-enabled.df-dark .goog-menuitem {
      color: #ccc;
    }

    /** SEPIA **/
    .df-enabled.df-sepia,
    .df-enabled.df-sepia #docs-editor-container,
    .df-enabled.df-sepia #workspace-container,
    .df-enabled.df-sepia #workspace {
      background: rgb(244,236,217) !important;
    }
    .df-enabled.df-sepia #df-menu-button,
    .df-enabled.df-sepia .kix-wordhtmlgenerator-word-node,
    .df-enabled.df-sepia .goog-inline-block.kix-lineview-text-block {
      color: #644F48 !important;
    }
    .df-enabled.df-slides.df-sepia #speakernotes-dragger {
      border-color: rgba(185,168,128,0.4);
    }
    .df-enabled.df-sepia #speakernotes .sketchy-text-content-text text {
      fill: #644F48 !important;
    }
    .df-enabled.df-sepia .kix-lineview-decorations div {
      border-color: #644F48 !important;
    }
    .df-enabled.df-sepia .kix-cursor-caret {
      border-color: #644F48 !important;
    }
    .df-enabled.df-sepia.df-slides #speakernotes svg rect {
      fill: #644F48 !important;
    }
    .df-enabled.df-sepia .gdocs-df-fade {
      background: -webkit-linear-gradient(top, rgba(244,236,217,1) 85%, rgba(244,236,217,0) 100%);
    }
    .df-enabled.df-sepia .kix-selection-overlay {
      background: #62aed2 !important;
      border-color: #62aed2 !important;
    }

    /** MIDNIGHT **/
    .df-enabled.df-midnight,
    .df-enabled.df-midnight #docs-editor-container,
    .df-enabled.df-midnight #workspace-container,
    .df-enabled.df-midnight #workspace {
      background: #000 !important;
    }
    .df-enabled.df-midnight ::-webkit-scrollbar-thumb {
      background-color: rgba(255,255,255,0.2);
    }
    .df-enabled.df-slides.df-midnight #speakernotes-dragger {
      border-color: rgba(255,255,255,0.1);
    }
    .df-enabled.df-midnight #df-menu-button,
    .df-enabled.df-midnight .kix-wordhtmlgenerator-word-node,
    .df-enabled.df-midnight .goog-inline-block.kix-lineview-text-block {
      color: #aaaaaa !important;
    }
    .df-enabled.df-midnight #speakernotes .sketchy-text-content-text text {
      fill: #aaaaaa !important;
    }
    .df-enabled.df-midnight .kix-lineview-decorations div {
      border-color: #aaaaaa !important;
    }
    .df-enabled.df-midnight .kix-cursor-caret {
      border-color: #aaaaaa !important;
    }
    .df-enabled.df-midnight.df-slides #speakernotes svg rect {
      fill: #aaa !important;
    }
    .df-enabled.df-midnight .gdocs-df-fade {
      background: -webkit-linear-gradient(top, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%);
    }
    .df-enabled.df-midnight .kix-selection-overlay {
      background: rgb(81,83,89) !important;
      border-color: rgb(81,83,89) !important;
    }
    
    /* Smooth transition for exit */
/* Initial state before transition starts */
.df-transition-enter {
  opacity: 0;
  transform: scale(1.05);
  filter: blur(5px);
}

/* Activated distraction-free mode */
.df-enabled {
  transition: filter 0.6s, opacity 0.7s ease-in-out, transform 0.6s ease-in-out, background-color 0.6s ease-in-out;
  opacity: 1;
  transform: scale(1);
  filter: blur(0px);
}

/* Smooth fade-out when exiting */
.df-transition-exit {
  opacity: 0;
  transform: scale(0.95);
  filter: blur(5px);
}
  `;

  const _themes = [
    { key: "default", title: "Default theme" },
    { key: "paper", title: "Paper" },
    // { key: "sepia", title: "Sepia" },
    { key: "midnight", title: "Midnight" },
    { key: "dark", title: "Dark" }
  ];

  var _isDocsApp = window.location.href.indexOf("document") !== -1;
  var _isSlidesApp = window.location.href.indexOf("presentation") !== -1;
  if (_isDocsApp) {
    document.body.classList.add("df-docs");
  } else if (_isSlidesApp) {
    document.body.classList.add("df-slides");
  }
  var _containerSelector = ".docs-titlebar-badges";
  var _starSelector = ".docs-star-container";
  var _theme = "default";

  let _styleElement = document.createElement("style");
  _styleElement.innerText = _css;

  var _toolbarButtonContainer = document.createElement("div");
  _toolbarButtonContainer.className = "goog-inline-block";

  // Change the icon for entering distraction-free mode to a unique glyph (e.g., ⧉)
  var _menuButtonElement = document.createElement("button");
  _menuButtonElement.id = "df-menu-button";
  _menuButtonElement.innerText = "⧉";
  _menuButtonElement.addEventListener("click", toggleMenu);

  var _menu = document.createElement("div");
  _menu.id = "df-menu";
  _menu.className = "goog-menu goog-menu-vertical goog-menu-noicon goog-menu-noaccel";
  var menuHTML = `
    <div class="goog-menuitem" role="option" id="df-mi-exit" style="user-select: none;">
      <div class="goog-menuitem-content" style="user-select: none;">Exit</div>
    </div>`;
  if (_isDocsApp) {
    menuHTML += `<div class="goog-menuitem" role="option" id="df-mi-zoom" style="user-select: none;">
      <div class="goog-menuitem-content" style="user-select: none;">Set Zoom</div>
    </div>`;
  }
  menuHTML += `
    <div class="goog-menuseparator" role="separator" aria-disabled="true" id=":1n" style="user-select: none;"></div>`;
  _themes.forEach(function(theme) {
    menuHTML += `<div class="goog-menuitem df-menuitem-theme" role="option" id="df-mi-${theme.key}" data-theme="${theme.key}" style="user-select: none;">
      <div class="goog-menuitem-content" style="user-select: none;">${theme.title}</div>
    </div>`;
  });
  _menu.innerHTML = menuHTML;
  if (_isDocsApp) {
    _menu.querySelector("#df-mi-zoom").addEventListener("click", openZoomMenu);
  }
  _menu.querySelector("#df-mi-exit").addEventListener("click", exitMode);
  _themes.forEach(function(theme) {
    _menu.querySelector("#df-mi-" + theme.key).addEventListener("click", handleThemeMenuItemClick);
  });

  // var _enterModeButton = document.createElement("div");
  // _toolbarButtonContainer.appendChild(_enterModeButton);
  // _enterModeButton.style = `
  //   background: transparent;
  //   border: 0;
  //   font-size: 22px;
  //   opacity: 0.8;
  //   color: #737373;
  //   cursor: pointer;
  // `;
  // _enterModeButton.className = "goog-inline-block";
  // // Change the button icon to the new unique glyph for entering mode
  // _enterModeButton.innerText = "⧉";
  // _enterModeButton.dataset.tooltip = "Enter distraction free mode";
  // _enterModeButton.addEventListener("mouseover", function() {
  //   this.style.opacity = 1;
  // });
  // _enterModeButton.addEventListener("mouseout", function() {
  //   this.style.opacity = 0.8;
  // });
  // _enterModeButton.addEventListener("click", () => {
  //   if (document.body.classList.contains("df-enabled")) {
  //     window.focusMode.exitMode();
  //   } else {
  //     window.focusMode.enterMode();
  //   }
  // });
  
  var _fadeElement = document.createElement("div");
  _fadeElement.className = "gdocs-df-fade";

  function toggleMenu(evt) {
    _menu.style.display = _menu.style.display == "block" ? "none" : "block";
  }

  function closeMenu(evt) {
    if (evt.target.id == "df-menu-button") {
      return;
    }
    _menu.style.display = "none";
  }

  function handleThemeMenuItemClick(evt) {
    setTheme(evt.target.dataset.theme);
  }

  function uncheckMenuItem(element) {
    if (!element) return;
    if (!element.classList.contains("goog-option-selected")) return;
    clickInterfaceElement(element);
  }

  function clickInterfaceElement(element) {
    if (!element) return;
    var downEvent = document.createEvent("MouseEvents");
    downEvent.initEvent("mousedown", true, true);
    var upEvent = document.createEvent("MouseEvents");
    upEvent.initEvent("mouseup", true, true);
    element.dispatchEvent(downEvent);
    element.dispatchEvent(upEvent);
  }

  function $i(id) {
    return document.getElementById(id);
  }

  function forceRelayout() {
    if (typeof chrome != "undefined") {
      chrome.runtime.sendMessage("forceRelayout");
    }
  }

  // Automatically enter distraction-free mode when toggled on from the sidebar.
  // Toggling off calls exitMode, which now animates a smooth exit.

  function attempt(lookup, success, failure, maxTries, ms) {
    if (!maxTries) maxTries = 5;
    if (!ms) ms = 100;
    var numberTries = 0;
    var fn = function() {
      var result = lookup();
      if (result) {
        success(result);
      } else {
        if (numberTries < maxTries) {
          numberTries++;
          window.setTimeout(fn, ms);
        } else {
          failure();
        }
      }
    };
    window.setTimeout(fn, ms);
  }

  function enterMode() {
    if (_isDocsApp) {
      attempt(
        function () {
          document.body.classList.add("docs-df-hidemenus");
          clickInterfaceElement($i("docs-view-menu"));
          let checkbox;
          document.querySelectorAll(".goog-menu").forEach(function (menuElement) {
            if (getComputedStyle(menuElement).display !== "none") {
              checkbox = menuElement.querySelector("[role=menuitemcheckbox]");
            }
          });
          return checkbox;
        },
        function (checkbox) {
          uncheckMenuItem(checkbox);
          uncheckMenuItem(checkbox);
  
          // Start transition effect
          document.body.classList.add("df-transition-enter");
          setTimeout(() => {
            document.body.classList.remove("df-transition-enter");
            document.body.classList.add("df-enabled");
          }, 50); // Allow transition to be recognized
  
          // Inject style and UI elements if not already present
          if (!document.head.contains(_styleElement)) {
            document.head.appendChild(_styleElement);
          }
          if (!document.body.contains(_menuButtonElement)) {
            document.body.appendChild(_menuButtonElement);
          }
          if (!document.body.contains(_menu)) {
            document.body.appendChild(_menu);
          }
  
          let editor = document.querySelector(".kix-appview-editor");
          if (editor) {
            editor.style.height = "100vh";
            editor.style.width = "100vw";
          }
  
          document.body.classList.remove("docs-df-hidemenus");
          clickInterfaceElement(document.body);
          forceRelayout();
  
          // Store state in local storage
          localStorage.setItem(extractURL(), true);
  
          // Notify parent window of state change
          window.parent.postMessage(
            { type: "focusModeState", isEnabled: true },
            "*"
          );
        },
        function () {
          console.error("Failed to activate distraction‑free mode.");
        }
      );
    } else {
      document.body.classList.add("df-transition-enter");
      setTimeout(() => {
        document.body.classList.remove("df-transition-enter");
        document.body.classList.add("df-enabled");
      }, 0);
  
      // Inject UI elements if not present
      if (!document.body.contains(_menuButtonElement)) {
        document.body.appendChild(_menuButtonElement);
      }
      if (!document.body.contains(_menu)) {
        document.body.appendChild(_menu);
      }
  
      forceRelayout();
  
      // Notify parent window of state change
      window.parent.postMessage(
        { type: "focusModeState", isEnabled: true },
        "*"
      );
    }
  }
  
  function exitMode() {
    document.body.classList.add("df-transition-exit");

    setTimeout(() => {
        document.body.classList.remove("df-enabled");

        // Restore all Google Docs UI elements
        document.querySelectorAll("#docs-chrome, #docs-editor, .kix-page, .docs-ui-unprintable, .navigation-widget, .kix-document-top-shadow-inner")
            .forEach(el => {
                el.style.removeProperty("display");
                el.style.removeProperty("opacity");
                el.style.removeProperty("pointer-events");
            });

        // Force re-render of the Google Docs UI
        const docsChrome = document.getElementById("docs-chrome");
        if (docsChrome) {
            docsChrome.style.display = "none";
            setTimeout(() => docsChrome.style.display = "", 50);
        }

        // Remove UI elements safely
        if (_menuButtonElement.parentElement) {
            _menuButtonElement.parentElement.removeChild(_menuButtonElement);
        }
        if (_menu.parentElement) {
            _menu.parentElement.removeChild(_menu);
        }

        // Force a click to refresh UI
        document.body.click();

        // Ensure toolbar reloads properly by triggering a simulated UI event
        const event = new Event("focus");
        window.dispatchEvent(event);

        // Force a UI refresh via MutationObserver
        const observer = new MutationObserver(() => {
            document.body.click();
            observer.disconnect();
        });

        observer.observe(document.body, { childList: true, attributes: true, subtree: true });

        forceRelayout();
        localStorage.removeItem(extractURL());
        document.body.classList.remove("df-transition-exit");
 
        // Simulate first toggle of ctrl+shift+f
        let eventDown1 = new KeyboardEvent("keydown", { key: "F", code: "KeyF", ctrlKey: true, shiftKey: true, bubbles: true });
        let eventUp1 = new KeyboardEvent("keyup", { key: "F", code: "KeyF", ctrlKey: true, shiftKey: true, bubbles: true });
        document.dispatchEvent(eventDown1);
        document.dispatchEvent(eventUp1);
 
        // Simulate second toggle of ctrl+shift+f
        let eventDown2 = new KeyboardEvent("keydown", { key: "F", code: "KeyF", ctrlKey: true, shiftKey: true, bubbles: true });
        let eventUp2 = new KeyboardEvent("keyup", { key: "F", code: "KeyF", ctrlKey: true, shiftKey: true, bubbles: true });
        document.dispatchEvent(eventDown2);
        document.dispatchEvent(eventUp2);
 
        // Notify parent window of state change
        window.parent.postMessage(
            { type: "focusModeState", isEnabled: false },
            "*"
        );
    }, 100); // Matches CSS transition duration (0.6s for smooth effect)
}

  function handleOnLoad() {
    document.head.appendChild(_styleElement);
    if (_isDocsApp) {
      document.body.appendChild(_fadeElement);
    }
    document.body.addEventListener("click", closeMenu);
    let containerElement = document.querySelector(_containerSelector);
    let starElement = document.querySelector(_starSelector);
    if (containerElement && starElement && (_isDocsApp || _isSlidesApp)) {
      setTimeout(function() {
        containerElement.insertBefore(_toolbarButtonContainer, starElement.nextSibling);
      }, 500);
    }
    setTheme(localStorage.getItem("df-theme"));
    // Automatically enter distraction-free mode if toggled on in the sidebar.
    if (localStorage.getItem(extractURL())) {
      enterMode();
    }
  }

  function extractURL() {
    return window.location.href.split("#")[0];
  }

  function setTheme(theme) {
    if (!theme) theme = "default";
    _theme = theme;
    _themes.forEach(function(theme) {
      document.body.classList.remove("df-" + theme.key);
    });
    document.body.classList.add("df-" + theme);
    localStorage.setItem("df-theme", theme);
  }

  function openZoomMenu(evt) {
    clickInterfaceElement($i("zoomSelect"));
    let menus = Array.prototype.slice.call(document.querySelectorAll(".goog-menu-vertical"));
    let menu = menus.reverse().find(function(elm) {
      return elm.innerHTML.indexOf("100%") != -1;
    });
    if (menu) {
      menu.style.left = "5px";
      menu.style.top = "5px";
    }
  }

  function handleKeyDown(evt) {
    if (evt.keyCode == 27) exitMode();
  }

  function toggleFullScreen() {
    if (document.webkitFullscreenElement || document.mozFullScreenElement) {
      exitFullScreen();
    } else if (!document.webkitFullscreenElement && !document.mozFullScreenElement) {
      enterFullScreen();
    }
  }

  function enterFullScreen() {
    if (document.body.webkitRequestFullScreen) {
      document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (document.body.mozRequestFullScreen) {
      document.body.mozRequestFullScreen();
    }
  }

  function exitFullScreen() {
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
  }

  // Expose distraction-free mode functions globally
  window.focusMode = {
    enterMode: enterMode,
    exitMode: exitMode
  };
  
  (function initMessageListener() {
    window.addEventListener("message", (event) => {
      // Check if message is from parent window
      if (event.source === window.parent) {
        if (event.data.action === "enterMode") {
          window.focusMode.enterMode();
          console.log("Iframe: Called enterMode via postMessage");
        } else if (event.data.action === "exitMode") {
          window.focusMode.exitMode();
          console.log("Iframe: Called exitMode via postMessage");
        }
      }
    });

    // Send initial state to parent window
    if (document.body.classList.contains('df-enabled')) {
      window.parent.postMessage({
        type: 'focusModeState',
        isEnabled: true
      }, '*');
    }
  })();

  // Ensure the script runs after DOM is loaded
  document.addEventListener("DOMContentLoaded", handleOnLoad);
  if (document.readyState === "complete" || document.readyState === "interactive") {
    handleOnLoad();
  }

})();

