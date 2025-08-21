// Backend URL configuration
const BACKEND_URL = 'https://caked-production.up.railway.app';

// Global variables
let audioContext = null;
let currentAudio = null;
let nextAudio = null;
let currentPlayingElement = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let crossfadeInterval = null;
let isInitialLoad = true;

// Feature states
let cachedTracks = new Set();
let isOffline = false;
let expandedMedia = null;
let currentVideo = null;
let audioStateBeforeVideo = null;
let heartBeating = false;

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            setupAudioAnalyser();
            console.log('Audio context initialized');
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
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        createVisualizer();
        console.log('Audio analyser setup complete');
    } catch (error) {
        console.log('Audio analyser setup failed:', error);
    }
}

// Preload all audio elements with better error handling
function preloadAllAudio() {
    const audioIds = ['mainHeartAudio', 'musicAudio1', 'musicAudio2', 'musicAudio3', 'musicAudio4'];
    
    audioIds.forEach(audioId => {
        const audio = document.getElementById(audioId);
        if (audio) {
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous'; // Add this for CORS
            audio.load();
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`${audioId} ready to play`);
                cachedTracks.add(audioId);
            });
            
            audio.addEventListener('error', (e) => {
                console.log(`${audioId} failed to load:`, e);
            });
            
            const isMobile = window.innerWidth <= 768;
            audio.volume = isMobile ? 0.4 : 0.3;
        } else {
            console.warn(`Audio element ${audioId} not found in DOM`);
        }
    });
}

