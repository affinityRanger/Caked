// JavaScript code for the Roses Gallery - OPTIMIZED WITH SMOOTH IMAGE ANIMATIONS
const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "PARTYNEXTDOOR - Dreamin.mp3";
let exclamationPopupVisible = false;
let isNavigating = false;
let photoModalOpen = false;
let isImageTransitioning = false;

// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// CORRECTED: Song playlist array with proper file names
const playlist = [
  'PARTYNEXTDOOR - Dreamin.mp3',
  'Kiss - I Was Made For Lovin You.mp3',
  'PARTYNEXTDOOR - DEEPER.mp3', 
  'PARTYNEXTDOOR - TRAUMA .mp3',
  'Juice WRLD - GRACE.mp3',
  'PARTYNEXTDOOR - Some Of Your Love.mp3',
  'KEEP IT-Juice WRLD.mp3',
  'Lovers Lane - JuiceWrld.mp3',
  'PARTYNEXTDOOR - You ve Been Missed.mp3',
  'PARTYNEXTDOOR & Rihanna - BELIEVE IT.mp3'
];
let currentSongIndex = 0;

// Performance optimization: Cache DOM elements
const cachedElements = {};
function getElement(id) {
  if (!cachedElements[id]) {
    cachedElements[id] = document.getElementById(id);
  }
  return cachedElements[id];
}

// CORRECTED: Display names to match actual files
function getSongDisplayName(songFile) {
  const songNames = {
    'PARTYNEXTDOOR - Dreamin.mp3': 'Dreamin\' - PARTYNEXTDOOR',
    'Kiss - I Was Made For Lovin You.mp3': 'Kiss - I Was Made For Lovin\' You',
    'PARTYNEXTDOOR - DEEPER.mp3': 'DEEPER - PARTYNEXTDOOR',
    'PARTYNEXTDOOR - TRAUMA .mp3': 'TRAUMA - PARTYNEXTDOOR',
    'Juice WRLD - GRACE.mp3': 'GRACE - Juice WRLD',
    'PARTYNEXTDOOR - Some Of Your Love.mp3': 'Some Of Your Love - PARTYNEXTDOOR',
    'KEEP IT-Juice WRLD.mp3': 'KEEP IT - Juice WRLD',
    'Lovers Lane - JuiceWrld.mp3': 'Lovers Lane - Juice WRLD',
    'PARTYNEXTDOOR - You ve Been Missed.mp3': 'You\'ve Been Missed - PARTYNEXTDOOR',
    'PARTYNEXTDOOR & Rihanna - BELIEVE IT.mp3': 'BELIEVE IT - PARTYNEXTDOOR & Rihanna'
  };
  return songNames[songFile] || songFile.replace('.mp3', '');
}

// Initialize audio on page load - WITH AUTO-PLAY RESTORED
window.addEventListener('load', function() {
  globalAudio.volume = 0.4;
  globalAudio.loop = false;
  
  // Faster loading - reduced delays but AUTO-PLAY RESTORED
  setTimeout(() => {
    const loadingScreen = getElement('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        initializeBackground();
        startAutoPlay();
      }, 500);
    }
  }, 1000);
});

// AUTO-PLAY function RESTORED
function startAutoPlay() {
  globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
  globalAudio.play().then(() => {
    musicButton.classList.add('playing');
    const playBtn = getElement('globalPlayBtn');
    const nowPlaying = getElement('globalNowPlaying');
    if (playBtn) playBtn.textContent = '⏸️';
    if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
    updateSelectDropdown();
  }).catch(() => {
    const nowPlaying = getElement('globalNowPlaying');
    if (nowPlaying) nowPlaying.textContent = 'Click play to start music';
  });
}

// Update select dropdown
function updateSelectDropdown() {
  const select = getElement('globalMusicSelect');
  if (select && playlist.includes(currentSong)) {
    select.value = currentSong;
  }
}

// Simplified play next song
function playNextSong() {
  currentSongIndex = (currentSongIndex + 1) % playlist.length;
  currentSong = playlist[currentSongIndex];
  
  globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
  globalAudio.volume = 0.4;
  
  updateSelectDropdown();
  
  globalAudio.play().then(() => {
    const nowPlaying = getElement('globalNowPlaying');
    if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
    musicButton.classList.add('playing');
    const playBtn = getElement('globalPlayBtn');
    if (playBtn) playBtn.textContent = '⏸️';
  }).catch(() => {
    if (currentSongIndex < playlist.length - 1) {
      setTimeout(() => playNextSong(), 500);
    }
  });
}

