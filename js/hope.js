const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "PARTYNEXTDOOR - Dreamin.mp3";

// Initialize audio on page load
window.addEventListener('load', function() {
  // Set up audio properties
  globalAudio.volume = 0.4;
  globalAudio.loop = false; // Disable loop for playlist progression
  
  // Start loading screen
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loadingScreen').style.display = 'none';
      initializeBackground();
      // Try to auto-play music after loading screen
      startAutoPlay();
    }, 1000);
  }, 2000);
});

// Auto-play function
function startAutoPlay() {
  // Try to play automatically
  globalAudio.play().then(() => {
    // Success - music is playing
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
  }).catch(error => {
    // Auto-play failed (most browsers block auto-play)
    console.log('Auto-play failed, user interaction required:', error);
    document.getElementById('globalNowPlaying').textContent = 'Click play to start music';
  });
}

// Song playlist array
const playlist = [
  'PARTYNEXTDOOR - Dreamin.mp3',
  'song2.mp3',
  'song3.mp3',
  'song4.mp3',
  'song5.mp3',
  'song6.mp3',
  'song7.mp3'
];

let currentSongIndex = 0;

// Get display name for song
function getSongDisplayName(songFile) {
  const songNames = {
    'PARTYNEXTDOOR - Dreamin.mp3': 'Dreamin\' - PARTYNEXTDOOR',
    'song2.mp3': 'PARTYNEXTDOOR-TRAUMA',
    'song3.mp3': 'Golden - Jill Scott',
    'song4.mp3': 'Adorn - Miguel',
    'song5.mp3': 'Come Through - H.E.R.',
    'song6.mp3': 'Stay Ready - Jhené Aiko',
    'song7.mp3': 'Love Galore - SZA'
  };
  return songNames[songFile] || songFile.replace('.mp3', '');
}