// Create audio visualizer
function createVisualizer() {
    if (document.getElementById('audioVisualizer')) return;
    
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    visualizer.id = 'audioVisualizer';
    visualizer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 60px;
        z-index: 50;
        pointer-events: none;
    `;
    
    for (let i = 0; i < 64; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.cssText = `
            width: 3px;
            height: 2px;
            background-color: hsl(${340 + (i * 2)}, 100%, ${50 + (i % 20)}%);
            transition: all 0.1s ease;
            border-radius: 2px 2px 0 0;
        `;
        visualizer.appendChild(bar);
    }
    
    document.body.appendChild(visualizer);
}

// Enhanced play audio function with better error handling
function playAudioWithFallback(audioElement, title, visualElement) {
    console.log('=== PLAY AUDIO DEBUG ===');
    console.log('Audio element:', audioElement);
    console.log('Title:', title);
    console.log('Visual element:', visualElement);
    
    if (!audioElement) {
        console.error('Audio element is null or undefined');
        showTypingMessage('Audio not available');
        return;
    }
    
    // Initialize audio context if not already done
    if (!audioContext) {
        initAudioContext();
    }
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
            playAudioWithFallback(audioElement, title, visualElement);
        });
        return;
    }
    
    console.log('Audio element ready state:', audioElement.readyState);
    console.log('Audio element src:', audioElement.src);
    
    // Handle visual element states
    if (visualElement) {
        console.log('Setting up visual element:', visualElement.id);
        
        if (visualElement.id === 'mainHeart') {
            if (currentAudio === audioElement && !audioElement.paused) {
                console.log('Same heart track playing, stopping it');
                stopAllAudio();
                heartBeating = false;
                return;
            } else {
                heartBeating = true;
            }
        }
        
        // Clear other playing states
        document.querySelectorAll('.music-chaos, #mainHeart').forEach(el => {
            if (el !== visualElement) {
                el.classList.remove('playing', 'pulsing');
            }
        });
        
        visualElement.classList.add('playing');
        if (visualElement.id === 'mainHeart') {
            visualElement.classList.add('beating');
        }
    }
    
    // Wait for audio to be ready if needed
    if (audioElement.readyState < 2) {
        showTypingMessage('Loading audio...');
        console.log('Audio not ready, waiting...');
        
        const loadHandler = () => {
            audioElement.removeEventListener('canplaythrough', loadHandler);
            audioElement.removeEventListener('error', errorHandler);
            playAudioWithFallback(audioElement, title, visualElement);
        };
        
        const errorHandler = (e) => {
            console.error('Audio loading error:', e);
            audioElement.removeEventListener('canplaythrough', loadHandler);
            audioElement.removeEventListener('error', errorHandler);
            showTypingMessage('Audio failed to load');
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing', 'beating');
            }
        };
        
        audioElement.addEventListener('canplaythrough', loadHandler);
        audioElement.addEventListener('error', errorHandler);
        return;
    }
    
    // Stop previous audio if playing same track
    if (currentAudio === audioElement && !audioElement.paused) {
        console.log('Same track playing, stopping it');
        stopAllAudio();
        if (visualElement?.id === 'mainHeart') {
            heartBeating = false;
        }
        return;
    }
    
    // Handle crossfade or stop other audio
    if (currentAudio && currentAudio !== audioElement && !currentAudio.paused) {
        console.log('Another track playing, starting crossfade');
        nextAudio = audioElement;
        crossfadeToNext(currentAudio, nextAudio);
    } else {
        stopAllAudio(false);
    }
    
    currentAudio = audioElement;
    currentPlayingElement = visualElement;
    
    // Connect to audio analyser
    if (audioContext && analyser && !audioElement.connected) {
        try {
            if (audioElement.sourceNode) {
                audioElement.sourceNode.disconnect();
            }
            
            audioElement.sourceNode = audioContext.createMediaElementSource(audioElement);
            audioElement.sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioElement.connected = true;
            console.log('Audio connected to analyser');
        } catch (error) {
            console.log('Audio connection failed (may already be connected):', error);
        }
    }
    
    showAudioStatus(`🎵 ${title}`);
    startVisualization();
    
    const isMobile = window.innerWidth <= 768;
    audioElement.volume = isMobile ? 0.4 : 0.3;
    audioElement.currentTime = 0;
    
    console.log('Attempting to play audio...');
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('✅ Audio playing successfully:', title);
            
            if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            showTypingMessage(`🎵 Now playing: ${title}`);
        }).catch(error => {
            console.error('❌ Audio play failed:', error);
            showTypingMessage('Audio playback failed - try clicking again');
            
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing');
                if (visualElement.id !== 'mainHeart' || !heartBeating) {
                    visualElement.classList.remove('beating');
                }
            }
            stopVisualization();
            hideAudioStatus();
            currentAudio = null;
            currentPlayingElement = null;
        });
    }
    
    // Setup event handlers
    audioElement.onended = () => {
        console.log('Audio ended:', title);
        if (visualElement) {
            visualElement.classList.remove('playing', 'pulsing');
            if (visualElement.id === 'mainHeart') {
                heartBeating = true; // Keep heart beating
            } else {
                visualElement.classList.remove('beating');
            }
        }
        stopVisualization();
        hideAudioStatus();
        currentAudio = null;
        currentPlayingElement = null;
        showTypingMessage('Track ended');
    };
    
    audioElement.onerror = (e) => {
        console.error('Audio error:', title, e);
        showTypingMessage('Audio error occurred');
        setTimeout(() => {
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing');
                if (visualElement.id !== 'mainHeart' || !heartBeating) {
                    visualElement.classList.remove('beating');
                }
            }
            hideAudioStatus();
            stopVisualization();
            currentAudio = null;
            currentPlayingElement = null;
        }, 2000);
    };
}

// Music functionality with better debugging
function playMusic(num) {
    console.log('=== MUSIC BUTTON DEBUG ===');
    console.log('Music button clicked:', num);
    
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    
    console.log('Audio element found:', !!audioElement);
    console.log('Button element found:', !!buttonElement);
    
    if (audioElement) {
        console.log('Audio src:', audioElement.src);
        console.log('Audio ready state:', audioElement.readyState);
    }
    
    const titles = [
        "Amy Winehouse - Back To Black",
        "Don Toliver - Easy",
        "Juice WRLD - Faded", 
        "All Out - Juice WRLD"
    ];
    
    if (!audioElement || !buttonElement) {
        console.error('Missing elements - Audio:', !!audioElement, 'Button:', !!buttonElement);
        showTypingMessage('Audio element not found');
        return;
    }
    
    playAudioWithFallback(audioElement, titles[num - 1], buttonElement);
    createMusicExplosion(buttonElement);
}

// Main heart music with better debugging
function playMainMusic() {
    console.log('=== HEART BUTTON DEBUG ===');
    console.log('Main heart clicked');
    
    const audioElement = document.getElementById('mainHeartAudio');
    const heartElement = document.getElementById('mainHeart');
    
    console.log('Heart audio element found:', !!audioElement);
    console.log('Heart visual element found:', !!heartElement);
    
    if (audioElement) {
        console.log('Heart audio src:', audioElement.src);
        console.log('Heart audio ready state:', audioElement.readyState);
    }
    
    if (!audioElement || !heartElement) {
        console.error('Missing heart elements - Audio:', !!audioElement, 'Visual:', !!heartElement);
        showTypingMessage('Heart audio not found');
        return;
    }
    
    playAudioWithFallback(audioElement, "You've Been Missed - PARTYNEXTDOOR", heartElement);
    createHeartExplosion();
}

// Enhanced expand media function with better debugging
function expandMedia(frameId) {
    console.log('=== MEDIA EXPAND DEBUG ===');
    console.log('Attempting to expand media for frame:', frameId);
    
    const frame = document.getElementById(frameId);
    if (!frame) {
        console.error('Frame not found:', frameId);
        return;
    }
    
    if (expandedMedia) {
        console.log('Media already expanded, ignoring');
        return;
    }
    
    const video = frame.querySelector('video');
    const img = frame.querySelector('img:not(.placeholder)');
    
    console.log('Video found:', !!video);
    console.log('Image found:', !!img);
    
    if (video) {
        console.log('Video src:', video.src);
        console.log('Video display:', video.style.display);
    }
    if (img) {
        console.log('Image src:', img.src);
        console.log('Image display:', img.style.display);
    }
    
    let mediaElement = null;
    let isVideo = false;
    
    if (video && video.style.display !== 'none') {
        mediaElement = video;
        isVideo = true;
    } else if (img && img.style.display !== 'none') {
        mediaElement = img;
        isVideo = false;
    }
    
    if (!mediaElement) {
        console.error('No visible media element found in frame:', frameId);
        showTypingMessage('No media found to display');
        return;
    }
    
    console.log('Expanding media type:', isVideo ? 'video' : 'image');
    
    // Rest of the expand media function stays the same...
    const frameRect = frame.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const isMobile = window.innerWidth <= 768;
    
    let popupSize;
    if (isVideo) {
        popupSize = isMobile ? 300 : 450;
    } else {
        popupSize = isMobile ? 280 : 420;
    }
    
    const offset = isMobile ? 20 : 40;
    
    let popupX, popupY;
    
    // Smart positioning based on available space
    if (frameRect.right + popupSize + offset < viewportWidth) {
        popupX = frameRect.right + offset;
        popupY = frameRect.top + offset;
    } else if (frameRect.left - popupSize - offset > 0) {
        popupX = frameRect.left - popupSize - offset;
        popupY = frameRect.top + offset;
    } else if (frameRect.bottom + popupSize + offset < viewportHeight) {
        popupX = frameRect.left + offset;
        popupY = frameRect.bottom + offset;
    } else {
        popupX = frameRect.left + offset;
        popupY = frameRect.top - popupSize - offset;
    }
    
    // Ensure popup stays within viewport
    popupX = Math.max(10, Math.min(popupX, viewportWidth - popupSize - 10));
    popupY = Math.max(10, Math.min(popupY, viewportHeight - popupSize - 10));
    
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
        border-radius: ${isMobile ? '15px' : '20px'};
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
    if (isVideo) {
        console.log('Video starting, stopping all audio');
        stopAllAudio(true);
        
        expandedElement = document.createElement('video');
        expandedElement.src = mediaElement.src || mediaElement.querySelector('source')?.src;
        expandedElement.controls = true;
        expandedElement.autoplay = true;
        expandedElement.loop = mediaElement.loop;
        expandedElement.volume = 0.8;
        expandedElement.muted = false;
        expandedElement.playsInline = true;
        expandedElement.preload = 'metadata';
        currentVideo = expandedElement;
        
        expandedElement.addEventListener('play', () => {
            console.log('Video started playing');
            showTypingMessage('Playing video...');
        });
        
        expandedElement.addEventListener('pause', () => {
            console.log('Video paused');
            if (expandedElement.currentTime < expandedElement.duration - 0.1) {
                showTypingMessage('Video paused');
            }
        });
        
        expandedElement.addEventListener('ended', () => {
            console.log('Video ended, restoring audio');
            currentVideo = null;
            showTypingMessage('Video ended, restoring audio...');
            setTimeout(() => {
                restoreAudioState();
            }, 500);
        });
        
        expandedElement.addEventListener('error', (e) => {
            console.log('Video playback error:', e);
            currentVideo = null;
            showTypingMessage('Video error, restoring audio...');
            setTimeout(() => {
                restoreAudioState();
            }, 500);
        });
    } else {
        expandedElement = document.createElement('img');
        expandedElement.src = mediaElement.src;
        expandedElement.alt = mediaElement.alt || 'Memory';
        
        expandedElement.onload = () => {
            console.log('Image loaded in popup');
        };
        
        expandedElement.onerror = () => {
            console.log('Image failed to load in popup');
            showTypingMessage('Image failed to load');
        };
    }
    
    expandedElement.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: ${isMobile ? '12px' : '17px'};
        display: block;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: ${isMobile ? '8px' : '10px'};
        right: ${isMobile ? '8px' : '10px'};
        background: rgba(255, 23, 68, 0.9);
        border: none;
        color: white;
        font-size: ${isMobile ? '1.2rem' : '1.4rem'};
        width: ${isMobile ? '30px' : '35px'};
        height: ${isMobile ? '30px' : '35px'};
        border-radius: 50%;
        cursor: pointer;
        z-index: 151;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
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
    
    console.log('✅ Media popup created successfully');
    
    // Close functionality
    const closeMedia = () => {
        console.log('Closing media popup');
        if (currentVideo) {
            console.log('Closing video, restoring audio');
            setTimeout(() => {
                restoreAudioState();
            }, 200);
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
        e.preventDefault();
        e.stopPropagation();
        closeMedia();
    });
    
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeMedia();
        }
    });
}

// Enhanced setup media frame function with better event handling
function setupMediaFrame(frameId, mediaSrc, altText) {
    console.log('=== SETUP MEDIA FRAME DEBUG ===');
    console.log('Setting up frame:', frameId, 'with source:', mediaSrc);
    
    const frame = document.getElementById(frameId);
    if (!frame) {
        console.error('Frame not found:', frameId);
        return;
    }
    
    if (!mediaSrc) {
        console.error('No media source provided for frame:', frameId);
        return;
    }
    
    // Clear existing media
    const existingMedia = frame.querySelectorAll('img:not(.placeholder), video');
    existingMedia.forEach(el => el.remove());
    
    let mediaElement;
    if (isVideoSource(mediaSrc)) {
        console.log('Setting up video for frame:', frameId);
        mediaElement = document.createElement('video');
        mediaElement.src = mediaSrc;
        mediaElement.muted = true;
        mediaElement.loop = true;
        mediaElement.autoplay = true;
        mediaElement.playsInline = true;
        mediaElement.preload = 'metadata';
        
        mediaElement.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
            border-radius: 12px;
            display: block;
            position: absolute;
            top: 0;
            left: 0;
        `;
        
        mediaElement.onerror = () => {
            console.error('Video failed to load:', mediaSrc);
            showPlaceholder(frameId.replace('imageFrame', ''));
        };
        
        mediaElement.onloadedmetadata = () => {
            console.log('Video metadata loaded for frame:', frameId);
            setupVideoElement(mediaElement, frame);
        };
    } else {
        console.log('Setting up image for frame:', frameId);
        mediaElement = document.createElement('img');
        mediaElement.src = mediaSrc;
        mediaElement.alt = altText || 'Memory';
        mediaElement.loading = 'lazy';
        
        mediaElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
            display: block;
        `;
        
        mediaElement.onerror = () => {
            console.error('Image failed to load:', mediaSrc);
            showPlaceholder(frameId.replace('imageFrame', ''));
        };
        
        mediaElement.onload = () => {
            console.log('Image loaded for frame:', frameId);
        };
    }
    
    frame.appendChild(mediaElement);
    frame.style.cursor = 'pointer';
    
    // Remove any existing event listeners and add new ones
    const newFrame = frame.cloneNode(true);
    frame.parentNode.replaceChild(newFrame, frame);
    
    // Add click handler with better event handling
    const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Frame clicked:', frameId);
        expandMedia(frameId);
    };
    
    newFrame.addEventListener('click', clickHandler);
    newFrame.addEventListener('touchstart', clickHandler); // Add touch support
    
    console.log('✅ Media frame setup complete:', frameId);
}

// Enhanced initialization with better debugging
function initializeMediaFrames() {
    console.log('=== INITIALIZING MEDIA FRAMES ===');
    
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    console.log('Found frames:', frames.length);
    
    frames.forEach((frame, index) => {
        console.log(`Initializing frame ${index + 1}:`, frame.id);
        
        const img = frame.querySelector('img:not(.placeholder)');
        const video = frame.querySelector('video');
        
        if (video) {
            console.log('Frame has video:', video.src);
            setupVideoElement(video, frame);
        } else if (img) {
            console.log('Frame has image:', img.src);
            frame.style.cursor = 'pointer';
            
            // Remove existing handlers
            frame.onclick = null;
            frame.removeEventListener('click', frame._clickHandler);
            
            // Add new handler
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Image frame clicked:', frame.id);
                expandMedia(frame.id);
            };
            
            frame._clickHandler = clickHandler;
            frame.addEventListener('click', clickHandler);
            frame.addEventListener('touchstart', clickHandler);
        } else {
            console.log('Frame has no media elements');
        }
    });
    
    console.log('✅ Media frames initialization complete');
}

// Rest of your utility functions remain the same...
function stopAllAudio(preserveState = false) {
    console.log('Stopping all audio, preserveState:', preserveState);
    
    if (preserveState) {
        storeAudioState();
    } else {
        audioStateBeforeVideo = null;
    }
    
    if (currentAudio) {
        currentAudio.pause();
        if (!preserveState) {
            currentAudio.currentTime = 0;
        }
        
        try {
            if (currentAudio.sourceNode) {
                currentAudio.sourceNode.disconnect();
                currentAudio.sourceNode = null;
            }
            currentAudio.connected = false;
        } catch (error) {
            console.log('Audio disconnect error:', error);
        }
        
        currentAudio = null;
    }
    
    if (nextAudio) {
        nextAudio.pause();
        nextAudio.currentTime = 0;
        nextAudio = null;
    }
    
    if (crossfadeInterval) {
        clearInterval(crossfadeInterval);
        crossfadeInterval = null;
    }
    
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing', 'pulsing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart && !preserveState) {
        mainHeart.classList.remove('playing');
        if (!heartBeating || !preserveState) {
            mainHeart.classList.remove('beating');
            heartBeating = false;
        }
    }
    
    stopVisualization();
    hideAudioStatus();
    currentPlayingElement = null;
}

function crossfadeToNext(currentElement, nextElement, duration = 2000) {
    if (!currentElement || !nextElement) return;
    
    console.log('Starting crossfade from current to next audio');
    
    const steps = 50;
    const stepDuration = duration / steps;
    let step = 0;
    
    if (crossfadeInterval) {
        clearInterval(crossfadeInterval);
    }
    
    crossfadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        if (currentElement.volume !== undefined) {
            currentElement.volume = Math.max(0, 0.3 * (1 - progress));
        }
        if (nextElement.volume !== undefined) {
            nextElement.volume = Math.min(0.3, 0.3 * progress);
        }
        
        if (step >= steps) {
            clearInterval(crossfadeInterval);
            crossfadeInterval = null;
            
            currentElement.pause();
            currentElement.currentTime = 0;
            
            try {
                if (currentElement.sourceNode) {
                    currentElement.sourceNode.disconnect();
                    currentElement.sourceNode = null;
                }
                currentElement.connected = false;
            } catch (error) {
                console.log('Previous audio cleanup error:', error);
            }
            
            console.log('Crossfade completed');
        }
    }, stepDuration);
}

function updateVisualization() {
    if (!analyser || !dataArray) return;
    
    analyser.getByteFrequencyData(dataArray);
    const visualizer = document.getElementById('audioVisualizer');
    const bars = visualizer?.querySelectorAll('.visualizer-bar');
    
    if (bars) {
        bars.forEach((bar, index) => {
            const dataIndex = Math.floor((index / bars.length) * dataArray.length);
            const value = dataArray[dataIndex] || 0;
            
            const minHeight = 3;
            const maxHeight = 80;
            const height = Math.max(minHeight, (value / 255) * maxHeight);
            
            const currentHeight = parseInt(bar.style.height) || minHeight;
            const targetHeight = height;
            const smoothedHeight = currentHeight + (targetHeight - currentHeight) * 0.3;
            
            bar.style.height = smoothedHeight + 'px';
            
            const intensity = value / 255;
            const hue = 340 + (intensity * 40);
            const saturation = 80 + (intensity * 20);
            const lightness = 40 + (intensity * 30);
            
            bar.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            if (intensity > 0.7) {
                bar.style.boxShadow = `0 0 10px hsl(${hue}, ${saturation}%, ${lightness}%)`;
            } else {
                bar.style.boxShadow = 'none';
            }
        });
    }
    
    animationId = requestAnimationFrame(updateVisualization);
}

function startVisualization() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.classList.add('active');
        
        visualizer.style.background = 'linear-gradient(90deg, rgba(255,23,68,0.1), rgba(255,23,68,0.2), rgba(255,23,68,0.1))';
        visualizer.style.backgroundSize = '200% 100%';
        visualizer.style.animation = 'visualizerPulse 2s ease-in-out infinite';
        
        updateVisualization();
    }
}

function stopVisualization() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.classList.remove('active');
        visualizer.style.background = 'none';
        visualizer.style.animation = 'none';
        
        const bars = visualizer.querySelectorAll('.visualizer-bar');
        bars.forEach(bar => {
            bar.style.height = '2px';
            bar.style.boxShadow = 'none';
        });
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function storeAudioState() {
    if (currentAudio && !currentAudio.paused) {
        audioStateBeforeVideo = {
            audio: currentAudio,
            currentTime: currentAudio.currentTime,
            volume: currentAudio.volume,
            playingElement: currentPlayingElement
        };
        console.log('Audio state stored:', audioStateBeforeVideo);
    }
}

function restoreAudioState() {
    if (audioStateBeforeVideo) {
        console.log('Restoring audio state:', audioStateBeforeVideo);
        
        const { audio, currentTime, volume, playingElement } = audioStateBeforeVideo;
        
        if (audio) {
            currentAudio = audio;
            currentPlayingElement = playingElement;
            
            audio.currentTime = currentTime;
            audio.volume = volume;
            
            if (playingElement) {
                playingElement.classList.add('playing');
                if (playingElement.id === 'mainHeart') {
                    playingElement.classList.add('beating');
                    heartBeating = true;
                }
            }
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    startVisualization();
                    showAudioStatus('🎵 Audio resumed');
                    console.log('Audio resumed successfully');
                }).catch(error => {
                    console.log('Audio resume failed:', error);
                });
            }
        }
        
        audioStateBeforeVideo = null;
    }
}

function createHeartExplosion() {
    const isMobile = window.innerWidth <= 768;
    const heartCount = isMobile ? 6 : 10;
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💔';
            heart.style.position = 'absolute';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.transform = 'translate(-50%, -50%)';
            heart.style.fontSize = isMobile ? '1.5rem' : '2rem';
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '100';
            heart.style.animation = `heartExplode${i} 2s ease-out forwards`;
            
            if (!document.getElementById(`heartExplodeStyle${i}`)) {
                const style = document.createElement('style');
                style.id = `heartExplodeStyle${i}`;
                const angle = (360 / heartCount) * i;
                const distance = isMobile ? 120 : 200;
                style.textContent = `
                    @keyframes heartExplode${i} {
                        0% {
                            transform: translate(-50%, -50%) scale(0.5);
                            opacity: 1;
                        }
                        50% {
                            transform: translate(-50%, -50%) 
                                      translateX(${Math.cos(angle * Math.PI / 180) * distance * 0.7}px)
                                      translateY(${Math.sin(angle * Math.PI / 180) * distance * 0.7}px)
                                      scale(1.2);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(-50%, -50%) 
                                      translateX(${Math.cos(angle * Math.PI / 180) * distance}px)
                                      translateY(${Math.sin(angle * Math.PI / 180) * distance}px)
                                      scale(0.3);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 2000);
        }, i * 100);
    }
}

