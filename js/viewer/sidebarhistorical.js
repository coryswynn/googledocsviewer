//sidebar.js

// Import necessary functionality from modalManager.js for integrating with the rest of the application
import { addNewFrame, adjustModalPosition } from './modalManager.js';
import { getActiveContainerFrame } from './init.js';

document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar close';
    sidebar.id = 'sidebar';
  
    const logoDetails = `
      <div class="logo-details">
        <i class='bx bx-menu'></i>
        <span class="logo_name">Workspace</span>
      </div>
    `;
  
    const navLinks = document.createElement('ul');
    navLinks.className = 'nav-links';
  
    const linksData = [
      { icon: 'bx bx-grid-alt', name: 'Dashboard', subMenu: [{ name: 'Dashboard' }] },
      { icon: 'bx bx-folder', name: 'Personal', arrow: true, subMenu: [{ name: 'HedgeHopper', link: '#HedgeHopper' }, { name: 'Shops List', link: '#Shops-List' }, { name: 'Zoom Walkthrough', link: '#Zoom' }, { name: 'PHP & MySQL' }] },
      { icon: 'bx bx-book-alt', name: 'Posts', arrow: true, subMenu: [{ name: 'Posts' }, { name: 'Web Design' }, { name: 'Login Form' }, { name: 'Card Design' }] },
      { icon: 'bx bx-pie-chart-alt-2', name: 'Analytics', subMenu: [{ name: 'Analytics' }] },
      { icon: 'bx bx-line-chart', name: 'Chart', subMenu: [{ name: 'Chart' }] },
      { icon: 'bx bx-plug', name: 'Plugins', arrow: true, subMenu: [{ name: 'Plugins' }, { name: 'UI Face' }, { name: 'Pigments' }, { name: 'Box Icons' }] },
      { icon: 'bx bx-compass', name: 'Explore', subMenu: [{ name: 'Explore' }] },
      { icon: 'bx bx-history', name: 'History', subMenu: [{ name: 'History' }] },
      { icon: 'bx bx-cog', name: 'Setting', subMenu: [{ name: 'Setting' }] },
    ];
  
    const profileDetails = `
      <li>
        <div class="profile-details">
          <div class="profile-content">
            <img src="https://i.imgur.com/7mX8Cpy.png" alt="profileImg">
          </div>
          <div class="name-job">
            <div class="profile_name">Cory Wynn</div>
            <div class="job"></div>
          </div>
          <i class='bx bx-log-out'></i>
        </div>
      </li>
    `;
  
    linksData.forEach(link => {
      const li = document.createElement('li');
      if (link.arrow) {
        li.innerHTML = `
          <div class="iocn-link">
            <a href="#">
              <i class='${link.icon}'></i>
              <span class="link_name">${link.name}</span>
            </a>
            <i class='bx bxs-chevron-down arrow'></i>
          </div>
        `;
        const subMenu = document.createElement('ul');
        subMenu.className = 'sub-menu';
        link.subMenu.forEach(sub => {
          subMenu.innerHTML += `<li><a href="${sub.link || '#'}">${sub.name}</a></li>`;
        });
        li.appendChild(subMenu);
      } else {
        li.innerHTML = `
          <a href="#">
            <i class='${link.icon}'></i>
            <span class="link_name">${link.name}</span>
          </a>
        `;
        const subMenu = document.createElement('ul');
        subMenu.className = 'sub-menu blank';
        subMenu.innerHTML = `<li><a class="link_name" href="#">${link.name}</a></li>`;
        li.appendChild(subMenu);
      }
      navLinks.appendChild(li);
    });
  
    sidebar.innerHTML = logoDetails;
    sidebar.appendChild(navLinks);
    sidebar.innerHTML += profileDetails;
  
    document.body.insertBefore(sidebar, document.body.firstChild);

    // Add event listeners for toggle and submenu here as needed
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

    let arrow = document.querySelectorAll(".arrow");
    for (var i = 0; i < arrow.length; i++) {
      arrow[i].addEventListener("click", (e) => {
        let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
        arrowParent.classList.toggle("showMenu");
      });
    }
  
});
  
  // Function to initialize sidebar navigation, attaching event listeners to sidebar elements
export const setupSidebarNavigation = () => {
    // Attach click event listeners to sidebar links for navigation
    const sidebarLinks = document.querySelectorAll('.nav-links li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent the default link behavior

            // Here, instead of navigating, you might load content dynamically
            // For demonstration, logging the href attribute
            if (link.getAttribute('href') === '#Shops-List') {
                const newTabURL = 'https://docs.google.com/spreadsheets/d/1MtwFy8yfc1FAc3vQN6n3clrkzvMj5oLlLw3gcSDJPqM/edit#gid=1407322578';
                addNewFrame(newTabURL);
            } else if (link.getAttribute('href') === '#Zoom'){
                const newTabURL = 'https://docs.google.com/document/d/13-bigd4_QLNrsoBkM4GeyDuvJO8vbvyGsVTproffKzI/edit#heading=h.vb363ualqtdn';
                addNewFrame(newTabURL);
            } else if (link.getAttribute('href') === '#HedgeHopper'){
                const newTabURL = 'https://docs.google.com/spreadsheets/d/0By4y2v3QrYJzM0VlT1hEaDF0aVk/edit?resourcekey=0-j1MB5nXVHndmiVY8Y5gI8A#gid=336275015';
                addNewFrame(newTabURL);
            }
            // If you had a specific action for a link, you could check the link's href and act accordingly
            // Example: if (link.getAttribute('href') === 'specificURL') { /* Perform a specific action */ }
        });
        
    });

    // Optionally, if your sidebar has elements for adding new tabs, set up listeners on those as well
    // This example assumes there's a specific link or button in your sidebar dedicated to adding a new tab
    const addNewTabButton = document.querySelector('.add-new-tab-btn');
    if (addNewTabButton) {
        addNewTabButton.addEventListener('click', () => {
            // URL for the new tab, adjust as needed
            const newTabURL = 'http://example.com';
            addNewFrame(newTabURL);
        });
    }
};