// urlManager.js: Handles URL parameter processing.

// urlManager.js
export function getURLs() {
  const params = new URLSearchParams(window.location.search);
  const urlsParam = params.get('urls');
  return urlsParam ? decodeURIComponent(urlsParam).split(',') : [];
}

export function updateURL(containerFrame, newURL) {
  const iframe = containerFrame.querySelector('iframe');
  if (iframe) {
    iframe.src = newURL;
  }
}

export function updateContainerFrameTitle(containerFrame, newTitle) {
  const titleElement = containerFrame.querySelector('.url-text');
  if (titleElement) {
    titleElement.textContent = newTitle;
  }
}

// This function encapsulates the fetching of the document title from the URL.
export function fetchAndDisplayTitle(url, containerFrame) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = doc.querySelector('title').innerText;
      updateContainerFrameTitle(containerFrame, title.replace(/( - Google (Sheets|Docs|Slides))/, ''));
    })
    .catch(error => {
      console.error('Error fetching or parsing URL:', error);
      updateContainerFrameTitle(containerFrame, 'Title unavailable');
    });
}

// Add more functions as needed
