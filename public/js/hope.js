// JavaScript code for the Roses Gallery - COMPLETE FIXED VERSION
const globalAudio = document.getElementById("globalAudio");
const musicButton = document.getElementById("musicButton");
const musicPopup = document.getElementById("musicPopup");
let musicPopupVisible = false;
let currentSong = "PARTYNEXTDOOR - Dreamin.mp3";
// Exclamation popup functionality
let exclamationPopupVisible = false;

// Backend URL configuration - Updated for production
const BACKEND_URL = 'https://caked-production.up.railway.app'; // Updated to use your Railway URL

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
  // Set the initial song source using backend URL
  globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
  
  // Try to play automatically
  globalAudio.play().then(() => {
    // Success - music is playing
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(currentSong)}`;
    // Update the select dropdown to match current song
    updateSelectDropdown();
  }).catch(error => {
    // Auto-play failed (most browsers block auto-play)
    console.log('Auto-play failed, user interaction required:', error);
    document.getElementById('globalNowPlaying').textContent = 'Click play to start music';
  });
}

// FIXED Song playlist array - Updated with correct file names that match your HTML
const playlist = [
  'PARTYNEXTDOOR - Dreamin.mp3',           // This one works
  'PARTYNEXTDOOR-TRAUMA.mp3',              // Fixed: removed space before .mp3
  'KEEP IT-JUICE WRLD.mp3',                // This should work
  'PARTYNEXTDOOR - DEEPER.mp3',            // This should work
  'GRACE SAM - Juice WRLD.mp3',            // Fixed: matches your HTML audio source
  'song6.mp3',                             // Placeholder - update with actual filename
  'song7.mp3'                              // Placeholder - update with actual filename
];
let currentSongIndex = 0;

// FIXED Get display name for song - Updated to match corrected playlist
function getSongDisplayName(songFile) {
  const songNames = {
    'PARTYNEXTDOOR - Dreamin.mp3': 'Dreamin\' - PARTYNEXTDOOR',
    'PARTYNEXTDOOR-TRAUMA.mp3': 'TRAUMA - PARTYNEXTDOOR',        // Fixed key
    'KEEP IT-JUICE WRLD.mp3': 'KEEP IT - Juice WRLD',
    'PARTYNEXTDOOR - DEEPER.mp3': 'DEEPER - PARTYNEXTDOOR',
    'GRACE SAM - Juice WRLD.mp3': 'GRACE/SAM - Juice WRLD',     // Fixed key
    'song6.mp3': 'Stay Ready - Jhené Aiko',
    'song7.mp3': 'Love Galore - SZA'
  };
  return songNames[songFile] || songFile.replace('.mp3', '');
}

// Function to update the select dropdown to match current song
function updateSelectDropdown() {
  const select = document.getElementById('globalMusicSelect');
  if (select && playlist.includes(currentSong)) {
    select.value = currentSong;
  }
}

// ENHANCED play next song function with better error handling and debugging
function playNextSong() {
  console.log('Playing next song. Current index:', currentSongIndex);
  console.log('Current playlist:', playlist);
  
  currentSongIndex = (currentSongIndex + 1) % playlist.length;
  const nextSong = playlist[currentSongIndex];
  currentSong = nextSong;
  
  console.log('Next song:', nextSong, 'New index:', currentSongIndex);
  
  // Construct the full URL
  const songUrl = `${BACKEND_URL}/assets/audio/${nextSong}`;
  console.log('Trying to load:', songUrl);
  
  // Set the new source using backend URL
  globalAudio.src = songUrl;
  globalAudio.volume = 0.4;
  
  // Update display immediately
  document.getElementById('globalNowPlaying').textContent = `Loading: ${getSongDisplayName(nextSong)}`;
  
  // Update the select dropdown
  updateSelectDropdown();
  
  // Add load event listener for this specific song
  const handleLoad = () => {
    console.log('Song loaded successfully:', nextSong);
    globalAudio.removeEventListener('canplaythrough', handleLoad);
  };
  
  const handleError = (error) => {
    console.error('Failed to load song:', nextSong, error);
    console.log('Audio error details:', globalAudio.error);
    globalAudio.removeEventListener('error', handleError);
    
    // If this song fails, try the next one (but prevent infinite loop)
    if (currentSongIndex < playlist.length - 1) {
      console.log('Trying next song due to load error...');
      setTimeout(() => playNextSong(), 1000);
    } else {
      // If we've reached the end and still failing, reset to first song
      currentSongIndex = 0;
      currentSong = playlist[0];
      musicButton.classList.remove('playing');
      document.getElementById('globalPlayBtn').textContent = '▶️ Play';
      document.getElementById('globalNowPlaying').textContent = `Playlist ended - Click play to restart`;
    }
  };
  
  globalAudio.addEventListener('canplaythrough', handleLoad, { once: true });
  globalAudio.addEventListener('error', handleError, { once: true });
  
  // Try to play the next song
  globalAudio.play().then(() => {
    console.log('Successfully playing:', nextSong);
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(nextSong)}`;
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
  }).catch(error => {
    console.log('Failed to play next song:', error);
    console.log('Audio readyState:', globalAudio.readyState);
    console.log('Audio networkState:', globalAudio.networkState);
    
    // Try to load the audio first
    globalAudio.load();
    setTimeout(() => {
      globalAudio.play().catch(playError => {
        console.log('Second attempt failed:', playError);
        handleError(playError);
      });
    }, 500);
  });
}