function createMusicExplosion(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const isMobile = window.innerWidth <= 768;
    const noteCount = isMobile ? 4 : 6;
    const notes = ['🎵', '🎶', '🎼', '🎧'];
    
    for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            note.innerHTML = notes[i % notes.length];
            note.style.position = 'fixed';
            note.style.left = centerX + 'px';
            note.style.top = centerY + 'px';
            note.style.transform = 'translate(-50%, -50%)';
            note.style.fontSize = isMobile ? '1.2rem' : '1.5rem';
            note.style.pointerEvents = 'none';
            note.style.zIndex = '100';
            note.style.animation = `musicExplode${i} 1.5s ease-out forwards`;
            
            if (!document.getElementById(`musicExplodeStyle${i}`)) {
                const style = document.createElement('style');
                style.id = `musicExplodeStyle${i}`;
                const angle = (360 / noteCount) * i;
                const distance = isMobile ? 60 : 80;
                style.textContent = `
                    @keyframes musicExplode${i} {
                        0% {
                            transform: translate(-50%, -50%) scale(0.8);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(-50%, -50%) 
                                      translateX(${Math.cos(angle * Math.PI / 180) * distance}px)
                                      translateY(${Math.sin(angle * Math.PI / 180) * distance}px)
                                      scale(0.3);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(note);
            
            setTimeout(() => {
                if (note.parentNode) {
                    note.remove();
                }
            }, 1500);
        }, i * 50);
    }
}

// Utility functions
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

function hideAudioStatus() {
    const status = document.getElementById('audioStatus');
    if (status) {
        status.classList.remove('show');
    }
}

function handleNetworkStatus(isOnline) {
    if (!isOnline) {
        document.getElementById('offlineIndicator')?.classList.add('show');
        showTypingMessage('You are now offline. Playing cached content...');
    } else {
        document.getElementById('offlineIndicator')?.classList.remove('show');
        if (!isInitialLoad) {
            showTypingMessage('You are back online. Restoring audio...');
        }
    }
}

function showTypingMessage(message, duration = 3000) {
    const existingMessage = document.getElementById('typingMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingMessage';
    typingDiv.className = 'typing-text';
    typingDiv.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(50px);
        background: rgba(255, 23, 68, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        z-index: 200;
        opacity: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(255, 23, 68, 0.3);
    `;
    
    const textSpan = document.createElement('span');
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.innerHTML = '|';
    cursor.style.cssText = `
        animation: blink 1s infinite;
        margin-left: 2px;
    `;
    
    // Add blinking cursor animation if not exists
    if (!document.getElementById('blinkStyle')) {
        const style = document.createElement('style');
        style.id = 'blinkStyle';
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            .typing-text.show {
                opacity: 1 !important;
                transform: translateX(-50%) translateY(0px) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    typingDiv.appendChild(textSpan);
    typingDiv.appendChild(cursor);
    document.body.appendChild(typingDiv);
    
    setTimeout(() => typingDiv.classList.add('show'), 100);
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < message.length) {
            textSpan.innerHTML += message.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            setTimeout(() => {
                typingDiv.classList.remove('show');
                setTimeout(() => {
                    if (typingDiv.parentNode) {
                        typingDiv.remove();
                    }
                }, 300);
            }, duration);
        }
    }, 50);
}

