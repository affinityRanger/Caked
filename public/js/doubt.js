// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// Audio context for Web Audio API
let audioContext = null;
let currentAudio = null;
let nextAudio = null;
let currentPlayingElement = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let crossfadeInterval = null;

// Feature states
let cachedTracks = new Set();
let isOffline = false;
let expandedMedia = null;
let currentVideo = null;

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            setupAudioAnalyser();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    return audioContext;
}

// Setup audio analyser for visualization
function setupAudioAnalyser() {
    if (!audioContext) return;
    
    try {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Create visualizer bars
        createVisualizer();
    } catch (error) {
        console.log('Audio analyser setup failed:', error);
    }
}

// Create audio visualizer
function createVisualizer() {
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    visualizer.id = 'audioVisualizer';
    
    // Create 32 bars for visualization
    for (let i = 0; i < 32; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.height = '2px';
        visualizer.appendChild(bar);
    }
    
    document.body.appendChild(visualizer);
}

// Update audio visualization
function updateVisualization() {
    if (!analyser || !dataArray) return;
    
    analyser.getByteFrequencyData(dataArray);
    const visualizer = document.getElementById('audioVisualizer');
    const bars = visualizer?.querySelectorAll('.visualizer-bar');
    
    if (bars) {
        bars.forEach((bar, index) => {
            const value = dataArray[index * 2] || 0;
            const height = Math.max(2, (value / 255) * 60);
            bar.style.height = height + 'px';
        });
    }
    
    animationId = requestAnimationFrame(updateVisualization);
}

// Start visualization
function startVisualization() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.classList.add('active');
        updateVisualization();
    }
}

// Stop visualization
function stopVisualization() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.classList.remove('active');
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Crossfade between tracks
function crossfadeToNext(currentElement, nextElement, duration = 2000) {
    if (!currentElement || !nextElement) return;
    
    const steps = 50;
    const stepDuration = duration / steps;
    let step = 0;
    
    // Clear any existing crossfade
    if (crossfadeInterval) {
        clearInterval(crossfadeInterval);
    }
    
    crossfadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Fade out current, fade in next
        if (currentElement.volume !== undefined) {
            currentElement.volume = Math.max(0, 0.3 * (1 - progress));
        }
        if (nextElement.volume !== undefined) {
            nextElement.volume = Math.min(0.3, 0.3 * progress);
        }
        
        if (step >= steps) {
            clearInterval(crossfadeInterval);
            crossfadeInterval = null;
            
            // Stop the previous track
            currentElement.pause();
            currentElement.currentTime = 0;
        }
    }, stepDuration);
}

// Typing effect message
function showTypingMessage(text, duration = 3000) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-text';
    
    const textSpan = document.createElement('span');
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.innerHTML = '|';
    
    typingDiv.appendChild(textSpan);
    typingDiv.appendChild(cursor);
    document.body.appendChild(typingDiv);
    
    // Show the container
    setTimeout(() => typingDiv.classList.add('show'), 100);
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            textSpan.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            // Hide after duration
            setTimeout(() => {
                typingDiv.classList.remove('show');
                setTimeout(() => {
                    if (typingDiv.parentNode) {
                        typingDiv.remove();
                    }
                }, 300);
            }, duration);
        }
    }, 100);
}

// Offline mode functionality
function checkOfflineStatus() {
    isOffline = !navigator.onLine;
    const indicator = document.getElementById('offlineIndicator');
    
    if (isOffline) {
        if (!indicator) {
            createOfflineIndicator();
        }
        document.getElementById('offlineIndicator')?.classList.add('show');
        showTypingMessage('You are now offline. Playing cached content...');
    } else {
        document.getElementById('offlineIndicator')?.classList.remove('show');
    }
}

// Create offline indicator
function createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.id = 'offlineIndicator';
    indicator.innerHTML = '📴 Offline Mode';
    document.body.appendChild(indicator);
}

