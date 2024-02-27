
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const urls = params.get('urls') ? decodeURIComponent(params.get('urls')).split(',') : [];
    const iframeContainer = document.getElementById('iframeContainer');

    urls.forEach((url, index) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframeContainer.appendChild(iframe);
          
        if (index < urls.length - 1) { // Check if it's not the last iframe
            const divider = document.createElement('div');
            divider.className = 'iframe-divider'; // Assuming you have CSS for this class
            iframeContainer.appendChild(divider);
        }
    });
});