function checkOfflineStatus() {
    isOffline = !navigator.onLine;
    handleNetworkStatus(navigator.onLine);
}

function createOfflineIndicator() {
    if (document.getElementById('offlineIndicator')) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.id = 'offlineIndicator';
    indicator.innerHTML = '📴 Offline Mode';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 165, 0, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 100;
        transform: translateY(-100px);
        transition: transform 0.3s ease;
    `;
    document.body.appendChild(indicator);
}

function cacheAudio(audioId) {
    const audio = document.getElementById(audioId);
    if (audio && !cachedTracks.has(audioId)) {
        audio.preload = 'auto';
        audio.load();
        cachedTracks.add(audioId);
        console.log(`Cached: ${audioId}`);
    }
}

function createTear() {
    const tear = document.createElement('div');
    tear.className = 'tear';
    tear.innerHTML = '💧';
    tear.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${Math.random() * 100}%;
        font-size: 20px;
        z-index: 10;
        pointer-events: none;
        animation: tearFall ${Math.random() * 2 + 2}s linear forwards;
    `;
    
    // Add tear falling animation if not exists
    if (!document.getElementById('tearFallStyle')) {
        const style = document.createElement('style');
        style.id = 'tearFallStyle';
        style.textContent = `
            @keyframes tearFall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(tear);
    
    setTimeout(() => {
        if (tear.parentNode) {
            tear.remove();
        }
    }, 4000);
}

function goBackToMain() {
    stopAllAudio(false);
    
    if (heartBeating) {
        const mainHeart = document.getElementById('mainHeart');
        if (mainHeart) {
            mainHeart.classList.add('beating');
        }
    }
    
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

function showMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideMessage() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showPlaceholder(num) {
    console.log('Showing placeholder for frame:', num);
    const frame = document.getElementById(`imageFrame${num}`);
    if (frame) {
        const img = frame.querySelector('img:not(.placeholder)');
        const video = frame.querySelector('video');
        const placeholder = frame.querySelector('.placeholder');
        
        if (img) img.style.display = 'none';
        if (video) video.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
    }
}

function isVideoSource(src) {
    if (!src) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
    const lowerSrc = src.toLowerCase();
    return videoExtensions.some(ext => lowerSrc.includes(ext));
}

function autoDetectVideos() {
    console.log('Auto-detecting videos...');
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach((frame, index) => {
        console.log(`Checking frame ${index + 1}:`, frame.id);
        
        let video = frame.querySelector('video');
        if (video) {
            console.log('Frame already has video:', video.src);
            setupVideoElement(video, frame);
            return;
        }
        
        const img = frame.querySelector('img:not(.placeholder)');
        if (img && isVideoSource(img.src)) {
            console.log('Converting image to video for frame:', frame.id);
            convertImageToVideo(img, frame);
        }
    });
}

function convertImageToVideo(img, frame) {
    console.log('Converting image to video:', img.src);
    
    const video = document.createElement('video');
    video.src = img.src;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        border-radius: 12px;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
    `;
    
    video.onerror = (e) => {
        console.log('Video conversion failed, keeping image:', img.src, e);
        video.remove();
    };
    
    video.onloadedmetadata = () => {
        console.log('Video conversion successful:', video.src);
        img.style.display = 'none';
        frame.insertBefore(video, frame.firstChild);
        setupVideoElement(video, frame);
    };
    
    video.load();
}

function setupVideoElement(video, frame) {
    if (!video || !frame) {
        console.error('Missing video or frame element');
        return;
    }
    
    console.log('Setting up video element:', video.src);
    
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';
    
    video.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        border-radius: 12px;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        cursor: pointer;
    `;
    
    // Remove existing click handlers
    video.onclick = null;
    video.removeEventListener('click', video._clickHandler);
    
    // Add new click handler
    const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Video clicked:', frame.id);
        expandMedia(frame.id);
    };
    
    video._clickHandler = clickHandler;
    video.addEventListener('click', clickHandler);
    video.addEventListener('touchstart', clickHandler);
    
    // Setup intersection observer for autoplay
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const playPromise = video.play();
                if (playPromise) {
                    playPromise
                        .then(() => console.log('Video autoplay successful:', video.src))
                        .catch(e => console.log('Video autoplay failed:', video.src, e));
                }
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(video);
    
    // Initial play attempt
    setTimeout(() => {
        const playPromise = video.play();
        if (playPromise) {
            playPromise
                .then(() => console.log('Initial video play successful:', video.src))
                .catch(e => console.log('Initial video play failed:', video.src, e));
        }
    }, 100);
}

// Enhanced DOM initialization with comprehensive debugging
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    console.log('Starting initialization...');
    
    // Check for required elements
    const requiredElements = {
        mainHeart: document.getElementById('mainHeart'),
        mainHeartAudio: document.getElementById('mainHeartAudio'),
        musicBtn1: document.getElementById('musicBtn1'),
        musicBtn2: document.getElementById('musicBtn2'),
        musicBtn3: document.getElementById('musicBtn3'),
        musicBtn4: document.getElementById('musicBtn4'),
        musicAudio1: document.getElementById('musicAudio1'),
        musicAudio2: document.getElementById('musicAudio2'),
        musicAudio3: document.getElementById('musicAudio3'),
        musicAudio4: document.getElementById('musicAudio4')
    };
    
    console.log('=== ELEMENT CHECK ===');
    Object.entries(requiredElements).forEach(([name, element]) => {
        console.log(`${name}:`, element ? '✅ Found' : '❌ Missing');
        if (element && element.src) {
            console.log(`  Source: ${element.src}`);
        }
    });
    
    // Initialize audio context on first user interaction
    const initUserInteraction = () => {
        console.log('First user interaction detected');
        initAudioContext();
        document.removeEventListener('click', initUserInteraction);
        document.removeEventListener('touchstart', initUserInteraction);
    };
    
    document.addEventListener('click', initUserInteraction);
    document.addEventListener('touchstart', initUserInteraction);
    
    // Preload all audio with delay for better performance
    setTimeout(() => {
        console.log('Starting audio preload...');
        preloadAllAudio();
    }, 500);
    
    // Show initial welcome message
    setTimeout(() => {
        showTypingMessage('start by clicking the heart', 4000);
    }, 1000);
    
    // Setup offline detection
    window.addEventListener('online', () => {
        console.log('Network: Online');
        checkOfflineStatus();
    });
    window.addEventListener('offline', () => {
        console.log('Network: Offline');
        checkOfflineStatus();
    });
    
    // Check initial network status
    isOffline = !navigator.onLine;
    console.log('Initial network status:', navigator.onLine ? 'Online' : 'Offline');
    if (!navigator.onLine) {
        document.getElementById('offlineIndicator')?.classList.add('show');
    }
    
    // Create offline indicator
    createOfflineIndicator();
    
    // Initialize media frames and auto-detect videos
    setTimeout(() => {
        console.log('Initializing media frames...');
        initializeMediaFrames();
        autoDetectVideos();
    }, 100);
    
    // Setup main heart with comprehensive event handling
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        console.log('Setting up main heart event listeners');
        
        // Remove any existing listeners
        mainHeart.onclick = null;
        mainHeart.removeEventListener('click', mainHeart._clickHandler);
        mainHeart.removeEventListener('touchstart', mainHeart._touchHandler);
        
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Main heart clicked');
            playMainMusic();
        };
        
        const touchHandler = (e) => {
            e.preventDefault();
            console.log('Main heart touched');
            playMainMusic();
        };
        
        mainHeart._clickHandler = clickHandler;
        mainHeart._touchHandler = touchHandler;
        
        mainHeart.addEventListener('click', clickHandler);
        mainHeart.addEventListener('touchstart', touchHandler);
        
        mainHeart.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Main heart keyboard activated');
                playMainMusic();
            }
        });
        
        // Make it focusable
        if (!mainHeart.tabIndex) {
            mainHeart.tabIndex = 0;
        }
        
        console.log('✅ Main heart setup complete');
    } else {
        console.error('❌ Main heart element not found!');
    }
    
    // Setup music buttons with comprehensive event handling
    for (let i = 1; i <= 4; i++) {
        const musicBtn = document.getElementById(`musicBtn${i}`);
        if (musicBtn) {
            console.log(`Setting up music button ${i}`);
            
            // Remove any existing listeners
            musicBtn.onclick = null;
            musicBtn.removeEventListener('click', musicBtn._clickHandler);
            musicBtn.removeEventListener('touchstart', musicBtn._touchHandler);
            
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Music button ${i} clicked`);
                playMusic(i);
            };
            
            const touchHandler = (e) => {
                e.preventDefault();
                console.log(`Music button ${i} touched`);
                playMusic(i);
            };
            
            musicBtn._clickHandler = clickHandler;
            musicBtn._touchHandler = touchHandler;
            
            musicBtn.addEventListener('click', clickHandler);
            musicBtn.addEventListener('touchstart', touchHandler);
            
            musicBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    console.log(`Music button ${i} keyboard activated`);
                    playMusic(i);
                }
            });
            
            // Make it focusable
            if (!musicBtn.tabIndex) {
                musicBtn.tabIndex = 0;
            }
            
            console.log(`✅ Music button ${i} setup complete`);
        } else {
            console.error(`❌ Music button ${i} not found!`);
        }
    }
    
    // Setup other UI elements
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', goBackToMain);
        console.log('✅ Back button setup complete');
    }
    
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', showMessage);
        console.log('✅ Message icon setup complete');
    }
    
    const closeMessage = document.querySelector('.close-message');
    if (closeMessage) {
        closeMessage.addEventListener('click', hideMessage);
        console.log('✅ Close message setup complete');
    }
    
    // Close modal when clicking outside
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) {
                hideMessage();
            }
        });
        console.log('✅ Message modal setup complete');
    }
    
    // Mark initialization as complete
    setTimeout(() => {
        isInitialLoad = false;
        console.log('=== INITIALIZATION COMPLETE ===');
    }, 2000);
});

// Create tears periodically
setInterval(createTear, 800);