// Cache audio for offline use
function cacheAudio(audioId) {
    const audio = document.getElementById(audioId);
    if (audio && !cachedTracks.has(audioId)) {
        // Simulate caching by preloading
        audio.preload = 'auto';
        audio.load();
        cachedTracks.add(audioId);
        console.log(`Cached: ${audioId}`);
    }
}

// Create falling tears
function createTear() {
    const tear = document.createElement('div');
    tear.className = 'tear';
    tear.innerHTML = '💧';
    tear.style.left = Math.random() * 100 + '%';
    tear.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.body.appendChild(tear);
    
    setTimeout(() => {
        if (tear.parentNode) {
            tear.remove();
        }
    }, 4000);
}

// Create tears periodically
setInterval(createTear, 800);

// Go back to landing page
function goBackToMain() {
    stopAllAudio();
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// Show message modal
function showMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Hide message modal
function hideMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Show placeholder if image fails to load
function showPlaceholder(num) {
    const frame = document.getElementById(`imageFrame${num}`);
    if (frame) {
        const img = frame.querySelector('img');
        const video = frame.querySelector('video');
        const placeholder = frame.querySelector('.placeholder');
        
        if (img) img.style.display = 'none';
        if (video) video.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// Check if media source is video
function isVideoSource(src) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
    return videoExtensions.some(ext => src.toLowerCase().includes(ext));
}

// Auto-detect and setup video elements
function autoDetectVideos() {
    // Get all frames
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach((frame, index) => {
        // Check if frame already has video
        let video = frame.querySelector('video');
        if (video) {
            setupVideoElement(video, frame);
            return;
        }
        
        // Check if frame has image with video extension
        const img = frame.querySelector('img');
        if (img && isVideoSource(img.src)) {
            convertImageToVideo(img, frame);
        }
    });
}

// Convert image element to video if it's actually a video
function convertImageToVideo(img, frame) {
    const video = document.createElement('video');
    video.src = img.src;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    
    // Add error handling
    video.onerror = () => {
        // If video fails to load, keep the image
        console.log('Video failed to load, keeping image:', img.src);
    };
    
    video.onloadedmetadata = () => {
        // Video loaded successfully, replace image
        img.style.display = 'none';
        frame.insertBefore(video, frame.firstChild);
        setupVideoElement(video, frame);
        console.log('Video loaded and replaced image:', video.src);
    };
    
    // Try to load the video
    video.load();
}

// Setup video element with proper handling
function setupVideoElement(video, frame) {
    if (!video || !frame) return;
    
    // Ensure video plays inline and is muted for autoplay
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';
    
    // Handle video interactions
    video.addEventListener('click', (e) => {
        e.stopPropagation();
        expandMedia(frame.id);
    });
    
    // Auto-play when video comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.play().catch(e => console.log('Video autoplay failed:', e));
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(video);
    
    // Try to start playing immediately
    setTimeout(() => {
        video.play().catch(e => console.log('Video autoplay failed:', e));
    }, 100);
}

// Expand media (image/video) on click
function expandMedia(frameId) {
    const frame = document.getElementById(frameId);
    if (!frame || expandedMedia) return; // Prevent multiple expansions
    
    const img = frame.querySelector('img');
    const video = frame.querySelector('video');
    const mediaElement = video && video.style.display !== 'none' ? video : img;
    
    if (!mediaElement || mediaElement.style.display === 'none') return;
    
    // Get frame position and decide popup position
    const frameRect = frame.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate popup position (slightly diagonal from original)
    const popupSize = window.innerWidth <= 768 ? 280 : 350;
    const offset = 40;
    
    let popupX, popupY;
    
    // Determine best position based on frame location
    if (frameRect.right + popupSize + offset < viewportWidth) {
        // Show to the right and slightly down
        popupX = frameRect.right + offset;
        popupY = frameRect.top + offset;
    } else if (frameRect.left - popupSize - offset > 0) {
        // Show to the left and slightly down
        popupX = frameRect.left - popupSize - offset;
        popupY = frameRect.top + offset;
    } else if (frameRect.bottom + popupSize + offset < viewportHeight) {
        // Show below and slightly to the right
        popupX = frameRect.left + offset;
        popupY = frameRect.bottom + offset;
    } else {
        // Show above and slightly to the right
        popupX = frameRect.left + offset;
        popupY = frameRect.top - popupSize - offset;
    }
    
    // Ensure popup stays within viewport
    popupX = Math.max(20, Math.min(popupX, viewportWidth - popupSize - 20));
    popupY = Math.max(20, Math.min(popupY, viewportHeight - popupSize - 20));
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'media-popup';
    popup.style.cssText = `
        position: fixed;
        top: ${popupY}px;
        left: ${popupX}px;
        width: ${popupSize}px;
        height: ${popupSize}px;
        background: rgba(10, 10, 10, 0.95);
        border: 3px solid #ff1744;
        border-radius: 20px;
        backdrop-filter: blur(15px);
        box-shadow: 0 15px 35px rgba(255, 23, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 150;
        opacity: 0;
        transform: scale(0.3) rotate(-5deg);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
        cursor: pointer;
    `;
    
    // Create expanded media element
    let expandedElement;
    if (video && video.style.display !== 'none') {
        // Stop all audio when video is expanded
        stopAllAudio();
        
        expandedElement = document.createElement('video');
        expandedElement.src = video.src || video.querySelector('source')?.src;
        expandedElement.controls = true;
        expandedElement.autoplay = true;
        expandedElement.loop = video.loop;
        expandedElement.volume = 0.6;
        expandedElement.muted = false; // Unmute for expanded view
        currentVideo = expandedElement;
        
        // Handle video audio - stop all other audio when video plays
        expandedElement.addEventListener('play', () => {
            stopAllAudio();
            showTypingMessage('Playing video... 🎬');
        });
        
        expandedElement.addEventListener('ended', () => {
            currentVideo = null;
        });
        
        expandedElement.addEventListener('pause', () => {
            if (expandedElement.currentTime === expandedElement.duration) {
                currentVideo = null;
            }
        });
    } else {
        // It's an image
        expandedElement = document.createElement('img');
        expandedElement.src = mediaElement.src;
        expandedElement.alt = mediaElement.alt;
    }
    
    expandedElement.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 17px;
    `;
    
    // Close button (smaller for mini popup)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 23, 68, 0.9);
        border: none;
        color: white;
        font-size: 1.2rem;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 151;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 23, 68, 1)';
        closeBtn.style.transform = 'scale(1.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 23, 68, 0.9)';
        closeBtn.style.transform = 'scale(1)';
    });
    
    // Add elements to popup
    popup.appendChild(expandedElement);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
    
    expandedMedia = popup;
    
    // Show with smooth animation
    requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1) rotate(0deg)';
    });
    
    // Add subtle floating animation
    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.animation = 'floatPopup 3s ease-in-out infinite';
        }
    }, 400);
    
    // Create floating animation
    if (!document.getElementById('floatPopupStyle')) {
        const style = document.createElement('style');
        style.id = 'floatPopupStyle';
        style.textContent = `
            @keyframes floatPopup {
                0%, 100% { transform: scale(1) rotate(0deg) translateY(0px); }
                50% { transform: scale(1) rotate(1deg) translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close functionality
    const closeMedia = () => {
        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }
        
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.3) rotate(-5deg)';
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
            expandedMedia = null;
        }, 400);
    };
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMedia();
    });
    
    popup.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMedia();
    });
    
    // Auto-close after 10 seconds if it's an image (not video)
    if (!video || video.style.display === 'none') {
        setTimeout(() => {
            if (expandedMedia === popup) {
                closeMedia();
            }
        }, 10000);
    }
    
    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeMedia();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Setup media frame (image or video)
