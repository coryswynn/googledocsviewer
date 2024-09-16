// sidebar.js

// Import necessary functionality for integrating with the rest of the application
import { addNewFrame, adjustModalPosition, encodeAndJoinFrameURLs, getSavedTabTitle } from './modalManager.js';
import { getActiveContainerFrame } from './init.js';
import { saveToLocalStorage, loadFromLocalStorage } from '../storageUtils.js'; // Import storage utils
import { updateDividers, updateIframeProportions } from './iframeManager.js';


// Ensure the script runs after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Create the sidebar element first
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  // Append the sidebar to the DOM immediately
  document.body.insertBefore(sidebar, document.body.firstChild);

  // Check if sidebar is enabled
  chrome.storage.local.get(['sidebarEnabled'], function (result) {
    const sidebarEnabled = result.sidebarEnabled !== false; // Default to true if not set
    if (sidebarEnabled) {
      // Proceed to create and display the sidebar
      initializeSidebar(sidebar);
    } else {
      // Hide the sidebar
      sidebar.classList.add('hidden');
      document.body.classList.add('sidebar-hidden'); // Adjust layout
    }
  });

  // Listen for changes to 'sidebarEnabled'
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.sidebarEnabled) {
      const sidebarEnabled = changes.sidebarEnabled.newValue;
      if (sidebarEnabled) {
        sidebar.classList.remove('hidden');
        document.body.classList.remove('sidebar-hidden'); // Adjust layout

        // If the sidebar wasn't initialized before, initialize it now
        if (!sidebar.hasChildNodes()) {
          initializeSidebar(sidebar);
        }
      } else {
        sidebar.classList.add('hidden');
        document.body.classList.add('sidebar-hidden'); // Adjust layout
      }
    }
  });
});


