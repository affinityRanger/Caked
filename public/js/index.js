let petalInterval;
let isPaused = false;
let isNavigating = false;

// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

function createPetal(side) {
  if (isPaused || isNavigating) return;
  
  const petal = document.createElement('div');
  petal.classList.add('petal');
  petal.style.left = Math.random() * 100 + '%';
  petal.style.animationDelay = Math.random() * 2 + 's';
  petal.style.animationDuration = (Math.random() * 4 + 6) + 's';
  side.appendChild(petal);
  setTimeout(() => {
    if (petal.parentNode) {
      petal.remove();
    }
  }, 10000);
}

function pausePetals() {
  isPaused = true;
}

function resumePetals() {
  isPaused = false;
}

function createSparkleTransition() {
  const sparkleEmojis = ['✨', '⭐', '💘', '💜', '💖'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
      sparkle.style.position = 'absolute';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
      sparkle.style.zIndex = '10';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.animation = 'sparkleFloat 1.2s ease-out forwards';
      document.querySelector('.left-side').appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1200);
    }, i * 60);
  }
}

function createBreakingHeartTransition() {
  const darkEmojis = ['💔', '🖤', '⚫', '💀', '🥀', '⛈️'];
  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.innerHTML = darkEmojis[Math.floor(Math.random() * darkEmojis.length)];
      piece.style.position = 'absolute';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = Math.random() * 100 + '%';
      piece.style.fontSize = (Math.random() * 1 + 1.2) + 'rem';
      piece.style.zIndex = '10';
      piece.style.pointerEvents = 'none';
      piece.style.animation = 'breakingFall 1.5s ease-in forwards';
      document.querySelector('.right-side').appendChild(piece);
      setTimeout(() => piece.remove(), 1500);
    }, i * 50);
  }
}

// FIXED NAVIGATION FUNCTIONS with fallback and error handling
function navigateToGarden() {
  if (isNavigating) return;
  isNavigating = true;
  
  const leftSide = document.querySelector('.left-side');
  leftSide.classList.add('clicking');
  createSparkleTransition();
  
  setTimeout(() => {
    try {
      // First try: Direct navigation
      window.location.href = './hope.html';
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback: Try different path
      try {
        window.location.href = 'hope.html';
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        // Last resort: Use location.assign
        window.location.assign('hope.html');
      }
    }
  }, 1200);
}

function navigateToDoubt() {
  if (isNavigating) return;
  isNavigating = true;
  
  const rightSide = document.querySelector('.right-side');
  rightSide.classList.add('clicking');
  createBreakingHeartTransition();
  
  setTimeout(() => {
    try {
      // First try: Direct navigation
      window.location.href = './doubt.html';
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback: Try different path
      try {
        window.location.href = 'doubt.html';
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        // Last resort: Use location.assign
        window.location.assign('doubt.html');
      }
    }
  }, 1500);
}

// File Manager Functions
function toggleFileManager() {
  const fileManager = document.getElementById('file-manager-container');
  
  if (fileManager.style.display === 'flex') {
    fileManager.style.display = 'none';
  } else {
    fileManager.style.display = 'flex';
    loadFileStructure();
  }
}

function loadFileStructure() {
  const fileManager = document.getElementById('file-manager');
  
  // Show loading message
  fileManager.innerHTML = '<div class="loading">Loading files...</div>';
  
  // Fetch file structure from backend API
  fetch(`${BACKEND_URL}/api/files`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Clear loading message
      fileManager.innerHTML = '';
      
      // Display file structure
      displayFileStructure(data, fileManager);
    })
    .catch(error => {
      console.error('Error fetching file structure:', error);
      fileManager.innerHTML = `<div class="error">Error loading files: ${error.message}</div>`;
    });
}

function displayFileStructure(items, container) {
  const ul = document.createElement('ul');
  ul.className = 'file-tree';
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `file-item ${item.type}`;
    
    // Create file/folder icon
    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.textContent = item.type === 'folder' ? '📁' : getFileIcon(item.extension);
    
    // Create name element
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = item.name;
    
    // Create file size element (for files)
    const size = document.createElement('span');
    if (item.type === 'file') {
      size.className = 'file-size';
      size.textContent = formatFileSize(item.size);
    }
    
    // Add elements to list item
    li.appendChild(icon);
    li.appendChild(name);
    if (item.type === 'file') {
      li.appendChild(size);
    }
    
    // Add click event for files
    if (item.type === 'file') {
      li.addEventListener('click', function() {
        window.open(`${BACKEND_URL}/${item.path}`, '_blank');
      });
    }
    
    // Add folder contents if it's a folder
    if (item.type === 'folder' && item.children && item.children.length > 0) {
      const childContainer = document.createElement('div');
      childContainer.className = 'folder-children';
      childContainer.style.display = 'none';
      
      displayFileStructure(item.children, childContainer);
      
      // Toggle folder open/close
      li.addEventListener('click', function(e) {
        e.stopPropagation();
        if (childContainer.style.display === 'none') {
          childContainer.style.display = 'block';
          icon.textContent = '📂'; // Open folder icon
        } else {
          childContainer.style.display = 'none';
          icon.textContent = '📁'; // Closed folder icon
        }
      });
      
      li.appendChild(childContainer);
    }
    
    ul.appendChild(li);
  });
  
  container.appendChild(ul);
}

