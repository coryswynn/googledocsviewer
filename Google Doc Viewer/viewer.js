
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const urls = params.get('urls') ? decodeURIComponent(params.get('urls')).split(',') : [];
    const iframeContainer = document.getElementById('iframeContainer');

    urls.forEach(url => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframeContainer.appendChild(iframe);
    });
});