// Function to initialize the sidebar
function initializeSidebar(sidebar) {
  // Define a key for localStorage
  const SIDEBAR_DATA_KEY = 'sidebarData';

  // Load existing data or initialize default data
  let sidebarData = loadFromLocalStorage(SIDEBAR_DATA_KEY) || {
    folders: [],
    isSidebarOpen: false,
    isFramesVertical: false
  };

  // Check if sidebar should be open or closed
  if (!sidebarData.isSidebarOpen) {
    sidebar.classList.add('close');
  }

  // Create the logo and toggle buttons
  const logoDetails = document.createElement('div');
  logoDetails.className = 'logo-details';

  // Toggle sidebar button
  const toggleSidebarBtn = document.createElement('i');
  toggleSidebarBtn.className = 'bx bx-menu';
  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('close');
    sidebarData.isSidebarOpen = !sidebar.classList.contains('close');
    saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
    adjustLayoutForSidebar(sidebar);

  });

  // Logo name
  const logoName = document.createElement('span');
  logoName.className = 'logo_name';
  logoName.textContent = 'Workspace';

  logoDetails.appendChild(toggleSidebarBtn);
  logoDetails.appendChild(logoName);

  // Create nav links container
  const navLinks = document.createElement('ul');
  navLinks.className = 'nav-links';

  // Create UI for toggling frames orientation
  const toggleFramesOrientationLi = document.createElement('li');
  const toggleFramesOrientationLink = document.createElement('a');
  toggleFramesOrientationLink.href = '#';
  const toggleFramesIcon = document.createElement('i');
  toggleFramesIcon.className = 'bx bx-transfer'; // Choose an appropriate icon
  const toggleFramesSpan = document.createElement('span');
  toggleFramesSpan.className = 'link_name';
  toggleFramesSpan.textContent = 'Toggle Frames';

  toggleFramesOrientationLink.appendChild(toggleFramesIcon);
  toggleFramesOrientationLink.appendChild(toggleFramesSpan);
  toggleFramesOrientationLi.appendChild(toggleFramesOrientationLink);

  // Add event listener for toggling frames orientation
  toggleFramesOrientationLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Implement the logic to toggle frames orientation
    // Assuming there is a function to handle this
    toggleFramesOrientation(); // You need to implement this function
    sidebarData.isFramesVertical = !sidebarData.isFramesVertical;
    saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
  });

  navLinks.appendChild(toggleFramesOrientationLi);

  // Add share button
  const shareButtonLi = document.createElement('li');
  const shareButtonLink = document.createElement('a');
  shareButtonLink.href = '#';
  const shareButtonIcon = document.createElement('i');
  shareButtonIcon.className = 'bx bx-share-alt'; // Use an appropriate icon class
  const shareButtonSpan = document.createElement('span');
  shareButtonSpan.className = 'link_name';
  shareButtonSpan.textContent = 'Share Workspace';

  shareButtonLink.appendChild(shareButtonIcon);
  shareButtonLink.appendChild(shareButtonSpan);
  shareButtonLi.appendChild(shareButtonLink);

  // Event listener for the share button
  shareButtonLink.onclick = () => {
    console.log("Share button clicked.");

    let newURL;
    newURL = 'https://coryswynn.github.io/SplitViewWeb/?urls=' + encodeAndJoinFrameURLs();
    console.log(newURL);

    const state = { page: newURL };
    const title = ''; // Optional: You can set a title for the new state
    const url = newURL; // The new URL you want to show in the browser

    window.open(url, '_blank');
  };

  navLinks.appendChild(shareButtonLi);

  // Add button to add new folder
  const addFolderLi = document.createElement('li');
  const addFolderLink = document.createElement('a');
  addFolderLink.href = '#';
  const addFolderIcon = document.createElement('i');
  addFolderIcon.className = 'bx bx-folder-plus'; // Icon for adding folder
  const addFolderSpan = document.createElement('span');
  addFolderSpan.className = 'link_name';
  addFolderSpan.textContent = 'Add Folder';

  addFolderLink.appendChild(addFolderIcon);
  addFolderLink.appendChild(addFolderSpan);
  addFolderLi.appendChild(addFolderLink);

  addFolderLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Open modal or prompt to add new folder
    addNewFolder();
  });

  navLinks.appendChild(addFolderLi);

  // Insert horizontal line
  const horizontalLine = document.createElement('hr');
  horizontalLine.style.borderTop = "1px solid #f0f0f0";
  horizontalLine.style.margin = "20px 20px"; // Add some spacing
  navLinks.appendChild(horizontalLine);

  // Function to render the folders and bookmarks
  function renderSidebar() {
    // Clear existing folders
    const existingFolders = navLinks.querySelectorAll('.folder-item');
    existingFolders.forEach(folder => folder.remove());

    // Render each folder
    sidebarData.folders.forEach((folder, folderIndex) => {
      const folderLi = document.createElement('li');
      folderLi.className = 'folder-item';

      const folderDiv = document.createElement('div');
      folderDiv.className = 'iocn-link';

      const folderLink = document.createElement('a');
      folderLink.href = '#';

      const folderIcon = document.createElement('i');
      folderIcon.className = folder.icon || 'bx bx-folder';

      const folderNameSpan = document.createElement('span');
      folderNameSpan.className = 'link_name';

      // Truncate the folder name if it exceeds 13 characters
      const folderName = folder.name.length > 13 ? `${folder.name.slice(0, 13)}...` : folder.name;
      folderNameSpan.textContent = folderName;

      folderLink.appendChild(folderIcon);
      folderLink.appendChild(folderNameSpan);

      folderDiv.appendChild(folderLink);

      // Create gear icon for editing folder
      const editIcon = document.createElement('i');
      editIcon.className = 'bx bx-cog edit-gear-icon';
      editIcon.title = "Edit Folder";

      // Add click event for editing the folder
      editIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        editFolder(folderIndex);
      });

      // Add gear icon to the container
      folderDiv.appendChild(editIcon);

      // Folder arrow
      const arrowIcon = document.createElement('i');
      arrowIcon.className = 'bx bxs-chevron-down arrow';

      // Append the arrow icon
      folderDiv.appendChild(arrowIcon);

      // Submenu for bookmarks
      const subMenu = document.createElement('ul');
      subMenu.className = 'sub-menu';

      // Add bookmarks
      folder.bookmarks.forEach((bookmark, bookmarkIndex) => {
        const bookmarkLi = document.createElement('li');
        const bookmarkLink = document.createElement('a');
        bookmarkLink.href = '#';

        bookmarkLink.textContent = bookmark.name.length > 20 ? `${bookmark.name.slice(0, 20)}...` : bookmark.name;
        bookmarkLink.addEventListener('click', (e) => {
          e.preventDefault();
          addNewFrame(bookmark.url);
          console.log(subMenu.innerHTML);
        });

        // Bookmark context menu (edit, delete)
        const bookmarkMenu = document.createElement('div');
        bookmarkMenu.className = 'bookmark-menu';

        bookmarkLi.appendChild(bookmarkLink);
        bookmarkLi.appendChild(bookmarkMenu);

        subMenu.appendChild(bookmarkLi);
      });

      folderLi.appendChild(folderDiv);
      folderLi.appendChild(subMenu);

      // Check if the folder was expanded or collapsed before and apply the state
      if (folder.isExpanded) {
        folderLi.classList.add('showMenu'); // This should expand the folder
      }
      // Event listener to toggle submenu
      arrowIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        folderLi.classList.toggle('showMenu');

        // Update the folder's state in sidebarData
        sidebarData.folders[folderIndex].isExpanded = folderLi.classList.contains('showMenu');
        saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
      });

      // Add event listener to toggle submenu visibility and open all bookmarks on folder click
      folderDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        // folderLi.classList.toggle('showMenu');

        // Open all bookmarks in new frames
        folder.bookmarks.forEach((bookmark) => {
          addNewFrame(bookmark.url);
        });
      });

      navLinks.appendChild(folderLi);
    });

    // Ensure "Add Folder" button is always the last element
    const addFolderLi = document.querySelector('.add-folder-item');
    if (addFolderLi) {
      navLinks.appendChild(addFolderLi);
    }

    adjustLayoutForSidebar();

    // Function to adjust layout based on sidebar visibility
    function adjustLayoutForSidebar() {
      if (sidebar.classList.contains('hidden')) {
        document.body.classList.add('sidebar-hidden');
      } else {
        document.body.classList.remove('sidebar-hidden');
      }
    }

    // Modify the toggle sidebar button event listener to adjust layout
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('close');
      sidebarData.isSidebarOpen = !sidebar.classList.contains('close');
      saveToStorage(SIDEBAR_DATA_KEY, sidebarData);
      adjustLayoutForSidebar(); // Adjust layout after toggling
    });
  }

  // Function to add a new folder
  function addNewFolder() {
    // Open the modal
    const modal = document.getElementById('addFolderModal');
    const closeModalBtn = document.getElementById('cleanCloseModal');
    const addFolderForm = document.getElementById('addFolderForm');
    const folderNameInput = document.getElementById('folderName');
    const iconOptions = document.querySelectorAll('.icon-option');
    let selectedIcon = 'bx bx-folder'; // Default icon

    // Clear the folder name input field
    folderNameInput.value = '';

    // Clear all selected bookmarks before adding a new folder
    const tabCheckboxes = document.querySelectorAll('.tab-checkbox');
    tabCheckboxes.forEach(checkbox => {
      checkbox.checked = false; // Uncheck all checkboxes
      const tabItem = checkbox.closest('.tab-item');
      if (tabItem) {
        tabItem.classList.remove('selected'); // Remove 'selected' class
      }
    });

    // Reset icon selection by removing 'selected' class from all icons
    iconOptions.forEach((icon) => {
      icon.classList.remove('selected');
    });

    // Ensure default icon is preselected (e.g., bx-folder)
    iconOptions.forEach((icon) => {
      if (icon.getAttribute('data-icon') === 'bx bx-folder') {
        icon.classList.add('selected');
      }
    });

    // Open modal
    modal.style.display = 'block';


    // Close modal when clicking close button or outside the modal
    closeModalBtn.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };


    // Icon selection logic
    iconOptions.forEach((icon) => {
      icon.addEventListener('click', function () {
        // Remove 'selected' class from all icons
        iconOptions.forEach((icon) => icon.classList.remove('selected'));

        // Add 'selected' class to the clicked icon
        this.classList.add('selected');

        // Set selectedIcon to the clicked icon's data-icon value
        selectedIcon = this.getAttribute('data-icon');
      });
    });

    // Populate the open and saved tabs (combined)
    const tabsContainer = document.querySelector('.tabs-container'); // Assuming the tabs container has this class
    populateTabsForSelection(tabsContainer); // Call the updated function

    // Clear previously selected bookmarks
    if (tabsContainer) {
      tabsContainer.innerHTML = ''; // Clear any previously populated tabs
    }


    // Form submission handler
    addFolderForm.onsubmit = function (e) {
      e.preventDefault(); // Prevent form from refreshing the page

      const folderName = folderNameInput.value.trim();
      if (!folderName) {
        alert('Please provide a folder name');
      }

      // Check if the folder name already exists to avoid duplicates
      const folderExists = sidebarData.folders.some(folder => folder.name === folderName);
      if (folderExists) {
        alert('A folder with this name already exists');
        return;
      }

      // Get selected tabs
      const selectedTabs = Array.from(document.querySelectorAll('.tab-checkbox:checked')).map(
        (checkbox) => checkbox.value
      );

      if (folderName && selectedTabs.length > 0) {
        // Use chrome.tabs.query to get tab information for open tabs
        chrome.tabs.query({}, function (tabs) {
          const newFolder = {
            name: folderName,
            icon: selectedIcon,
            bookmarks: selectedTabs.map((url) => {
              // Find the corresponding tab from chrome.tabs.query based on the selected tabs
              const matchingTab = tabs.find(tab => tab.url === url);

              // If no matching tab is found, skip creating a bookmark for it
              if (!matchingTab) return null;

              // Use the tab's title if found, otherwise fallback to saved title or 'Title Unavailable'
              let tabTitle = matchingTab
                ? matchingTab.title
                : getSavedTabTitle(url) || 'Title Unavailable';

              // Clean up the title by removing " - Google Sheets", " - Google Docs", and " - Google Slides"
              tabTitle = tabTitle.replace(/ - Google (Sheets|Docs|Slides)/, '');

              // Return the bookmark object
              return { name: tabTitle, url };
            })
              // Filter out null values (i.e., when no matching tab was found)
              .filter(Boolean)
          };

          // Save the selected tabs to 'savedTabs'
          // let savedTabs = loadFromLocalStorage('savedTabs') || [];

          // selectedTabs.forEach(url => {
          //   // Only add the tab to savedTabs if it’s not already there
          //   if (!savedTabs.some(tab => tab.url === url)) {
          //     const matchingTab = tabs.find(tab => tab.url === url);
          //     const tabTitle = matchingTab ? matchingTab.title : getSavedTabTitle(url) || 'Title Unavailable';
          //     savedTabs.push({ name: tabTitle, url });
          //   }
          // });

          // Push new folder to sidebarData and save to localStorage
          sidebarData.folders.push(newFolder);
          saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);

          // // Save updated savedTabs back to localStorage
          // saveToLocalStorage('savedTabs', savedTabs);

          // Re-render the sidebar
          renderSidebar();

          // Reapply event listeners for sidebar toggle after re-render
          reapplySidebarToggleListeners();

          // Close the modal
          modal.style.display = 'none';
        });
      }
    };
  }

  function editFolder(folderIndex) {
    const folder = sidebarData.folders[folderIndex];
    const modal = document.getElementById('editFolderModal');
    const closeModalBtn = document.getElementById('closeModal');
    const editFolderForm = document.getElementById('editFolderForm');
    const folderNameInput = document.getElementById('folderNameInput');
    const iconOptions = document.querySelectorAll('.icon-option');
    const bookmarkList = document.getElementById('bookmarkList');
    const tabSelectionContainer = document.getElementById('tabSelectionContainer');
    const addBookmarkToggle = document.getElementById('addBookmarkToggle');
    const searchBarContainer = document.getElementById('searchBarContainer');
    const tabSearchInput = document.getElementById('tabSearchEdit');

    // Check if folderNameInput exists
    if (!folderNameInput) {
      console.error("Error: folderNameInput not found in the DOM.");
      return;
    }

    const deleteFolderBtn = document.createElement('i');
    deleteFolderBtn.className = 'bx bx-trash'; // Trash icon

    let selectedIcon = folder.icon; // Pre-select the current icon
    let updatedBookmarks = [...folder.bookmarks]; // Clone the current bookmarks

    // Set the current folder name in the input
    folderNameInput.value = folder.name;

    // Pre-select the current icon in the modal
    iconOptions.forEach((icon) => {
      icon.classList.remove('selected');
      if (icon.getAttribute('data-icon') === folder.icon) {
        icon.classList.add('selected');
      }
    });

    // Function to delete a folder
    function deleteFolder(folderIndex, sidebarData, SIDEBAR_DATA_KEY) {
      if (confirm('Are you sure you want to delete this folder?')) {
        // Remove the folder from the sidebarData
        sidebarData.folders.splice(folderIndex, 1);

        // Save the updated sidebar data to localStorage
        saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);

        // Re-render the sidebar to reflect the changes
        renderSidebar();

        // Reapply event listeners for sidebar toggle after re-render
        reapplySidebarToggleListeners();
      }
    }

    // Function to update the bookmark list
    function updateBookmarkList(bookmarks) {
      bookmarkList.innerHTML = ''; // Clear the existing list

      bookmarks.forEach((bookmark, bookmarkIndex) => {
        const li = document.createElement('li');
        li.innerHTML = `
                <img src="https://s2.googleusercontent.com/s2/favicons?domain_url=${bookmark.url}" class="bookmark-favicon">
                <span>${bookmark.name}</span>
                <div class="bookmark-actions">
                    <i class="bx bx-pencil" data-bookmark-index="${bookmarkIndex}" title="Edit"></i>
                    <i class="bx bx-trash-alt" data-bookmark-index="${bookmarkIndex}" title="Delete"></i>
                </div>
            `;

        // Add event listeners for edit and delete
        li.querySelector('.bx-pencil').addEventListener('click', () => {
          const newName = prompt('Rename bookmark:', bookmark.name);
          if (newName) {
            bookmarks[bookmarkIndex].name = newName;
            saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
            li.querySelector('span').textContent = newName; // Update UI immediately
          }
        });

        const trashIcon = li.querySelector('.bx-trash-alt');
        trashIcon.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this bookmark?')) {
            bookmarks.splice(bookmarkIndex, 1); // Remove the bookmark
            sidebarData.folders[folderIndex].bookmarks = bookmarks;
            saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
            // Re-render the bookmark list
            updateBookmarkList(bookmarks);
            li.remove(); // Remove from UI

            // Uncheck the corresponding tab in the tabs container
            const tabsContainer = document.querySelector('.tab-selections');
            if (tabsContainer) {
              const checkboxes = tabsContainer.querySelectorAll('.tab-checkbox');
              checkboxes.forEach((checkbox) => {
                if (checkbox.value === bookmark.url) {
                  checkbox.checked = false; // Uncheck the checkbox

                  // Remove "selected" class from the tab item
                  const tabItem = checkbox.closest('.tab-item');
                  if (tabItem) {
                    tabItem.classList.remove('selected');
                  }
                }
              });
            }
          }
        });

        // Append to bookmark list
        bookmarkList.appendChild(li);
      });
    }

    // Initially populate the bookmark list with current bookmarks
    updateBookmarkList(updatedBookmarks);

    // Populate tab selection with checkbox functionality
    populateTabsForSelection(tabSelectionContainer, folder.bookmarks, updateBookmarkList);

    // Ensure the toggle works more than once by toggling the class each time it's clicked
    let isTabSelectionVisible = false;
    addBookmarkToggle.addEventListener('click', function () {
      isTabSelectionVisible = !isTabSelectionVisible;
      searchBarContainer.classList.toggle('hidden', !isTabSelectionVisible);
      tabSelectionContainer.classList.toggle('hidden', !isTabSelectionVisible);
    });

    // Search functionality to filter tabs
    tabSearchInput.addEventListener('input', function () {
      const filterText = tabSearchInput.value.toLowerCase();
      const tabItems = tabSelectionContainer.querySelectorAll('.tab-item');
      tabItems.forEach(tabItem => {
        const tabTitle = tabItem.querySelector('.tab-title').textContent.toLowerCase();
        if (tabTitle.includes(filterText)) {
          tabItem.style.display = '';
        } else {
          tabItem.style.display = 'none';
        }
      });
    });

    // Add delete button next to the close button if it exists
    if (closeModalBtn.parentNode) {
      closeModalBtn.parentNode.insertBefore(deleteFolderBtn, closeModalBtn);
    } else {
      console.error("Error: Cannot find parent node of closeModalBtn.");
    }

    // Attach event listener to delete folder
    deleteFolderBtn.addEventListener('click', function () {
      deleteFolder(folderIndex, sidebarData, SIDEBAR_DATA_KEY)
      modal.style.display = 'none';
    });

    // Reset and hide the search bar and tab selection when closing the modal
    function hideAddBookmarkSection() {
      searchBarContainer.classList.add('hidden');
      tabSelectionContainer.classList.add('hidden');
      isTabSelectionVisible = false;
    }

    // Open modal
    modal.style.display = 'block';

    // Close modal when clicking close button or outside the modal
    closeModalBtn.onclick = () => {
      modal.style.display = 'none';
      hideAddBookmarkSection(); // Hide Add Bookmark when closing modal
    };

    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
        hideAddBookmarkSection(); // Hide Add Bookmark when closing modal
      }
    };

    // Handle icon selection logic
    iconOptions.forEach((icon) => {
      icon.addEventListener('click', function () {
        // Remove 'selected' class from all icons
        iconOptions.forEach((icon) => icon.classList.remove('selected'));

        // Add 'selected' class to the clicked icon
        this.classList.add('selected');

        // Set selectedIcon to the clicked icon's data-icon value
        selectedIcon = this.getAttribute('data-icon');
      });
    });

    // Form submission handler for editing the folder
    editFolderForm.onsubmit = function (e) {
      e.preventDefault(); // Prevent form from refreshing the page

      const newFolderName = folderNameInput.value.trim();
      if (newFolderName) {
        // Update the existing folder's name, icon, and bookmarks
        folder.name = newFolderName;
        folder.icon = selectedIcon;

        // Save updated folder data to localStorage
        saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);

        // Re-render the sidebar
        renderSidebar();
        // Reapply event listeners for sidebar toggle after re-render
        reapplySidebarToggleListeners();

        // Close the modal
        modal.style.display = 'none';
        hideAddBookmarkSection(); // Hide Add Bookmark when closing modal
      }
    };
  }


  // Function to edit a bookmark
  function editBookmark(folderIndex, bookmarkIndex) {
    const bookmark = sidebarData.folders[folderIndex].bookmarks[bookmarkIndex];
    const newBookmarkName = prompt('Enter new bookmark name:', bookmark.name);
    if (newBookmarkName) {
      const newBookmarkURL = prompt('Enter new bookmark URL:', bookmark.url);
      if (newBookmarkURL) {
        bookmark.name = newBookmarkName;
        bookmark.url = newBookmarkURL;
        saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
        renderSidebar();
        // Reapply event listeners for sidebar toggle after re-render
        reapplySidebarToggleListeners();
      }
    }
  }

  function deleteBookmark(folderIndex, bookmarkIndex) {
    console.log('deleteBookmark called'); // Check if function is called

    const folder = sidebarData.folders[folderIndex];
    if (!folder || !folder.bookmarks || !folder.bookmarks.length) {
      console.error('Invalid folder or no bookmarks found');
      return;
    }

    const bookmark = folder.bookmarks[bookmarkIndex];
    console.log('Bookmark to delete:', bookmark); // Log the bookmark details

    if (confirm('Are you sure you want to delete this bookmark?')) {
      // Splice the bookmark from the list
      folder.bookmarks.splice(bookmarkIndex, 1);

      // Save the updated data to localStorage
      saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);

      // Re-render the sidebar
      console.log("Rendering sidebar after bookmark deletion");
      renderSidebar();

      // Uncheck the checkbox in the tabs container
      const tabsContainer = document.querySelector('.tabs-container'); // Ensure the class is correct
      if (tabsContainer) {
        console.log("Tabs container found. Attempting to uncheck checkboxes.");
        const checkboxes = tabsContainer.querySelectorAll('.tab-checkbox');
        let bookmarkFound = false;

        checkboxes.forEach((checkbox) => {
          console.log(`Checking checkbox with value: ${checkbox.value}`);
          if (checkbox.value === bookmark.url) {
            console.log(`Match found. Unchecking checkbox for bookmark URL: ${bookmark.url}`);

            // Uncheck the checkbox
            checkbox.checked = false;

            // Remove "selected" class from the tab item
            const tabItem = checkbox.closest('.tab-item');
            if (tabItem) {
              tabItem.classList.remove('selected');
            }

            bookmarkFound = true;
          }
        });

        if (!bookmarkFound) {
          console.warn(`Bookmark URL not found in tabs container: ${bookmark.url}`);
        }
      } else {
        console.error('Tabs container not found in DOM.');
      }

      // Reapply sidebar toggle functionality
      reapplySidebarToggleListeners();
    }
  }

  // Append elements to sidebar
  sidebar.appendChild(logoDetails);
  sidebar.appendChild(navLinks);

  // Create profile details if needed
  const profileDetails = document.createElement('li');
  const profileDiv = document.createElement('div');
  profileDiv.className = 'profile-details';

  const profileContent = document.createElement('div');
  profileContent.className = 'profile-content';

  const profileImg = document.createElement('img');
  profileImg.src = 'https://i.imgur.com/zF3mJaB.png';
  profileImg.alt = 'profileImg';

  profileContent.appendChild(profileImg);

  const nameJobDiv = document.createElement('div');
  nameJobDiv.className = 'name-job';

  const profileName = document.createElement('div');
  profileName.className = 'profile_name';
  profileName.textContent = 'Google SplitView';

  const job = document.createElement('div');
  job.className = 'job';

  nameJobDiv.appendChild(profileName);
  nameJobDiv.appendChild(job);

  const logoutIcon = document.createElement('i');

  profileDiv.appendChild(profileContent);
  profileDiv.appendChild(nameJobDiv);
  profileDiv.appendChild(logoutIcon);

  profileDetails.appendChild(profileDiv);
  sidebar.appendChild(profileDetails);

  document.body.insertBefore(sidebar, document.body.firstChild);

  // Sidebar toggle button listener
  const sidebarToggleBtn = document.querySelector(".bx-menu");
  sidebarToggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("close");
  });

  // Adjust modal position on sidebar transition end
  sidebar.addEventListener('transitionend', (event) => {
    console.log('Transition event triggered for property:', event.propertyName); // Debugging line
    const modal = document.getElementById('modal'); // Access modal directly here
    if (modal && modal.style.display === 'block') {
      console.log('Adjusting modal position'); // Debugging line
      adjustModalPosition(modal, getActiveContainerFrame());
    }
  });

  // Initial render of the sidebar
  renderSidebar();


  // Adjust layout based on sidebar visibility
  adjustLayoutForSidebar(sidebar);

  // Function to toggle frames orientation
  function toggleFramesOrientation() {
    // Get the iframe container
    const iframeContainer = document.getElementById('iframeContainer');
    if (iframeContainer) {
      // Check current orientation
      const isVertical = iframeContainer.style.flexDirection === 'column';
      // Toggle orientation
      iframeContainer.style.flexDirection = isVertical ? 'row' : 'column';

      // After changing the flex direction, update the dividers
      updateDividers(iframeContainer);

      // Update iframe proportions based on the new orientation
      updateIframeProportions(iframeContainer);
    }
  }

  // Users can expand and shrink the sidebar (already implemented with the toggle button)

  // Implement hover to show bookmarks
  // This can be achieved with CSS :hover or by adding event listeners
  // We need to adjust the CSS to show the subMenu on hover

  // Also, ensure that bookmarks open in a new iframe
  // This is already handled in the addNewFrame function

};