function getFileIcon(extension) {
  if (!extension) return '📄';
  
  const iconMap = {
    'html': '🌐',
    'css': '🎨',
    'js': '📜',
    'json': '📋',
    'md': '📝',
    'txt': '📄',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'mp4': '🎬',
    'mp3': '🎵',
    'wav': '🎵',
    'pdf': '📕',
    'zip': '📦',
    'rar': '📦'
  };
  
  return iconMap[extension.toLowerCase()] || '📄';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enhanced mobile and desktop support
function addTouchSupport() {
  const leftSide = document.getElementById('hopeSection');
  const rightSide = document.getElementById('doubtSection');
  
  // Touch support for mobile devices
  if (leftSide) {
    leftSide.addEventListener('touchstart', function(e) {
      e.preventDefault();
      this.classList.add('touching');
    }, { passive: false });
    
    leftSide.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.classList.remove('touching');
      navigateToGarden();
    }, { passive: false });
    
    leftSide.addEventListener('touchcancel', function(e) {
      this.classList.remove('touching');
    });
  }
  
  if (rightSide) {
    rightSide.addEventListener('touchstart', function(e) {
      e.preventDefault();
      this.classList.add('touching');
    }, { passive: false });
    
    rightSide.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.classList.remove('touching');
      navigateToDoubt();
    }, { passive: false });
    
    rightSide.addEventListener('touchcancel', function(e) {
      this.classList.remove('touching');
    });
  }
}

// Initialize petal animation and performance optimizations
document.addEventListener('DOMContentLoaded', function() {
  const leftSide = document.querySelector('.left-side');
  const rightSide = document.querySelector('.right-side');
  
  // Add touch support for mobile
  addTouchSupport();
  
  // Performance: Use requestAnimationFrame for smoother animations
  let lastPetalTime = 0;
  const petalInterval = 1200; // ms between petals
  
  function createPetalsLoop(timestamp) {
    if (timestamp - lastPetalTime >= petalInterval && !isNavigating) {
      createPetal(leftSide);
      createPetal(rightSide);
      lastPetalTime = timestamp;
    }
    if (!isNavigating) {
      requestAnimationFrame(createPetalsLoop);
    }
  }
  
  // Start the petal animation loop
  requestAnimationFrame(createPetalsLoop);
  
  // Add some initial petals with staggered timing
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createPetal(leftSide);
        createPetal(rightSide);
      }, i * 200);
    }
  }, 1000);
  
  // Add click event to question mark for file manager
  const questionMark = document.querySelector('.question-mark');
  if (questionMark) {
    questionMark.addEventListener('click', toggleFileManager);
  }
  
  // Performance: Use passive event listeners for better scroll performance
  if (leftSide) {
    leftSide.addEventListener('mouseenter', pausePetals, { passive: true });
    leftSide.addEventListener('mouseleave', resumePetals, { passive: true });
    // Click event for desktop
    leftSide.addEventListener('click', navigateToGarden);
  }
  
  if (rightSide) {
    rightSide.addEventListener('mouseenter', pausePetals, { passive: true });
    rightSide.addEventListener('mouseleave', resumePetals, { passive: true });
    // Click event for desktop
    rightSide.addEventListener('click', navigateToDoubt);
  }
  
  // Performance: Preload next pages
  const linkPreloads = document.createElement('link');
  linkPreloads.rel = 'prefetch';
  linkPreloads.href = 'hope';
  document.head.appendChild(linkPreloads);
  
  const linkPreloads2 = document.createElement('link');
  linkPreloads2.rel = 'prefetch';
  linkPreloads2.href = 'doubt';
  document.head.appendChild(linkPreloads2);
  
  // Mobile optimization: Prevent zoom on double tap
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // Enhanced error handling for network issues
  window.addEventListener('online', function() {
    console.log('Connection restored');
  });
  
  window.addEventListener('offline', function() {
    console.log('Connection lost');
  });
});