function setupMediaFrame(frameId, mediaSrc, altText) {
    const frame = document.getElementById(frameId);
    if (!frame || !mediaSrc) return;
    
    // Clear existing content except placeholder
    const existingMedia = frame.querySelectorAll('img:not(.placeholder), video');
    existingMedia.forEach(el => el.remove());
    
    let mediaElement;
    if (isVideoSource(mediaSrc)) {
        // Create video element
        mediaElement = document.createElement('video');
        mediaElement.src = mediaSrc;
        mediaElement.muted = true; // Muted by default until expanded
        mediaElement.loop = true;
        mediaElement.autoplay = true;
        mediaElement.playsInline = true;
        mediaElement.preload = 'metadata';
        
        // Add video-specific styling
        mediaElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        
        // Handle video loading errors
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
        
        // Setup video when loaded
        mediaElement.onloadedmetadata = () => {
            setupVideoElement(mediaElement, frame);
        };
    } else {
        // Create image element
        mediaElement = document.createElement('img');
        mediaElement.src = mediaSrc;
        mediaElement.alt = altText || 'Memory';
        mediaElement.loading = 'lazy';
        
        // Add image-specific styling
        mediaElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        
        // Handle image loading errors
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
    }
    
    frame.appendChild(mediaElement);
    
    // Make frame clickable for expansion
    frame.style.cursor = 'pointer';
    frame.addEventListener('click', () => expandMedia(frameId));
}