// Simplified play previous song
function playPreviousSong() {
  currentSongIndex = currentSongIndex === 0 ? playlist.length - 1 : currentSongIndex - 1;
  currentSong = playlist[currentSongIndex];
  
  globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
  globalAudio.volume = 0.4;
  
  updateSelectDropdown();
  
  globalAudio.play().then(() => {
    const nowPlaying = getElement('globalNowPlaying');
    if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
    musicButton.classList.add('playing');
    const playBtn = getElement('globalPlayBtn');
    if (playBtn) playBtn.textContent = '⏸️';
  }).catch(() => {
    const nowPlaying = getElement('globalNowPlaying');
    if (nowPlaying) nowPlaying.textContent = `Failed: ${getSongDisplayName(currentSong)}`;
  });
}

// Music popup toggle with smooth animations
function toggleMusicPopup() {
  const popup = getElement('musicPopup');
  const button = getElement('musicButton');
  
  musicPopupVisible = !musicPopupVisible;
  
  if (musicPopupVisible) {
    popup.style.display = 'block';
    button.classList.add('active');
    requestAnimationFrame(() => {
      popup.classList.add('show');
    });
  } else {
    popup.classList.remove('show');
    button.classList.remove('active');
    setTimeout(() => {
      if (!musicPopupVisible) popup.style.display = 'none';
    }, 300);
  }
}

// Exclamation popup toggle
function toggleExclamationPopup() {
  const popup = getElement('exclamationPopup');
  const icon = getElement('exclamationIcon');
  
  exclamationPopupVisible = !exclamationPopupVisible;
  
  if (exclamationPopupVisible) {
    if (popup) popup.classList.add('show');
    if (icon) icon.classList.add('active');
  } else {
    if (popup) popup.classList.remove('show');
    if (icon) icon.classList.remove('active');
  }
}

// ENHANCED: Click outside handler with proper photo modal support
document.addEventListener('click', function(event) {
  // Handle photo modal clicks properly
  const photoModal = getElement('photoModal');
  if (photoModal && photoModalOpen) {
    if (event.target === photoModal) {
      closePhotoModal();
      return;
    }
    return;
  }

  // Handle exclamation popup
  const popup = getElement('exclamationPopup');
  const icon = getElement('exclamationIcon');
  
  if (popup && icon && 
      !popup.contains(event.target) && 
      !icon.contains(event.target) && 
      exclamationPopupVisible) {
    popup.classList.remove('show');
    icon.classList.remove('active');
    exclamationPopupVisible = false;
  }
  
  // Handle music popup
  if (musicButton && musicPopup && 
      !musicButton.contains(event.target) && 
      !musicPopup.contains(event.target)) {
    musicPopup.classList.remove('show');
    musicButton.classList.remove('active');
    musicPopupVisible = false;
    setTimeout(() => {
      if (!musicPopupVisible) musicPopup.style.display = 'none';
    }, 300);
  }
});

// Select song function
function selectGlobalSong(songFile) {
  if (songFile && playlist.includes(songFile)) {
    const wasPlaying = !globalAudio.paused;
    
    currentSongIndex = playlist.indexOf(songFile);
    currentSong = songFile;
    
    globalAudio.src = `${BACKEND_URL}/assets/audio/${songFile}`;
    globalAudio.volume = 0.4;
    
    const nowPlaying = getElement('globalNowPlaying');
    const playBtn = getElement('globalPlayBtn');
    
    if (wasPlaying) {
      globalAudio.play().then(() => {
        if (nowPlaying) nowPlaying.textContent = getSongDisplayName(songFile);
        musicButton.classList.add('playing');
        if (playBtn) playBtn.textContent = '⏸️';
      }).catch(() => {
        if (nowPlaying) nowPlaying.textContent = `Failed: ${getSongDisplayName(songFile)}`;
      });
    } else {
      if (nowPlaying) nowPlaying.textContent = getSongDisplayName(songFile);
    }
  }
}