// Play next song in playlist
function playNextSong() {
  currentSongIndex = (currentSongIndex + 1) % playlist.length;
  const nextSong = playlist[currentSongIndex];
  currentSong = nextSong;
  
  globalAudio.src = `assets/audio/${nextSong}`;
  globalAudio.volume = 0.4;
  
  globalAudio.play().then(() => {
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(nextSong)}`;
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
  }).catch(error => {
    console.log('Failed to play next song:', error);
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Failed to load: ${getSongDisplayName(nextSong)}`;
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

// Close popup when clicking outside
document.addEventListener('click', function(event) {
  if (!musicButton.contains(event.target) && !musicPopup.contains(event.target)) {
    musicPopup.classList.remove('show');
    musicPopupVisible = false;
  }
});

// Global music functions
function selectGlobalSong(songFile) {
  if (songFile) {
    const wasPlaying = !globalAudio.paused;
    
    // Update current song index to match selected song
    currentSongIndex = playlist.indexOf(songFile);
    if (currentSongIndex === -1) currentSongIndex = 0;
    
    globalAudio.src = `assets/audio/${songFile}`;
    globalAudio.volume = 0.4;
    currentSong = songFile;
    
    if (wasPlaying) {
      globalAudio.play().then(() => {
        document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(songFile)}`;
        musicButton.classList.add('playing');
        document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
      }).catch(error => {
        console.log('Failed to play new song:', error);
        musicButton.classList.remove('playing');
        document.getElementById('globalPlayBtn').textContent = '▶️ Play';
        document.getElementById('globalNowPlaying').textContent = `Failed to load: ${getSongDisplayName(songFile)}`;
      });
    } else {
      document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(songFile)}`;
    }
  }
}

function toggleGlobalMusic() {
  if (globalAudio.paused) {
    // Try to play
    globalAudio.play().then(() => {
      musicButton.classList.add('playing');
      document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
      document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    }).catch(error => {
      console.log('Music play failed:', error);
      document.getElementById('globalNowPlaying').textContent = `Error: Could not play ${getSongDisplayName(currentSong)}`;
    });
  } else {
    // Pause the music
    globalAudio.pause();
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Paused: ${getSongDisplayName(currentSong)}`;
  }
}

function stopGlobalMusic() {
  globalAudio.pause();
  globalAudio.currentTime = 0;
  musicButton.classList.remove('playing');
  document.getElementById('globalPlayBtn').textContent = '▶️ Play';
  document.getElementById('globalNowPlaying').textContent = `Stopped: ${getSongDisplayName(currentSong)}`;
}

// Handle music ended event - Auto-play next song
globalAudio.addEventListener('ended', () => {
  // Automatically play the next song
  playNextSong();
});

// Handle audio loading events
globalAudio.addEventListener('loadstart', () => {
  document.getElementById('globalNowPlaying').textContent = 'Loading...';
});

globalAudio.addEventListener('canplaythrough', () => {
  if (globalAudio.paused) {
    document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(currentSong)}`;
  }
});

globalAudio.addEventListener('error', (e) => {
  console.log('Audio error:', e);
  document.getElementById('globalNowPlaying').textContent = `Error loading: ${getSongDisplayName(currentSong)}`;
  musicButton.classList.remove('playing');
  document.getElementById('globalPlayBtn').textContent = '▶️ Play';
});

// Initialize background elements
function initializeBackground() {
  createStars();
}

// Create twinkling stars
function createStars() {
  const starsContainer = document.getElementById('stars');
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = star.style.height = Math.random() * 3 + 1 + 'px';
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
  }
}

// Enhanced Photo enlargement function with proper positioning and mobile support
function enlargePhoto(img) {
  const modal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  if (!modal || !enlargedPhoto) {
    console.error('Photo modal elements not found');
    return;
  }
  
  // Set the image source
  enlargedPhoto.src = img.src;
  enlargedPhoto.alt = img.alt || 'Enlarged photo';
  
  // Show the modal
  modal.style.display = 'flex';
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
  
  // Add fade-in animation
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
  
  // Reset any previous transforms
  enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(0.8)';
  setTimeout(() => {
    enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
}

// Enhanced close photo modal function
function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  if (!modal) return;
  
  // Add fade-out animation
  modal.style.opacity = '0';
  if (enlargedPhoto) {
    enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(0.8)';
  }
  
  setTimeout(() => {
    modal.style.display = 'none';
    // Restore body scrolling
    document.body.style.overflow = '';
  }, 300);
}

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

// Enhanced window click handler with proper photo modal support
window.onclick = function (event) {
  const photoModal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  // Handle photo modal
  if (event.target === photoModal) {
    closePhotoModal();
    return;
  }
  
  // Handle other modals
  const modals = ["modal1", "modal2", "modal3"];
  for (let id of modals) {
    const modal = document.getElementById(id);
    if (modal && event.target === modal) {
      closeModal(id);
      return;
    }
  }
};

// Add keyboard support for closing photo modal
document.addEventListener('keydown', function(event) {
  const photoModal = document.getElementById('photoModal');
  if (event.key === 'Escape' && photoModal && photoModal.style.display === 'flex') {
    closePhotoModal();
  }
});

// Updated message functions with toggle functionality
function showSavedMessage(messageId) {
  const msg = document.getElementById(messageId);
  if (msg) {
    // Check if message is already visible
    if (msg.style.display === 'block') {
      // If visible, hide it
      hideSavedMessage(messageId);
    } else {
      // If hidden, show it
      msg.style.display = 'block';
      // Add a gentle scroll to the message
      setTimeout(() => {
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }
}

// New function to hide messages
function hideSavedMessage(messageId) {
  const msg = document.getElementById(messageId);
  if (msg) {
    msg.style.display = 'none';
  }
}

// Toggle function for message icons - can be used as an alternative
function toggleSavedMessage(messageId) {
  const msg = document.getElementById(messageId);
  if (msg) {
    if (msg.style.display === 'block') {
      msg.style.display = 'none';
    } else {
      msg.style.display = 'block';
      // Add a gentle scroll to the message
      setTimeout(() => {
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }
}

// Title click functionality - Small thought bubble
function titleClick() {
  const popup = document.getElementById('titlePopup');
  
  if (popup.classList.contains('show')) {
    popup.classList.remove('show');
  } else {
    popup.classList.add('show');
    // Auto-hide after 3 seconds
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  }
  
  // Add a special effect to the title
  const title = document.querySelector('.title');
  title.style.transform = 'scale(1.1)';
  title.style.textShadow = '0 0 30px rgba(255,255,255,1)';
  
  setTimeout(() => {
    title.style.transform = 'scale(1)';
    title.style.textShadow = '2px 2px 10px rgba(0,0,0,0.3)';
  }, 300);
}

// Initialize audio when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  globalAudio.volume = 0.4;
  globalAudio.loop = false; // Disable loop since we're doing playlist progression
  
  // Initialize current song index
  currentSongIndex = playlist.indexOf(currentSong);
  if (currentSongIndex === -1) currentSongIndex = 0;
  
  // Add touch support for mobile devices
  const photos = document.querySelectorAll('.photo');
  photos.forEach(photo => {
    photo.addEventListener('touchend', function(e) {
      e.preventDefault();
      enlargePhoto(this);
    });
  });
});