// Stop all audio
function stopAllAudio() {
    // Stop current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Stop next audio if crossfading
    if (nextAudio) {
        nextAudio.pause();
        nextAudio.currentTime = 0;
        nextAudio = null;
    }
    
    // Stop any playing video
    if (currentVideo) {
        currentVideo.pause();
    }
    
    // Clear crossfade interval
    if (crossfadeInterval) {
        clearInterval(crossfadeInterval);
        crossfadeInterval = null;
    }
    
    // Reset visual states
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing', 'pulsing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.classList.remove('playing', 'beating');
    }
    
    stopVisualization();
    hideAudioStatus();
    currentPlayingElement = null;
}

// Show audio status
function showAudioStatus(message) {
    const status = document.getElementById('audioStatus');
    if (status) {
        status.textContent = message;
        status.classList.add('show');
        
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                hideAudioStatus();
            }, 3000);
        }
    }
}

// Hide audio status
function hideAudioStatus() {
    const status = document.getElementById('audioStatus');
    if (status) {
        status.classList.remove('show');
    }
}

// Play audio with enhanced features
function playAudioWithFallback(audioElement, title, visualElement) {
    if (!audioElement) {
        console.log('Audio element not found');
        return;
    }
    
    // If same track is playing, stop it
    if (currentAudio === audioElement) {
        stopAllAudio();
        return;
    }
    
    // Cache the track
    cacheAudio(audioElement.id);
    
    // Handle crossfade if another track is playing
    if (currentAudio && currentAudio !== audioElement) {
        nextAudio = audioElement;
        crossfadeToNext(currentAudio, nextAudio);
    } else {
        stopAllAudio();
    }
    
    currentAudio = audioElement;
    currentPlayingElement = visualElement;
    
    // Add visual feedback
    if (visualElement) {
        visualElement.classList.add('playing');
        if (visualElement.classList.contains('music-chaos')) {
            visualElement.classList.add('pulsing');
        }
        if (visualElement.id === 'mainHeart') {
            visualElement.classList.add('beating');
        }
    }
    
    // Connect to analyser for visualization
    if (audioContext && analyser && !audioElement.connected) {
        try {
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            audioElement.connected = true;
        } catch (error) {
            console.log('Audio connection failed:', error);
        }
    }
    
    showAudioStatus(`🎵 ${title}`);
    startVisualization();
    
    const isMobile = window.innerWidth <= 768;
    audioElement.volume = isMobile ? 0.4 : 0.3;
    
    // Try to play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('Audio playing:', title);
            
            // Add haptic feedback on mobile if available
            if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            showTypingMessage(`🎵 Now playing: ${title}`);
        }).catch(error => {
            console.log('Audio play failed:', error);
            showAudioStatus(`🎵 ${title} (Loading...)`);
        });
    }
    
    // Handle audio end
    audioElement.onended = () => {
        if (visualElement) {
            visualElement.classList.remove('playing', 'pulsing', 'beating');
        }
        stopVisualization();
        hideAudioStatus();
        currentAudio = null;
        currentPlayingElement = null;
        showTypingMessage('Track ended');
    };
    
    // Handle audio error
    audioElement.onerror = () => {
        showAudioStatus(`🎵 ${title} (Error loading)`);
        setTimeout(() => {
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing', 'beating');
            }
            hideAudioStatus();
            stopVisualization();
        }, 2000);
    };
}