// Enhanced play previous song function
function playPreviousSong() {
  console.log('Playing previous song. Current index:', currentSongIndex);
  
  currentSongIndex = currentSongIndex === 0 ? playlist.length - 1 : currentSongIndex - 1;
  const prevSong = playlist[currentSongIndex];
  currentSong = prevSong;
  
  console.log('Previous song:', prevSong, 'New index:', currentSongIndex);
  
  const songUrl = `${BACKEND_URL}/assets/audio/${prevSong}`;
  console.log('Trying to load:', songUrl);
  
  globalAudio.src = songUrl;
  globalAudio.volume = 0.4;
  
  document.getElementById('globalNowPlaying').textContent = `Loading: ${getSongDisplayName(prevSong)}`;
  
  // Update the select dropdown
  updateSelectDropdown();
  
  globalAudio.play().then(() => {
    document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(prevSong)}`;
    musicButton.classList.add('playing');
    document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
  }).catch(error => {
    console.log('Failed to play previous song:', error);
    musicButton.classList.remove('playing');
    document.getElementById('globalPlayBtn').textContent = '▶️ Play';
    document.getElementById('globalNowPlaying').textContent = `Failed to load: ${getSongDisplayName(prevSong)}`;
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

// Enhanced click outside handler for both popups
document.addEventListener('click', function(event) {
  const popup = document.getElementById('exclamationPopup');
  const icon = document.getElementById('exclamationIcon');
  
  // Handle exclamation popup
  if (popup && icon && 
      !popup.contains(event.target) && 
      !icon.contains(event.target) && 
      exclamationPopupVisible) {
    popup.classList.remove('show');
    icon.classList.remove('active');
    exclamationPopupVisible = false;
  }
  
  // Handle music popup (keep existing functionality)
  if (musicButton && musicPopup && 
      !musicButton.contains(event.target) && 
      !musicPopup.contains(event.target)) {
    musicPopup.classList.remove('show');
    musicPopupVisible = false;
  }
});

// Global music functions
function selectGlobalSong(songFile) {
  console.log('Selecting song:', songFile);
  
  if (songFile && playlist.includes(songFile)) {
    const wasPlaying = !globalAudio.paused;
    
    // Update current song index to match selected song
    currentSongIndex = playlist.indexOf(songFile);
    currentSong = songFile;
    
    console.log('Selected song index:', currentSongIndex);
    
    const songUrl = `${BACKEND_URL}/assets/audio/${songFile}`;
    console.log('Loading selected song:', songUrl);
    
    globalAudio.src = songUrl;
    globalAudio.volume = 0.4;
    
    if (wasPlaying) {
      globalAudio.play().then(() => {
        document.getElementById('globalNowPlaying').textContent = `Playing: ${getSongDisplayName(songFile)}`;
        musicButton.classList.add('playing');
        document.getElementById('globalPlayBtn').textContent = '⏸️ Pause';
      }).catch(error => {
        console.log('Failed to play selected song:', error);
        musicButton.classList.remove('playing');
        document.getElementById('globalPlayBtn').textContent = '▶️ Play';
        document.getElementById('globalNowPlaying').textContent = `Failed to load: ${getSongDisplayName(songFile)}`;
      });
    } else {
      document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(songFile)}`;
    }
  } else {
    console.error('Song not found in playlist:', songFile);
  }
}

