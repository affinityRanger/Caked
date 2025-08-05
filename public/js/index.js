// State management
let petalInterval;
let isPaused = false;
let isNavigating = false;
let animationFrameId = null;

// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function createPetal(side) {
  if (isPaused || isNavigating || !side) return;
  
  const petal = document.createElement('div');
  petal.classList.add('petal');
  petal.style.left = Math.random() * 100 + '%';
  petal.style.animationDelay = Math.random() * 2 + 's';
  petal.style.animationDuration = (Math.random() * 4 + 6) + 's';
  
  side.appendChild(petal);
  
  // Clean up petal after animation
  setTimeout(() => {
    if (petal && petal.parentNode) {
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
  const leftSide = document.querySelector('.left-side');
  
  if (!leftSide) return;
  
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
      
      leftSide.appendChild(sparkle);
      setTimeout(() => {
        if (sparkle && sparkle.parentNode) {
          sparkle.remove();
        }
      }, 1200);
    }, i * 60);
  }
}

function createBreakingHeartTransition() {
  const darkEmojis = ['💔', '🖤', '⚫', '💀', '🥀', '⛈️'];
  const rightSide = document.querySelector('.right-side');
  
  if (!rightSide) return;
  
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
      
      rightSide.appendChild(piece);
      setTimeout(() => {
        if (piece && piece.parentNode) {
          piece.remove();
        }
      }, 1500);
    }, i * 50);
  }
}

// Navigation functions with better error handling
function navigateToGarden() {
  if (isNavigating) return;
  isNavigating = true;
  
  const leftSide = document.querySelector('.left-side');
  if (leftSide) {
    leftSide.classList.add('clicking');
  }
  
  createSparkleTransition();
  
  setTimeout(() => {
    try {
      // Stop petal animations
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Navigate with fallback options
      const urls = ['/hope', '/hope.html', `${BACKEND_URL}/hope`];
      
      for (const url of urls) {
        try {
          window.location.href = url;
          return;
        } catch (error) {
          console.warn(`Navigation attempt failed for ${url}:`, error);
          continue;
        }
      }
      
      // If all else fails, use location.assign
      window.location.assign(`${window.location.origin}/hope`);
      
    } catch (error) {
      console.error('All navigation attempts failed:', error);
      isNavigating = false;
      if (leftSide) {
        leftSide.classList.remove('clicking');
      }
    }
  }, 1200);
}

function navigateToDoubt() {
  if (isNavigating) return;
  isNavigating = true;
  
  const rightSide = document.querySelector('.right-side');
  if (rightSide) {
    rightSide.classList.add('clicking');
  }
  
  createBreakingHeartTransition();
  
  setTimeout(() => {
    try {
      // Stop petal animations
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Navigate with fallback options
      const urls = ['/doubt', '/doubt.html', `${BACKEND_URL}/doubt`];
      
      for (const url of urls) {
        try {
          window.location.href = url;
          return;
        } catch (error) {
          console.warn(`Navigation attempt failed for ${url}:`, error);
          continue;
        }
      }
      
      // If all else fails, use location.assign
      window.location.assign(`${window.location.origin}/doubt`);
      
    } catch (error) {
      console.error('All navigation attempts failed:', error);
      isNavigating = false;
      if (rightSide) {
        rightSide.classList.remove('clicking');
      }
    }
  }, 1500);
}

// File Manager Functions
function toggleFileManager() {
  const fileManager = document.getElementById('file-manager-container');
  
  if (!fileManager) return;
  
  if (fileManager.style.display === 'flex') {
    fileManager.style.display = 'none';
  } else {
    fileManager.style.display = 'flex';
    loadFileStructure();
  }
}

function loadFileStructure() {
  const fileManager = document.getElementById('file-manager');
  
  if (!fileManager) return;
  
  // Show loading message
  fileManager.innerHTML = '<div class="loading">Loading files...</div>';
  
  // Fetch file structure from backend API
  fetch(`${BACKEND_URL}/api/files`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      fileManager.innerHTML = '';
      displayFileStructure(data, fileManager);
    })
    .catch(error => {
      console.error('Error fetching file structure:', error);
      fileManager.innerHTML = `<div class="error">Error loading files: ${error.message}</div>`;
    });
}