// Toggle music play/pause
function toggleGlobalMusic() {
  const playBtn = getElement('globalPlayBtn');
  const nowPlaying = getElement('globalNowPlaying');
  
  if (globalAudio.paused) {
    if (!globalAudio.src) {
      globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
    }
    
    globalAudio.play().then(() => {
      musicButton.classList.add('playing');
      if (playBtn) playBtn.textContent = '⏸️';
      if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
    }).catch(() => {
      if (nowPlaying) nowPlaying.textContent = `Error: ${getSongDisplayName(currentSong)}`;
    });
  } else {
    globalAudio.pause();
    musicButton.classList.remove('playing');
    if (playBtn) playBtn.textContent = '▶️';
    if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
  }
}

// Stop music
function stopGlobalMusic() {
  const playBtn = getElement('globalPlayBtn');
  const nowPlaying = getElement('globalNowPlaying');
  
  globalAudio.pause();
  globalAudio.currentTime = 0;
  musicButton.classList.remove('playing');
  if (playBtn) playBtn.textContent = '▶️';
  if (nowPlaying) nowPlaying.textContent = getSongDisplayName(currentSong);
}

// Essential audio event listeners only
globalAudio.addEventListener('ended', () => {
  playNextSong();
});

// FIXED NAVIGATION FUNCTIONS for Railway deployment
function navigateToGarden() {
  if (isNavigating) return;
  isNavigating = true;
     
  const leftSide = document.querySelector('.left-side');
  if (leftSide) leftSide.classList.add('clicking');
  if (typeof createSparkleTransition === 'function') createSparkleTransition();
     
  setTimeout(() => {
    window.location.href = '/hope';
  }, 1200);
}

function navigateToDoubt() {
  if (isNavigating) return;
  isNavigating = true;
     
  const rightSide = document.querySelector('.right-side');
  if (rightSide) rightSide.classList.add('clicking');
  if (typeof createBreakingHeartTransition === 'function') createBreakingHeartTransition();
     
  setTimeout(() => {
    window.location.href = '/doubt';
  }, 1500);
}

// File Manager Functions
function toggleFileManager() {
  const fileManager = getElement('file-manager-container');
     
  if (fileManager) {
    if (fileManager.style.display === 'flex') {
      fileManager.style.display = 'none';
    } else {
      fileManager.style.display = 'flex';
      if (typeof loadFileStructure === 'function') loadFileStructure();
    }
  }
}

// Initialize background
function initializeBackground() {
  createStars();
}

// Create stars (optimized for faster loading)
function createStars() {
  const starsContainer = getElement('stars');
  if (!starsContainer) return;
  
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = star.style.height = Math.random() * 2 + 1 + 'px';
    star.style.animationDelay = Math.random() * 2 + 's';
    fragment.appendChild(star);
  }
  
  starsContainer.appendChild(fragment);
}

// ENHANCED: Photo enlargement with smooth transition animations
function enlargePhoto(img, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  
  if (photoModalOpen || isImageTransitioning) return;
  
  isImageTransitioning = true;
  
  const modal = getElement('photoModal');
  const enlargedPhoto = getElement('enlargedPhoto');
  
  if (!modal || !enlargedPhoto) {
    isImageTransitioning = false;
    return;
  }
  
  // Store original image position for smooth transition
  const rect = img.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Set initial position and size to match clicked image
  enlargedPhoto.style.position = 'fixed';
  enlargedPhoto.style.top = (rect.top + scrollTop) + 'px';
  enlargedPhoto.style.left = (rect.left + scrollLeft) + 'px';
  enlargedPhoto.style.width = rect.width + 'px';
  enlargedPhoto.style.height = rect.height + 'px';
  enlargedPhoto.style.transform = 'scale(1)';
  enlargedPhoto.style.borderRadius = window.getComputedStyle(img).borderRadius;
  
  // Set the image source
  enlargedPhoto.src = img.src;
  enlargedPhoto.alt = img.alt || 'Enlarged photo';
  
  // Prevent body scrolling
  document.body.classList.add('photo-modal-open');
  
  // Show modal with initial opacity
  modal.style.display = 'flex';
  modal.style.opacity = '0';
  
  photoModalOpen = true;
  
  // Start the smooth transition
  requestAnimationFrame(() => {
    // Fade in background
    modal.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    modal.style.opacity = '1';
    
    // Animate image to center and full size
    enlargedPhoto.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    enlargedPhoto.style.top = '50%';
    enlargedPhoto.style.left = '50%';
    enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(1)';
    enlargedPhoto.style.width = 'auto';
    enlargedPhoto.style.height = 'auto';
    enlargedPhoto.style.maxWidth = '90vw';
    enlargedPhoto.style.maxHeight = '90vh';
    enlargedPhoto.style.borderRadius = '12px';
    enlargedPhoto.style.boxShadow = '0 25px 80px rgba(0, 0, 0, 0.8)';
    
    setTimeout(() => {
      isImageTransitioning = false;
    }, 600);
  });
}