// Function to initialize sidebar navigation, attaching event listeners to sidebar elements
export const setupSidebarNavigation = () => {
  // The event listeners are already set up during the creation of elements
};

function populateTabsForSelection(tabsContainer, existingBookmarks = [], updateBookmarkList) {
  tabsContainer.innerHTML = ''; // Clear previous content

  let allTabs = [];

  // Fetch open tabs using Chrome API, if available
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({}, function (tabs) {
      // Filter Google Docs/Sheets/Slides tabs
      const openTabs = tabs.filter((tab) => /https:\/\/docs\.google\.com/.test(tab.url));
      allTabs = allTabs.concat(openTabs);

      // Fetch saved tabs from localStorage
      const savedTabs = getSavedTabs();
      allTabs = allTabs.concat(savedTabs);

      // Deduplicate tabs by URL
      const uniqueTabs = deduplicateTabsByURL(allTabs);

      // Render the deduplicated tabs in the container
      renderTabsInContainer(uniqueTabs, tabsContainer, existingBookmarks, updateBookmarkList);
    });
  } else {
    // If Chrome API is not available, just fetch saved tabs
    const savedTabs = getSavedTabs();

    // Deduplicate saved tabs
    const uniqueSavedTabs = deduplicateTabsByURL(savedTabs);

    // Render the saved tabs in the container
    renderTabsInContainer(uniqueSavedTabs, tabsContainer, existingBookmarks, updateBookmarkList);
  }
}

