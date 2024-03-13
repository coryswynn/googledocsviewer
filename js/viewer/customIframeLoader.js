class CustomIframeLoader extends HTMLIFrameElement {
  static get observedAttributes() {
    return ['src'];
  }

  constructor() {
    super();
    this.initSandbox();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && newValue !== oldValue) {
      this.load(newValue);
    }
  }

  connectedCallback() {
    this.load(this.getAttribute('src'));
  }

  initSandbox() {
    const defaultSandbox = [
      'allow-forms',
      'allow-modals',
      'allow-pointer-lock',
      'allow-popups',
      'allow-popups-to-escape-sandbox',
      'allow-presentation',
      'allow-same-origin',
      'allow-scripts',
      'allow-top-navigation-by-user-activation' // all except allow-top-navigation
    ];
    this.sandbox = this.sandbox ? this.sandbox + ' ' + defaultSandbox.join(' ') : defaultSandbox.join(' ');
  }

  load(url, options = {}) {
    if (!url || !url.startsWith('http')) {
      throw new Error(`CustomIframeLoader src ${url} does not start with http(s)://`);
    }
    this.displayLoader();
    this.fetchProxy(url, options)
      .then(res => res.text())
      .then(data => this.updateContent(url, data))
      .catch(e => console.error('Cannot load CustomIframeLoader:', e));
  }

  displayLoader() {
    this.srcdoc = `<html><head><style>.loader {position: absolute;top: 50%;left: 50%;width: 50px;height: 50px;background-color: #333;border-radius: 50%;transform: translate(-50%, -50%);animation: loader 1s infinite ease-in-out;}@keyframes loader {0% {transform: scale(0) translate(-50%, -50%);}100% {transform: scale(1) translate(-50%, -50%);opacity: 0;}}</style></head><body><div class="loader"></div></body></html>`;
  }

  updateContent(baseUrl, data) {
    this.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}"><script>document.addEventListener('click', e => {if (frameElement && document.activeElement && document.activeElement.href) {e.preventDefault();frameElement.load(document.activeElement.href);}});document.addEventListener('submit', e => {if (frameElement && document.activeElement.form) {e.preventDefault();const form = document.activeElement.form;const method = form.method.toLowerCase();const action = form.action;const body = method === 'post' ? new FormData(form) : new URLSearchParams(new FormData(form));frameElement.load(action, {method, body});}});</script>`);
  }

  fetchProxy(url, options) {
    const proxies = [
      'https://cors-anywhere.herokuapp.com/',
      'https://yacdn.org/proxy/',
      'https://api.codetabs.com/v1/proxy/?quest='
    ];
    let proxyIndex = 0;

    const attemptFetch = (index) => fetch(proxies[index] + url, options)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res;
      })
      .catch(error => {
        if (index >= proxies.length - 1) throw error;
        return attemptFetch(index + 1);
      });

    return attemptFetch(proxyIndex);
  }
}

customElements.define('custom-iframe-loader', CustomIframeLoader, { extends: 'iframe' });

// Example code to implement in html <iframe is="custom-iframe-loader" src="https://google.com/">
