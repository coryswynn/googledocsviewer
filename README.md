# GDocs SplitView

GDocs SplitView is a Google Chrome Extension that enhances your productivity by allowing you to view Google Docs, Sheets, Slides, and even Gmail tabs side-by-side within the same browser tab. With an easy-to-use interface, GDocs SplitView makes it simple to manage and interact with multiple documents without the need to switch between tabs constantly.

## Features

- **Split View**: Effortlessly combine multiple Google Docs, Sheets, Slides, and Gmail tabs into a single tab with split views.
- **Dynamic Resizing**: Adjust the size of each split section with a simple drag of the divider.
- **Toolbar for Each Document**: Each split section comes with a toolbar providing options to copy the document URL, open in a new tab, or toggle fullscreen view for focused work.
- **Title Display**: Automatically fetches and displays the title of each document for easy identification.
- **Responsive Design**: Adapts to various screen sizes for a seamless experience on different devices.

## Installation

1. Clone the repository or download the extension package.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable Developer Mode by toggling the switch at the top right corner.
4. Click on `Load unpacked` and select the directory where GDocs SplitView is located.
5. The extension will now be added to your Chrome browser.

## Usage

1. Click on the GDocs SplitView icon in the Chrome extension toolbar.
2. A popup will appear, displaying a list of currently open Google Docs, Sheets, Slides, and Gmail tabs.
3. Select the tabs you wish to view side-by-side and click `Open Combined Tab`.
4. The selected documents will be displayed in a split view within the same tab. You can adjust the size of each section by dragging the divider.

## Customization

- **Styling**: Customize the appearance by editing the `popup.css` and `viewer.css` files to match your preferred aesthetics.
- **Functionality Enhancements**: Modify `popup.js` and `viewer.js` for additional features or to fine-tune the existing functionality.

## Known Issues

- Title fetching may not work for documents with restricted access or not loaded due to network issues.
- Dynamic resizing might experience minor glitches on certain screen sizes or resolutions.

## Contributing

Contributions to GDocs SplitView are welcome! If you have suggestions for improvements or bug fixes, please feel free to fork the repository and submit a pull request.

## Acknowledgments

- Google Docs, Sheets, Slides, and Gmail are trademarks of Google LLC. This extension is not affiliated with or endorsed by Google LLC.
- Special thanks to the open-source community for guidance and support.