// Helper function to deduplicate tabs by URL
function deduplicateTabsByURL(tabs) {
  return tabs.reduce((acc, current) => {
    const found = acc.find(tab => tab.url === current.url);
    if (!found) acc.push(current);
    return acc;
  }, []);
}


// Helper function to render the tabs in the container
function renderTabsInContainer(tabs, container, existingBookmarks, updateBookmarkList) {
  container.innerHTML = ''; // Clear previous content

  // Render all tabs initially
  const tabElements = tabs.map((tab) => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';

    // Add checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-checkbox';
    checkbox.value = tab.url;

    // Check if the tab is already bookmarked
    if (existingBookmarks.some((bookmark) => bookmark.url === tab.url)) {
      checkbox.checked = true;
    }

    // Handle the selected state
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        tabItem.classList.add('selected');

        // Check if the bookmark already exists before adding
        const exists = existingBookmarks.some(bookmark => bookmark.url === tab.url);

        if (!exists) {
          const cleanedTitle = tab.title
            .replace(' - Google Sheets', '')
            .replace(' - Google Docs', '')
            .replace(' - Google Slides', '');
          existingBookmarks.push({ name: cleanedTitle, url: tab.url });
        }
      } else {
        tabItem.classList.remove('selected');

        // Remove this tab from the bookmarks list
        const indexToRemove = existingBookmarks.findIndex(bookmark => bookmark.url === tab.url);
        if (indexToRemove !== -1) {
          existingBookmarks.splice(indexToRemove, 1);
        }
      }

      // Update the bookmark list in real-time
      updateBookmarkList(existingBookmarks);
    });

    // Add favicon
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = `https://s2.googleusercontent.com/s2/favicons?domain_url=${tab.url}`;
    favicon.alt = 'Tab Favicon';

    // Add title
    const titleSpan = document.createElement('span');
    titleSpan.textContent = tab.title.replace(/( - Google (Sheets|Docs|Slides))/g, ''); // Clean up title
    titleSpan.className = 'tab-title';

    // Append elements to tabItem
    tabItem.appendChild(checkbox);
    tabItem.appendChild(favicon);
    tabItem.appendChild(titleSpan);

    return tabItem;
  });

  // Append all tabs initially
  tabElements.forEach(tabElement => container.appendChild(tabElement));

  // Add search functionality
  const searchInput = document.getElementById('tabSearch');
  searchInput.addEventListener('input', function () {
    const filterText = searchInput.value.toLowerCase();

    tabElements.forEach(tabElement => {
      const title = tabElement.querySelector('.tab-title').textContent.toLowerCase();
      if (title.includes(filterText)) {
        tabElement.style.display = '';
      } else {
        tabElement.style.display = 'none';
      }
    });
  });
}

// Ensure getSavedTabs function works properly
function getSavedTabs() {
  return JSON.parse(localStorage.getItem('savedTabs')) || [];
}

function reapplySidebarToggleListeners() {
  const toggleSidebarBtn = document.querySelector('.bx-menu');

  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.toggle('close');
      sidebarData.isSidebarOpen = !sidebar.classList.contains('close');
      saveToLocalStorage(SIDEBAR_DATA_KEY, sidebarData);
      adjustLayoutForSidebar(sidebar);
    });
  }
}