// Music functionality with updated track list
function playMusic(num) {
    preloadAudioOnDemand(`musicAudio${num}`);
    
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    const titles = [
        "Amy Winehouse - Back To Black",
        "Don Toliver - Easy",
        "Juice WRLD - Faded", 
        "All Out - Juice WRLD"
    ];
    
    playAudioWithFallback(audioElement, titles[num - 1], buttonElement);
    createMusicExplosion(buttonElement);
}

// Main heart music
function playMainMusic() {
    const audioElement = document.getElementById('mainHeartAudio');
    const heartElement = document.getElementById('mainHeart');
    
    playAudioWithFallback(audioElement, "You've Been Missed - PARTYNEXTDOOR", heartElement);
    createHeartExplosion();
}

// Create heart explosion effect
function createHeartExplosion() {
    const heartCount = window.innerWidth <= 768 ? 6 : 10;
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💔';
            heart.style.position = 'absolute';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.fontSize = window.innerWidth <= 768 ? '2rem' : '3rem';
            heart.style.zIndex = '15';
            heart.style.pointerEvents = 'none';
            heart.style.color = '#ff1744';
            heart.style.filter = 'drop-shadow(0 0 20px rgba(255, 23, 68, 0.8))';
            
            const angle = (360 / heartCount) * i;
            const distance = window.innerWidth <= 768 ? 150 : 200 + Math.random() * 100;
            const radians = angle * Math.PI / 180;
            
            heart.style.animation = `explodeHeart${i} 2s ease-out forwards`;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes explodeHeart${i} {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) 
                                   translate(${Math.cos(radians) * distance}px, 
                                            ${Math.sin(radians) * distance}px) 
                                   rotate(720deg) scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 2000);
        }, i * 100);
    }
}

// Create music explosion effect
function createMusicExplosion(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const noteCount = window.innerWidth <= 768 ? 3 : 5;
    
    for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            const notes = ['🎵', '🎶', '🎼', '🎤', '🎧'];
            note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
            note.style.position = 'fixed';
            note.style.left = centerX + 'px';
            note.style.top = centerY + 'px';
            note.style.fontSize = window.innerWidth <= 768 ? '1.5rem' : '2rem';
            note.style.zIndex = '15';
            note.style.pointerEvents = 'none';
            note.style.color = '#ff1744';
            
            const angle = Math.random() * 360;
            const distance = window.innerWidth <= 768 ? 80 : 100 + Math.random() * 50;
            const radians = angle * Math.PI / 180;
            
            note.style.animation = `explodeNote${i}-${Date.now()} 1.5s ease-out forwards`;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes explodeNote${i}-${Date.now()} {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) 
                                   translate(${Math.cos(radians) * distance}px, 
                                            ${Math.sin(radians) * distance}px) 
                                   scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(note);
            
            setTimeout(() => {
                if (note.parentNode) {
                    note.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 1500);
        }, i * 150);
    }
}

// Random glitch effects
setInterval(() => {
    const elements = document.querySelectorAll('.chaos-text, .image-frame, .video-frame');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];
    if (randomElement) {
        randomElement.classList.add('glitch');
        
        setTimeout(() => {
            randomElement.classList.remove('glitch');
        }, window.innerWidth <= 768 ? 500 : 1000);
    }
}, window.innerWidth <= 768 ? 5000 : 3000);

// Preload audio on demand
function preloadAudioOnDemand(audioId) {
    const audio = document.getElementById(audioId);
    if (audio && audio.preload === 'none') {
        audio.preload = 'auto';
        audio.load();
    }
}

