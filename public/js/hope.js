// JavaScript code for the Roses Gallery - OPTIMIZED WITH IMAGE MODAL FIX
const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "PARTYNEXTDOOR - Dreamin.mp3";
let exclamationPopupVisible = false;
let isNavigating = false;

// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// Song playlist array - matching EXACT files in assets folder
const playlist = [
  'PARTYNEXTDOOR - Dreamin.mp3',
  'PARTYNEXTDOOR - DEEPER.mp3', 
  'PARTYNEXTDOOR - TRAUMA .mp3',
  'KEEP IT-Juice WRLD.mp3',
  'Juice WRLD - GRACE.mp3',
  'PARTYNEXTDOOR - Some Of Your Love.mp3',
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

// Updated display names to match actual files
function getSongDisplayName(songFile) {
  const songNames = {
    'PARTYNEXTDOOR - Dreamin.mp3': 'Dreamin\' - PARTYNEXTDOOR',
    'PARTYNEXTDOOR - DEEPER.mp3': 'DEEPER - PARTYNEXTDOOR',
    'PARTYNEXTDOOR - TRAUMA .mp3': 'TRAUMA - PARTYNEXTDOOR',
    'KEEP IT-Juice WRLD.mp3': 'KEEP IT - Juice WRLD',
    'Juice WRLD - GRACE.mp3': 'GRACE - Juice WRLD',
    'PARTYNEXTDOOR - Some Of Your Love.mp3': 'Some Of Your Love - PARTYNEXTDOOR',
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
        startAutoPlay(); // AUTO-PLAY RESTORED
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
    if (playBtn) playBtn.textContent = '⏸️ Pause';
    if (nowPlaying) nowPlaying.textContent = `Playing: ${getSongDisplayName(currentSong)}`;
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
    if (nowPlaying) nowPlaying.textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    musicButton.classList.add('playing');
    const playBtn = getElement('globalPlayBtn');
    if (playBtn) playBtn.textContent = '⏸️ Pause';
  }).catch(() => {
    // If this song fails, try next one
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
    if (nowPlaying) nowPlaying.textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    musicButton.classList.add('playing');
    const playBtn = getElement('globalPlayBtn');
    if (playBtn) playBtn.textContent = '⏸️ Pause';
  }).catch(() => {
    const nowPlaying = getElement('globalNowPlaying');
    if (nowPlaying) nowPlaying.textContent = `Failed: ${getSongDisplayName(currentSong)}`;
  });
}

// Music popup toggle
function toggleMusicPopup() {
  musicPopupVisible = !musicPopupVisible;
  if (musicPopupVisible) {
    musicPopup.classList.add('show');
  } else {
    musicPopup.classList.remove('show');
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

// IMPROVED: Click outside handler with better event targeting
document.addEventListener('click', function(event) {
  // Check if click is on photo modal background (not content)
  const photoModal = getElement('photoModal');
  if (photoModal && event.target === photoModal) {
    closePhotoModal();
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
    musicPopupVisible = false;
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
        if (nowPlaying) nowPlaying.textContent = `Playing: ${getSongDisplayName(songFile)}`;
        musicButton.classList.add('playing');
        if (playBtn) playBtn.textContent = '⏸️ Pause';
      }).catch(() => {
        if (nowPlaying) nowPlaying.textContent = `Failed: ${getSongDisplayName(songFile)}`;
      });
    } else {
      if (nowPlaying) nowPlaying.textContent = `Ready: ${getSongDisplayName(songFile)}`;
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
      if (playBtn) playBtn.textContent = '⏸️ Pause';
      if (nowPlaying) nowPlaying.textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    }).catch(() => {
      if (nowPlaying) nowPlaying.textContent = `Error: ${getSongDisplayName(currentSong)}`;
    });
  } else {
    globalAudio.pause();
    musicButton.classList.remove('playing');
    if (playBtn) playBtn.textContent = '▶️ Play';
    if (nowPlaying) nowPlaying.textContent = `Paused: ${getSongDisplayName(currentSong)}`;
  }
}

// Stop music
function stopGlobalMusic() {
  const playBtn = getElement('globalPlayBtn');
  const nowPlaying = getElement('globalNowPlaying');
  
  globalAudio.pause();
  globalAudio.currentTime = 0;
  musicButton.classList.remove('playing');
  if (playBtn) playBtn.textContent = '▶️ Play';
  if (nowPlaying) nowPlaying.textContent = `Stopped: ${getSongDisplayName(currentSong)}`;
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
  
  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  
  // Reduced from 50 to 20 stars for even faster rendering
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

// FIXED: Photo enlargement with proper event handling
function enlargePhoto(img, event) {
  // Prevent event bubbling that was causing immediate closure
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  const modal = getElement('photoModal');
  const enlargedPhoto = getElement('enlargedPhoto');
  
  if (!modal || !enlargedPhoto) return;
  
  enlargedPhoto.src = img.src;
  enlargedPhoto.alt = img.alt || 'Enlarged photo';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Add a small delay to prevent immediate closure
  setTimeout(() => {
    modal.classList.add('photo-modal-open');
  }, 10);
}

// FIXED: Close photo modal
function closePhotoModal() {
  const modal = getElement('photoModal');
  const enlargedPhoto = getElement('enlargedPhoto');
  
  if (!modal) return;
  
  modal.classList.remove('photo-modal-open');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  if (enlargedPhoto) enlargedPhoto.src = '';
}

// IMPROVED: Modal functions with better event handling
function openModal(id, event) {
  // Prevent event bubbling
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  const modal = getElement(id);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';
    
    // Add a small delay to prevent immediate closure
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

// IMPROVED: Window click handler with better targeting
window.onclick = function (event) {
  // Only handle clicks on modal backgrounds, not their content
  const target = event.target;
  
  // Handle photo modal
  const photoModal = getElement('photoModal');
  if (photoModal && target === photoModal && photoModal.classList.contains('photo-modal-open')) {
    closePhotoModal();
    return;
  }
  
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

// Keyboard support with performance improvements
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    // Handle photo modal first
    const photoModal = getElement('photoModal');
    if (photoModal && photoModal.style.display === 'flex') {
      closePhotoModal();
      return;
    }
    
    // Handle exclamation popup
    const popup = getElement('exclamationPopup');
    const icon = getElement('exclamationIcon');
    if (popup && exclamationPopupVisible) {
      popup.classList.remove('show');
      if (icon) icon.classList.remove('active');
      exclamationPopupVisible = false;
      return;
    }
    
    // Handle music popup
    if (musicPopupVisible && musicPopup) {
      musicPopup.classList.remove('show');
      musicPopupVisible = false;
      return;
    }
    
    // Handle regular modals
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

// IMPROVED: Message functions with performance optimization
function showSavedMessage(messageId) {
  const msg = getElement(messageId);
  if (msg) {
    if (msg.style.display === 'block') {
      msg.style.display = 'none';
    } else {
      msg.style.display = 'block';
      // Use requestAnimationFrame for smoother scrolling
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

// IMPROVED: Title click with performance optimization
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
    // Use requestAnimationFrame for smoother animation
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

// DOM ready initialization (optimized)
document.addEventListener('DOMContentLoaded', function() {
  // Cache frequently used elements
  cachedElements.globalAudio = globalAudio;
  cachedElements.musicButton = musicButton;
  cachedElements.musicPopup = musicPopup;
  
  globalAudio.volume = 0.4;
  globalAudio.loop = false;
  
  currentSongIndex = playlist.indexOf(currentSong);
  if (currentSongIndex === -1) {
    currentSongIndex = 0;
    currentSong = playlist[0];
  }
});