function toggleGlobalMusic() {
  if (globalAudio.paused) {
    // Make sure we have a source set
    if (!globalAudio.src || globalAudio.src === '') {
      globalAudio.src = `${BACKEND_URL}/assets/audio/${currentSong}`;
    }
    
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

// Enhanced audio event listeners
globalAudio.addEventListener('ended', () => {
  console.log('Song ended, playing next song');
  playNextSong();
});

globalAudio.addEventListener('loadstart', () => {
  console.log('Started loading:', currentSong);
  document.getElementById('globalNowPlaying').textContent = 'Loading...';
});

globalAudio.addEventListener('canplaythrough', () => {
  console.log('Can play through:', currentSong);
  if (globalAudio.paused) {
    document.getElementById('globalNowPlaying').textContent = `Ready: ${getSongDisplayName(currentSong)}`;
  }
});

globalAudio.addEventListener('error', (e) => {
  console.error('Audio error for', currentSong, ':', e);
  console.log('Error details:', globalAudio.error);
  
  document.getElementById('globalNowPlaying').textContent = `Error loading: ${getSongDisplayName(currentSong)}`;
  musicButton.classList.remove('playing');
  document.getElementById('globalPlayBtn').textContent = '▶️ Play';
  
  // Try to play next song if current one fails
  setTimeout(() => {
    console.log('Trying next song due to error...');
    playNextSong();
  }, 1000);
});

// Add additional event listeners for debugging
globalAudio.addEventListener('loadedmetadata', () => {
  console.log('Loaded metadata for:', currentSong);
});

globalAudio.addEventListener('play', () => {
  console.log('Started playing:', currentSong);
});

globalAudio.addEventListener('pause', () => {
  console.log('Audio paused');
});

// Test function to check if files exist
async function testAudioFiles() {
  console.log('Testing audio files...');
  
  for (let i = 0; i < playlist.length; i++) {
    const song = playlist[i];
    const url = `${BACKEND_URL}/assets/audio/${song}`;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ ${song} - EXISTS`);
      } else {
        console.log(`❌ ${song} - NOT FOUND (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${song} - ERROR:`, error.message);
    }
  }
}

// Initialize background elements
function initializeBackground() {
  createStars();
  // Call test function to check audio files
  testAudioFiles();
}

// Create twinkling stars
function createStars() {
  const starsContainer = document.getElementById('stars');
  if (!starsContainer) return;
  
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

// Enhanced Photo enlargement function with click-outside-to-close functionality
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
    modal.classList.add('show');
  }, 10);
  
  // Reset any previous transforms
  enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(0.8)';
  setTimeout(() => {
    enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 50);
}

// Enhanced close photo modal function
function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  if (!modal) return;
  
  // Add fade-out animation
  modal.style.opacity = '0';
  modal.classList.remove('show');
  
  if (enlargedPhoto) {
    enlargedPhoto.style.transform = 'translate(-50%, -50%) scale(0.8)';
  }
  
  setTimeout(() => {
    modal.style.display = 'none';
    // Restore body scrolling
    document.body.style.overflow = '';
    // Clear the image source to save memory
    if (enlargedPhoto) {
      enlargedPhoto.src = '';
    }
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

// Enhanced window click handler with improved photo modal support
window.onclick = function (event) {
  const photoModal = document.getElementById('photoModal');
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  
  // Handle photo modal - close when clicking outside the image
  if (event.target === photoModal) {
    closePhotoModal();
    return;
  }
  
  // Prevent closing when clicking on the enlarged photo itself
  if (enlargedPhoto && event.target === enlargedPhoto) {
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

// Add keyboard support for closing modals
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    // Close photo modal
    const photoModal = document.getElementById('photoModal');
    if (photoModal && (photoModal.style.display === 'flex' || photoModal.classList.contains('show'))) {
      closePhotoModal();
      return;
    }
    
    // Close exclamation popup
    const popup = document.getElementById('exclamationPopup');
    const icon = document.getElementById('exclamationIcon');
    if (popup && exclamationPopupVisible) {
      popup.classList.remove('show');
      if (icon) icon.classList.remove('active');
      exclamationPopupVisible = false;
      return;
    }
    
    // Close music popup
    if (musicPopupVisible) {
      musicPopup.classList.remove('show');
      musicPopupVisible = false;
      return;
    }
    
    // Close other modals
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
  
  if (popup && popup.classList.contains('show')) {
    popup.classList.remove('show');
  } else if (popup) {
    popup.classList.add('show');
    // Auto-hide after 3 seconds
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  }
  
  // Add a special effect to the title
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

// ===== NEW PHOTO GALLERY FUNCTIONS =====
// Photo Gallery Functions
function loadPhotoGallery(category = null) {
  const galleryContainer = document.getElementById('photo-gallery');
  
  if (!galleryContainer) return;
  
  // Show loading message
  galleryContainer.innerHTML = '<div class="loading">Loading photos...</div>';
  
  // Build API URL with category filter if provided
  let apiUrl = `${BACKEND_URL}/api/photos`;
  if (category) {
    apiUrl += `?category=${category}`;
  }
  
  // Fetch photos from backend API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(photos => {
      // Clear loading message
      galleryContainer.innerHTML = '';
      
      if (photos.length === 0) {
        galleryContainer.innerHTML = '<div class="no-photos">No photos available</div>';
        return;
      }
      
      // Display photos
      photos.forEach(photo => {
        // Create main photo element
        const photoElement = createPhotoElement(photo);
        galleryContainer.appendChild(photoElement);
        
        // Create additional photos if they exist
        if (photo.photos && photo.photos.length > 0) {
          photo.photos.forEach(photoFilename => {
            const additionalPhoto = {
              title: photo.title,
              mainImage: photoFilename,
              category: photo.category
            };
            const additionalPhotoElement = createPhotoElement(additionalPhoto);
            galleryContainer.appendChild(additionalPhotoElement);
          });
        }
      });
    })
    .catch(error => {
      console.error('Error fetching photos:', error);
      galleryContainer.innerHTML = `<div class="error">Error loading photos: ${error.message}</div>`;
    });
}

function createPhotoElement(photo) {
  const photoDiv = document.createElement('div');
  photoDiv.className = 'photo-item';
  
  const img = document.createElement('img');
  // Use the full backend URL for images
  img.src = `${BACKEND_URL}/assets/images/${photo.mainImage}`;
  img.alt = photo.title;
  img.className = 'photo';
  
  const caption = document.createElement('div');
  caption.className = 'photo-caption';
  caption.textContent = photo.title;
  
  photoDiv.appendChild(img);
  photoDiv.appendChild(caption);
  
  // Add click event to enlarge photo
  img.addEventListener('click', function() {
    enlargePhoto(this);
  });
  
  return photoDiv;
}

// Function to filter photos by category
function filterPhotosByCategory(category) {
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  loadPhotoGallery(category);
}

// Function to load all photos
function loadAllPhotos() {
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  loadPhotoGallery();
}
// ===== END NEW PHOTO GALLERY FUNCTIONS =====

// Initialize audio when DOM is ready with enhanced photo modal support
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing audio and photo modal support');
  
  globalAudio.volume = 0.4;
  globalAudio.loop = false; // Disable loop since we're doing playlist progression
  
  // Initialize current song index
  currentSongIndex = playlist.indexOf(currentSong);
  if (currentSongIndex === -1) {
    console.warn('Current song not found in playlist, defaulting to index 0');
    currentSongIndex = 0;
    currentSong = playlist[0];
  }
  
  console.log('Initial song:', currentSong, 'Index:', currentSongIndex);
  console.log('Full playlist:', playlist);
  
  // Update all audio sources to use backend URL
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    // Get the current source
    const source = audio.querySelector('source');
    if (source) {
      const src = source.getAttribute('src');
      // Update to use backend URL if it's a local asset
      if (src.startsWith('/assets/') || src.startsWith('assets/')) {
        const filename = src.split('/').pop();
        source.setAttribute('src', `${BACKEND_URL}/assets/audio/${filename}`);
      }
    }
    
    // Set volume for all audio elements
    audio.volume = 0.3;
    audio.loop = false;
  });
  
  // Update all image sources to use backend URL
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    // Update to use backend URL if it's a local asset
    if (src.startsWith('/assets/') || src.startsWith('assets/')) {
      const filename = src.split('/').pop();
      img.setAttribute('src', `${BACKEND_URL}/assets/images/${filename}`);
    }
  });
  
  // Update video sources to use backend URL
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    const source = video.querySelector('source');
    if (source) {
      const src = source.getAttribute('src');
      // Update to use backend URL if it's a local asset
      if (src.startsWith('/assets/') || src.startsWith('assets/')) {
        const filename = src.split('/').pop();
        source.setAttribute('src', `${BACKEND_URL}/assets/videos/${filename}`);
      }
    }
  });
  
  // Add enhanced touch and click support for photos
  const photos = document.querySelectorAll('.photo');
  photos.forEach(photo => {
    // Touch support for mobile devices
    photo.addEventListener('touchend', function(e) {
      e.preventDefault();
      enlargePhoto(this);
    });
    
    // Click support for desktop
    photo.addEventListener('click', function(e) {
      e.preventDefault();
      enlargePhoto(this);
    });
    
    // Prevent image dragging
    photo.draggable = false;
  });
  
  // Enhanced photo modal event listener
  const enlargedPhoto = document.getElementById('enlargedPhoto');
  if (enlargedPhoto) {
    // Prevent closing when clicking directly on the enlarged photo
    enlargedPhoto.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Prevent image dragging
    enlargedPhoto.draggable = false;
  }
  
  // Load photo gallery if the container exists
  loadPhotoGallery();
  
  console.log('Photo modal initialization complete');
});