// Mobile touch handling
function addTouchSupport() {
    const elements = document.querySelectorAll('.music-chaos, #mainHeart, .back-button, .message-icon, .image-frame, .video-frame');
    
    elements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Check offline status
    checkOfflineStatus();
    window.addEventListener('online', checkOfflineStatus);
    window.addEventListener('offline', checkOfflineStatus);
    
    // Add mobile touch support
    addTouchSupport();
    
    // Auto-detect and setup videos
    setTimeout(() => {
        autoDetectVideos();
    }, 500);
    
    // Set up event listeners
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            goBackToMain();
        });
        console.log('Back button listener added');
    }
    
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showMessage();
        });
        console.log('Message icon listener added');
    }
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            playMainMusic();
        });
        console.log('Main heart listener added');
    }
    
    // Set up music buttons
    for (let i = 1; i <= 4; i++) {
        const musicBtn = document.getElementById(`musicBtn${i}`);
        if (musicBtn) {
            musicBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Music button ${i} clicked`);
                playMusic(i);
            });
            console.log(`Music button ${i} listener added`);
        }
    }
    
    // Close message modal when clicking outside
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        messageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideMessage();
            }
        });
        
        const closeMessage = document.querySelector('.close-message');
        if (closeMessage) {
            closeMessage.addEventListener('click', hideMessage);
        }
    }
    
    // Set up media frame click handlers
    const mediaFrames = document.querySelectorAll('.image-frame, .video-frame');
    mediaFrames.forEach(frame => {
        frame.style.cursor = 'pointer';
        frame.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            expandMedia(this.id);
        });
        console.log(`Media frame ${frame.id} click listener added`);
    });
    
    // Initialize media frames with existing media sources
    const mediaData = [
        { id: 'imageFrame1', src: 'https://caked-production.up.railway.app/assets/images/sikununuli.png', alt: 'Our memories' },
        { id: 'imageFrame2', src: 'https://caked-production.up.railway.app/assets/images/psychosis.png', alt: 'Our special moment' },
        { id: 'imageFrame3', src: 'https://caked-production.up.railway.app/assets/images/gal.png', alt: 'Missing this' },
        { id: 'imageFrame4', src: 'https://caked-production.up.railway.app/assets/images/lost.png', alt: 'Your beauty' },
        { id: 'imageFrame5', src: 'https://caked-production.up.railway.app/assets/videos/tilapia.mp4', alt: 'Lonely times' }
    ];
    
    // Setup each media frame (will auto-detect if it's video or image)
    mediaData.forEach(media => {
        setTimeout(() => setupMediaFrame(media.id, media.src, media.alt), 100);
    });
    
    // Initialize audio context
    initAudioContext();
    
    // Optimize audio loading
    const mainAudio = document.getElementById('mainHeartAudio');
    if (mainAudio) {
        mainAudio.preload = 'auto';
        cacheAudio('mainHeartAudio');
    }
    
    // Set other audio files to load only when needed
    for (let i = 1; i <= 4; i++) {
        const audio = document.getElementById(`musicAudio${i}`);
        if (audio) {
            audio.preload = 'none';
            audio.volume = window.innerWidth <= 768 ? 0.4 : 0.3;
        }
    }
    
    // Show welcome message
    setTimeout(() => {
        showTypingMessage('Welcome to the chaos of doubt... 💔');
    }, 1000);
    
    // Handle orientation changes on mobile
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            const viewport = document.querySelector('meta[name=viewport]');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        }, 500);
    });
    
    console.log('Initialization complete');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideMessage();
        stopAllAudio();
        // Close expanded media if open
        if (expandedMedia) {
            const closeBtn = expandedMedia.querySelector('button');
            if (closeBtn) closeBtn.click();
        }
    }
    if (e.key === 'm' || e.key === 'M') {
        showMessage();
    }
    if (e.key === ' ') {
        e.preventDefault();
        stopAllAudio();
    }
});

// Handle user interaction to enable audio context
document.addEventListener('click', function() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// Prevent right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Add touch support for mobile devices
document.addEventListener('touchstart', function() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);