function displayFileStructure(items, container) {
  if (!items || !container) return;
  
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
    name.textContent = item.name || 'Unknown';
    
    // Create file size element (for files)
    const size = document.createElement('span');
    if (item.type === 'file' && item.size !== undefined) {
      size.className = 'file-size';
      size.textContent = formatFileSize(item.size);
    }
    
    // Add elements to list item
    li.appendChild(icon);
    li.appendChild(name);
    if (item.type === 'file' && item.size !== undefined) {
      li.appendChild(size);
    }
    
    // Add click event for files
    if (item.type === 'file' && item.path) {
      li.addEventListener('click', function(e) {
        e.stopPropagation();
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
          icon.textContent = '📂';
        } else {
          childContainer.style.display = 'none';
          icon.textContent = '📁';
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
    'html': '🌐', 'css': '🎨', 'js': '📜', 'json': '📋', 'md': '📝', 'txt': '📄',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
    'mp4': '🎬', 'mp3': '🎵', 'wav': '🎵', 'pdf': '📕', 'zip': '📦', 'rar': '📦'
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

// Enhanced touch and click handling
function addInteractionSupport() {
  const leftSide = document.getElementById('hopeSection');
  const rightSide = document.getElementById('doubtSection');
  const questionMark = document.querySelector('.question-mark');
  const closeBtn = document.querySelector('.close-btn');
  
  // Debounced navigation functions to prevent multiple calls
  const debouncedNavigateToGarden = debounce(navigateToGarden, 300);
  const debouncedNavigateToDoubt = debounce(navigateToDoubt, 300);
  
  // Left side interactions
  if (leftSide) {
    // Mouse events
    leftSide.addEventListener('mouseenter', pausePetals);
    leftSide.addEventListener('mouseleave', resumePetals);
    leftSide.addEventListener('click', debouncedNavigateToGarden);
    
    // Touch events for mobile
    leftSide.addEventListener('touchstart', function(e) {
      e.preventDefault();
      this.classList.add('touching');
      pausePetals();
    }, { passive: false });
    
    leftSide.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.classList.remove('touching');
      debouncedNavigateToGarden();
    }, { passive: false });
    
    leftSide.addEventListener('touchcancel', function(e) {
      this.classList.remove('touching');
      resumePetals();
    });
  }
  
  // Right side interactions
  if (rightSide) {
    // Mouse events
    rightSide.addEventListener('mouseenter', pausePetals);
    rightSide.addEventListener('mouseleave', resumePetals);
    rightSide.addEventListener('click', debouncedNavigateToDoubt);
    
    // Touch events for mobile
    rightSide.addEventListener('touchstart', function(e) {
      e.preventDefault();
      this.classList.add('touching');
      pausePetals();
    }, { passive: false });
    
    rightSide.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.classList.remove('touching');
      debouncedNavigateToDoubt();
    }, { passive: false });
    
    rightSide.addEventListener('touchcancel', function(e) {
      this.classList.remove('touching');
      resumePetals();
    });
  }
  
  // Question mark for file manager
  if (questionMark) {
    questionMark.addEventListener('click', toggleFileManager);
    questionMark.addEventListener('touchend', function(e) {
      e.preventDefault();
      toggleFileManager();
    });
  }
  
  // Close button for file manager
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleFileManager);
    closeBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      toggleFileManager();
    });
  }
}

// Optimized petal animation system
function initPetalAnimation() {
  const leftSide = document.querySelector('.left-side');
  const rightSide = document.querySelector('.right-side');
  
  if (!leftSide || !rightSide) return;
  
  let lastPetalTime = 0;
  const petalInterval = 1200; // ms between petals
  
  function createPetalsLoop(timestamp) {
    if (isNavigating) return;
    
    if (timestamp - lastPetalTime >= petalInterval) {
      createPetal(leftSide);
      createPetal(rightSide);
      lastPetalTime = timestamp;
    }
    
    animationFrameId = requestAnimationFrame(createPetalsLoop);
  }
  
  // Start the animation loop
  animationFrameId = requestAnimationFrame(createPetalsLoop);
  
  // Add some initial petals with staggered timing
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createPetal(leftSide);
        createPetal(rightSide);
      }, i * 200);
    }
  }, 1000);
}

// Mobile optimization and prevention of default behaviors
function initMobileOptimizations() {
  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // Prevent multi-touch gestures
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent context menu on long press
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });
  
  // Handle orientation changes
  window.addEventListener('orientationchange', function() {
    setTimeout(() => {
      // Force a repaint after orientation change
      document.body.style.height = window.innerHeight + 'px';
      setTimeout(() => {
        document.body.style.height = '100vh';
      }, 100);
    }, 100);
  });
}

// Network status handling
function initNetworkHandling() {
  window.addEventListener('online', function() {
    console.log('Connection restored');
  });
  
  window.addEventListener('offline', function() {
    console.log('Connection lost');
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
  // Reset navigation state on page load
  isNavigating = false;
  isPaused = false;
  
  // Initialize all components
  addInteractionSupport();
  initPetalAnimation();
  initMobileOptimizations();
  initNetworkHandling();
  
  // Preload next pages for better performance
  const linkPreloads1 = document.createElement('link');
  linkPreloads1.rel = 'prefetch';
  linkPreloads1.href = '/hope';
  document.head.appendChild(linkPreloads1);
  
  const linkPreloads2 = document.createElement('link');
  linkPreloads2.rel = 'prefetch';
  linkPreloads2.href = '/doubt';
  document.head.appendChild(linkPreloads2);
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});