// ENHANCED: Close photo modal with smooth reverse animation
function closePhotoModal() {
  if (!photoModalOpen || isImageTransitioning) return;
  
  isImageTransitioning = true;
  
  const modal = getElement('photoModal');
  const enlargedPhoto = getElement('enlargedPhoto');
  
  if (!modal || !enlargedPhoto) {
    isImageTransitioning = false;
    return;
  }
  
  // Start reverse animation
  modal.style.transition = 'opacity 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
  enlargedPhoto.style.transition = 'all 0.5s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
  
  // Animate out
  modal.style.opacity = '0';
  enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(0.8)';
  enlargedPhoto.style.opacity = '0';
  
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.classList.remove('photo-modal-open');
    if (enlargedPhoto) {
      enlargedPhoto.src = '';
      enlargedPhoto.style.cssText = '';
    }
    photoModalOpen = false;
    isImageTransitioning = false;
  }, 500);
}

// IMPROVED: Modal functions with better event handling
function openModal(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  const modal = getElement(id);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('modal-open');
    }, 10);
  }
}

function closeModal(id) {
  const modal = getElement(id);
  if (modal) {
    modal.classList.remove('modal-open');
    modal.style.display = "none";
    document.body.style.overflow = '';
  }
}

// ENHANCED: Window click handler
window.onclick = function (event) {
  const target = event.target;
  
  // Handle photo modal first
  const photoModal = getElement('photoModal');
  if (photoModal && photoModalOpen && target === photoModal) {
    closePhotoModal();
    return;
  }
  
  if (photoModalOpen) return;
  
  // Handle regular modals
  const modals = ["modal1", "modal2", "modal3"];
  for (let id of modals) {
    const modal = getElement(id);
    if (modal && target === modal && modal.classList.contains('modal-open')) {
      closeModal(id);
      return;
    }
  }
};

// IMPROVED: Keyboard support with photo modal priority
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (photoModalOpen) {
      closePhotoModal();
      return;
    }
    
    const popup = getElement('exclamationPopup');
    const icon = getElement('exclamationIcon');
    if (popup && exclamationPopupVisible) {
      popup.classList.remove('show');
      if (icon) icon.classList.remove('active');
      exclamationPopupVisible = false;
      return;
    }
    
    if (musicPopupVisible && musicPopup) {
      musicPopup.classList.remove('show');
      musicButton.classList.remove('active');
      musicPopupVisible = false;
      setTimeout(() => {
        if (!musicPopupVisible) musicPopup.style.display = 'none';
      }, 300);
      return;
    }
    
    const modals = ["modal1", "modal2", "modal3"];
    for (let id of modals) {
      const modal = getElement(id);
      if (modal && modal.style.display === 'block') {
        closeModal(id);
        return;
      }
    }
  }
});

// Message functions
function showSavedMessage(messageId) {
  const msg = getElement(messageId);
  if (msg) {
    if (msg.style.display === 'block') {
      msg.style.display = 'none';
    } else {
      msg.style.display = 'block';
      requestAnimationFrame(() => {
        setTimeout(() => {
          msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });
    }
  }
}

function hideSavedMessage(messageId) {
  const msg = getElement(messageId);
  if (msg) {
    msg.style.display = 'none';
  }
}

// Title click with smooth animations
function titleClick() {
  const popup = getElement('titlePopup');
  
  if (popup && popup.classList.contains('show')) {
    popup.classList.remove('show');
  } else if (popup) {
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  }
  
  const title = document.querySelector('.title');
  if (title) {
    requestAnimationFrame(() => {
      title.style.transform = 'scale(1.1)';
      title.style.textShadow = '0 0 30px rgba(255,255,255,1)';
      
      setTimeout(() => {
        requestAnimationFrame(() => {
          title.style.transform = 'scale(1)';
          title.style.textShadow = '2px 2px 10px rgba(0,0,0,0.3)';
        });
      }, 300);
    });
  }
}

// Performance optimization functions
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