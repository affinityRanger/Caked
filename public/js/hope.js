// JavaScript code for the Roses Gallery - OPTIMIZED FOR SPEED
const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "PARTYNEXTDOOR - Dreamin.mp3";
let exclamationPopupVisible = false;
let isNavigating = false;

// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// CORRECTED Song playlist array - matching EXACT files in assets folder
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

// Initialize audio on page load - OPTIMIZED
window.addEventListener('load', function() {
  globalAudio.volume = 0.4;
  globalAudio.loop = false;
  
  // Faster loading - reduced delays
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loadingScreen').style.display = 'none';
      initializeBackground();
      // Don't auto-start music to reduce initial load time
      // User can click play when ready
    }, 500); // Reduced from 1000ms
  }, 1000); // Reduced from 2000ms
});

// Optimized auto-play function - only loads when user clicks play
function startAutoPlay() {
  // Don't auto-load audio to reduce initial page load time
  document.getElementById('globalNowPlaying').textContent = 'Click play to start music';
  document.getElementById('globalPlayBtn').textContent = '▶️ Play';
}

// Update select dropdown
function updateSelectDropdown() {
  const select = document.getElementById('globalMusicSelect');
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
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
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
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
  }).catch(() => {
    document.getElementById('globalNowPlaying').textContent = `Failed: ${getSongDisplayName(currentSong)}`;
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
  const popup = document.getElementById('exclamationPopup');
  const icon = document.getElementById('exclamationIcon');
  
  exclamationPopupVisible = !exclamationPopupVisible;
  
  if (exclamationPopupVisible) {
    popup.classList.add('show');
    icon.classList.add('active');
  } else {
    popup.classList.remove('show');
    icon.classList.remove('active');
  }
}

// Click outside handler
document.addEventListener('click', function(event) {
  const popup = document.getElementById('exclamationPopup');
  const icon = document.getElementById('exclamationIcon');
  
  if (popup && icon && 
      !popup.contains(event.target) && 
      !icon.contains(event.target) && 
      exclamationPopupVisible) {
    popup.classList.remove('show');
    icon.classList.remove('active');
    exclamationPopupVisible = false;
  }
  
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
    
    if (wasPlaying) {
      globalAudio.play().then(() => {
        document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(songFile)}`;
        musicButton.classList.add('playing');
        document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
      }).catch(() => {
        document.getElementById('globalNowPlaying').textContent = `Failed: ${getSongDisplayName(songFile)}`;
      });
    } else {
      document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(songFile)}`;
    }
  }
}

// Toggle music play/pause
function toggleGlobalMusic() {
  if (globalAudio.paused) {
    if (!globalAudio.src) {
      globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
    }
    
    globalAudio.play().then(() => {
      musicButton.classList.add('playing');
      document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
      document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    }).catch(() => {
      document.getElementById('globalNowPlaying').textContent = `Error: ${getSongDisplayName(currentSong)}`;
    });
  } else {
    globalAudio.pause();
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Paused: ${getSongDisplayName(currentSong)}`;
  }
}

// Stop music
function stopGlobalMusic() {
  globalAudio.pause();
  globalAudio.currentTime = 0;
  musicButton.classList.remove('playing');
  document.getElementById('globalPlayBtn').textContent = '▶️ Play';
  document.getElementById('globalNowPlaying').textContent = `Stopped: ${getSongDisplayName(currentSong)}`;
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
  const fileManager = document.getElementById('file-manager-container');
     
  if (fileManager.style.display === 'flex') {
    fileManager.style.display = 'none';
  } else {
    fileManager.style.display = 'flex';
    if (typeof loadFileStructure === 'function') loadFileStructure();
  }
}

// Initialize background
function initializeBackground() {
  createStars();
}

// Create stars (optimized for faster loading)
function createStars() {
  const starsContainer = document.getElementById('stars');
  if (!starsContainer) return;
  
  // Reduced from 50 to 25 stars for faster rendering
  for (let i = 0; i < 25; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = star.style.height = Math.random() * 2 + 1 + 'px'; // Smaller stars
    star.style.animationDelay = Math.random() * 2 + 's'; // Shorter delay
    starsContainer.appendChild(star);
  }
}

// Photo enlargement
function enlargePhoto(img) {
  const modal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  if (!modal || !enlargedPhoto) return;
  
  enlargedPhoto.src = img.src;
  enlargedPhoto.alt = img.alt || 'Enlarged photo';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close photo modal
function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  if (!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = '';
  if (enlargedPhoto) enlargedPhoto.src = '';
}

// Modal functions
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = '';
  }
}

// Window click handler
window.onclick = function (event) {
  const photoModal = document.getElementById('photoModal');
  
  if (event.target === photoModal) {
    closePhotoModal();
    return;
  }
  
  const modals = ["modal1", "modal2", "modal3"];
  for (let id of modals) {
    const modal = document.getElementById(id);
    if (modal && event.target === modal) {
      closeModal(id);
      return;
    }
  }
};

// Keyboard support
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const photoModal = document.getElementById('photoModal');
    if (photoModal && photoModal.style.display === 'flex') {
      closePhotoModal();
      return;
    }
    
    const popup = document.getElementById('exclamationPopup');
    const icon = document.getElementById('exclamationIcon');
    if (popup && exclamationPopupVisible) {
      popup.classList.remove('show');
      if (icon) icon.classList.remove('active');
      exclamationPopupVisible = false;
      return;
    }
    
    if (musicPopupVisible) {
      musicPopup.classList.remove('show');
      musicPopupVisible = false;
      return;
    }
    
    const modals = ["modal1", "modal2", "modal3"];
    for (let id of modals) {
      const modal = document.getElementById(id);
      if (modal && modal.style.display === 'block') {
        closeModal(id);
        return;
      }
    }
  }
});

// Message functions
function showSavedMessage(messageId) {
  const msg = document.getElementById(messageId);
  if (msg) {
    if (msg.style.display === 'block') {
      msg.style.display = 'none';
    } else {
      msg.style.display = 'block';
      setTimeout(() => {
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }
}

function hideSavedMessage(messageId) {
  const msg = document.getElementById(messageId);
  if (msg) {
    msg.style.display = 'none';
  }
}

// Title click
function titleClick() {
  const popup = document.getElementById('titlePopup');
  
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
    title.style.transform = 'scale(1.1)';
    title.style.textShadow = '0 0 30px rgba(255,255,255,1)';
    
    setTimeout(() => {
      title.style.transform = 'scale(1)';
      title.style.textShadow = '2px 2px 10px rgba(0,0,0,0.3)';
    }, 300);
  }
}

// DOM ready initialization (simplified)
document.addEventListener('DOMContentLoaded', function() {
  globalAudio.volume = 0.4;
  globalAudio.loop = false;
  
  currentSongIndex = playlist.indexOf(currentSong);
  if (currentSongIndex === -1) {
    currentSongIndex = 0;
    currentSong = playlist[0];
  }
});