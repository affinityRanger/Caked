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
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        createVisualizer();
    } catch (error) {
        console.log('Audio analyser setup failed:', error);
    }
}

// Create audio visualizer with enhanced bars
function createVisualizer() {
    if (document.getElementById('audioVisualizer')) return;
    
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    visualizer.id = 'audioVisualizer';
    
    for (let i = 0; i < 64; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.height = '2px';
        bar.style.backgroundColor = `hsl(${340 + (i * 2)}, 100%, ${50 + (i % 20)}%)`;
        visualizer.appendChild(bar);
    }
    
    document.body.appendChild(visualizer);
}

// Update audio visualization with enhanced effects
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

// Start visualization with enhanced effects
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

// Stop visualization
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

// Store current audio state
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

// Restore audio state after video stops
function restoreAudioState() {
    if (audioStateBeforeVideo) {
        console.log('Restoring audio state:', audioStateBeforeVideo);
        
        const { audio, currentTime, volume, playingElement } = audioStateBeforeVideo;
        
        if (audio) {
            currentAudio = audio;
            currentPlayingElement = playingElement;
            
            audio.currentTime = currentTime;
            audio.volume = volume;
            
            // Restore visual states - only heart can pulse
            if (playingElement) {
                playingElement.classList.add('playing');
                if (playingElement.id === 'mainHeart') {
                    playingElement.classList.add('beating');
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

// Enhanced stop all audio function - properly resets ALL button states but preserves heart beating
function stopAllAudio(preserveState = false, keepHeartBeating = false) {
    console.log('Stopping all audio, preserveState:', preserveState, 'keepHeartBeating:', keepHeartBeating);
    
    // Store state if requested and audio is playing
    if (preserveState) {
        storeAudioState();
    } else {
        audioStateBeforeVideo = null;
    }
    
    // Stop current audio completely
    if (currentAudio) {
        currentAudio.pause();
        if (!preserveState) {
            currentAudio.currentTime = 0;
        }
        
        // Disconnect from analyser to prevent conflicts
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
    
    // Stop next audio if crossfading
    if (nextAudio) {
        nextAudio.pause();
        nextAudio.currentTime = 0;
        nextAudio = null;
    }
    
    // Clear crossfade interval
    if (crossfadeInterval) {
        clearInterval(crossfadeInterval);
        crossfadeInterval = null;
    }
    
    // Reset ALL music button states (remove spinning/pulsing)
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing', 'pulsing');
    });
    
    // Reset main heart state - but preserve beating if requested
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart && !preserveState) {
        mainHeart.classList.remove('playing');
        if (!keepHeartBeating) {
            mainHeart.classList.remove('beating');
        }
    }
    
    stopVisualization();
    hideAudioStatus();
    currentPlayingElement = null;
    
    console.log('All audio stopped and states reset');
}

// Improved crossfade function with better audio management
function crossfadeToNext(currentElement, nextElement, duration = 2000) {
    if (!currentElement || !nextElement) return;
    
    console.log('Starting crossfade from current to next audio');
    
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
            
            // Completely stop and reset the previous track
            currentElement.pause();
            currentElement.currentTime = 0;
            
            // Clean up previous audio connection
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

// Enhanced play audio function with better state management
function playAudioWithFallback(audioElement, title, visualElement) {
    if (!audioElement) {
        console.log('Audio element not found');
        return;
    }
    
    console.log('Playing audio:', title, 'Element:', visualElement?.id);
    
    // If same track is playing, stop it completely
    if (currentAudio === audioElement && !audioElement.paused) {
        console.log('Same track playing, stopping it');
        stopAllAudio();
        return;
    }
    
    // Cache the track
    cacheAudio(audioElement.id);
    
    // Handle crossfade if another track is playing
    if (currentAudio && currentAudio !== audioElement && !currentAudio.paused) {
        console.log('Another track playing, starting crossfade');
        nextAudio = audioElement;
        
        // Reset previous playing element's visual state immediately
        if (currentPlayingElement) {
            currentPlayingElement.classList.remove('playing', 'pulsing');
            // Keep heart beating if it was the heart playing
            if (currentPlayingElement.id !== 'mainHeart') {
                currentPlayingElement.classList.remove('beating');
            }
        }
        
        crossfadeToNext(currentAudio, nextAudio);
    } else {
        // Stop all audio but keep heart beating if it was already beating
        const heartWasBeating = document.getElementById('mainHeart')?.classList.contains('beating');
        stopAllAudio(false, heartWasBeating);
    }
    
    // Set new current audio and playing element
    currentAudio = audioElement;
    currentPlayingElement = visualElement;
    
    // Add visual feedback - only heart can pulse/beat
    if (visualElement) {
        visualElement.classList.add('playing');
        if (visualElement.id === 'mainHeart') {
            visualElement.classList.add('beating');
        }
        // Remove pulsing class from music buttons (no background spinning)
    }
    
    // Connect to analyser for visualization
    if (audioContext && analyser && !audioElement.connected) {
        try {
            // Clean up any existing connection first
            if (audioElement.sourceNode) {
                audioElement.sourceNode.disconnect();
            }
            
            audioElement.sourceNode = audioContext.createMediaElementSource(audioElement);
            audioElement.sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioElement.connected = true;
            console.log('Audio connected to analyser');
        } catch (error) {
            console.log('Audio connection failed:', error);
        }
    }
    
    showAudioStatus(`🎵 ${title}`);
    startVisualization();
    
    // Set appropriate volume for mobile/desktop
    const isMobile = window.innerWidth <= 768;
    audioElement.volume = isMobile ? 0.4 : 0.3;
    
    // Reset audio to beginning
    audioElement.currentTime = 0;
    
    // Try to play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('Audio playing successfully:', title);
            
            // Add haptic feedback on mobile if available
            if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            showTypingMessage(`🎵 Now playing: ${title}`);
        }).catch(error => {
            console.log('Audio play failed:', error);
            showTypingMessage('Audio playback failed');
            
            // Reset states on failure
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing', 'beating');
            }
            stopVisualization();
            hideAudioStatus();
            currentAudio = null;
            currentPlayingElement = null;
        });
    }
    
    // Handle audio end - reset states but keep heart beating
    audioElement.onended = () => {
        console.log('Audio ended:', title);
        if (visualElement) {
            visualElement.classList.remove('playing', 'pulsing');
            // Only remove beating if it's not the main heart
            if (visualElement.id !== 'mainHeart') {
                visualElement.classList.remove('beating');
            }
        }
        stopVisualization();
        hideAudioStatus();
        currentAudio = null;
        currentPlayingElement = null;
        showTypingMessage('Track ended');
    };
    
    // Handle audio error - reset states but keep heart beating
    audioElement.onerror = () => {
        console.log('Audio error:', title);
        showAudioStatus(`🎵 ${title} (Error loading)`);
        setTimeout(() => {
            if (visualElement) {
                visualElement.classList.remove('playing', 'pulsing');
                // Only remove beating if it's not the main heart
                if (visualElement.id !== 'mainHeart') {
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

// Fixed music functionality with proper state management
function playMusic(num) {
    console.log('Play music button clicked:', num);
    
    preloadAudioOnDemand(`musicAudio${num}`);
    
    const audioElement = document.getElementById(`musicAudio${num}`);
    const buttonElement = document.getElementById(`musicBtn${num}`);
    const titles = [
        "Amy Winehouse - Back To Black",
        "Don Toliver - Easy",
        "Juice WRLD - Faded", 
        "All Out - Juice WRLD"
    ];
    
    if (!audioElement || !buttonElement) {
        console.log('Audio element or button not found:', `musicAudio${num}`, `musicBtn${num}`);
        return;
    }
    
    playAudioWithFallback(audioElement, titles[num - 1], buttonElement);
    createMusicExplosion(buttonElement);
}

// Fixed main heart music
function playMainMusic() {
    console.log('Main heart clicked');
    
    const audioElement = document.getElementById('mainHeartAudio');
    const heartElement = document.getElementById('mainHeart');
    
    if (!audioElement || !heartElement) {
        console.log('Main heart audio or element not found');
        return;
    }
    
    playAudioWithFallback(audioElement, "You've Been Missed - PARTYNEXTDOOR", heartElement);
    createHeartExplosion();
}

// Create heart explosion effect - improved for mobile
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
            
            // Create unique animation for each heart
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

// Create music explosion effect - improved for mobile
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
            
            // Create unique animation for each note
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

// Network status handler - Updated for initial load
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

// Typing message display function
function showTypingMessage(message, duration = 3000) {
    const existingMessage = document.getElementById('typingMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingMessage';
    typingDiv.className = 'typing-text';
    
    const textSpan = document.createElement('span');
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.innerHTML = '|';
    
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
    }, 100);
}

// Check offline status function
function checkOfflineStatus() {
    isOffline = !navigator.onLine;
    handleNetworkStatus(navigator.onLine);
}

// Enhanced frame initialization for better media handling with improved video sizing
function initializeMediaFrames() {
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach(frame => {
        const img = frame.querySelector('img:not(.placeholder)');
        const video = frame.querySelector('video');
        
        if (video) {
            setupVideoElement(video, frame);
        } else if (img) {
            frame.style.cursor = 'pointer';
            frame.onclick = null;
            frame.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                expandMedia(frame.id);
            });
        }
    });
    
    console.log('Media frames initialized:', frames.length);
}

// Create offline indicator
function createOfflineIndicator() {
    if (document.getElementById('offlineIndicator')) return;
    
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

// Go back to landing page - preserve heart beating state
function goBackToMain() {
    stopAllAudio(false, true); // Keep heart beating when going back
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

// Auto-detect and setup video elements with optimized sizing
function autoDetectVideos() {
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach((frame, index) => {
        let video = frame.querySelector('video');
        if (video) {
            setupVideoElement(video, frame);
            return;
        }
        
        const img = frame.querySelector('img');
        if (img && isVideoSource(img.src)) {
            convertImageToVideo(img, frame);
        }
    });
}

// Convert image element to video if it's actually a video - with optimized sizing
function convertImageToVideo(img, frame) {
    const video = document.createElement('video');
    video.src = img.src;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Optimized video styling for better fitting
    video.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        object-position: center center;
        border-radius: 12px;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
    `;
    
    video.onerror = () => {
        console.log('Video failed to load, keeping image:', img.src);
    };
    
    video.onloadedmetadata = () => {
        // Optimize aspect ratio handling
        optimizeVideoAspectRatio(video, frame);
        img.style.display = 'none';
        frame.insertBefore(video, frame.firstChild);
        setupVideoElement(video, frame);
        console.log('Video loaded and replaced image:', video.src);
    };
    
    video.load();
}

// Optimize video aspect ratio for better fitting
function optimizeVideoAspectRatio(video, frame) {
    video.addEventListener('loadedmetadata', () => {
        const videoRatio = video.videoWidth / video.videoHeight;
        const frameRatio = frame.offsetWidth / frame.offsetHeight;
        
        if (Math.abs(videoRatio - frameRatio) > 0.2) {
            // Adjust object-fit based on aspect ratio difference
            if (videoRatio > frameRatio) {
                video.style.objectFit = 'cover';
                video.style.objectPosition = 'center center';
            } else {
                video.style.objectFit = 'cover';
                video.style.objectPosition = 'center center';
            }
        }
    });
}

// Setup video element with proper handling and optimized sizing
function setupVideoElement(video, frame) {
    if (!video || !frame) return;
    
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';
    
    // Enhanced video styling for better fitting
    video.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        object-position: center center;
        border-radius: 12px;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        transition: transform 0.3s ease;
    `;
    
    // Optimize video for frame on metadata load
    video.addEventListener('loadedmetadata', () => {
        optimizeVideoAspectRatio(video, frame);
    });
    
    video.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        expandMedia(frame.id);
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const playPromise = video.play();
                if (playPromise) {
                    playPromise.catch(e => console.log('Video autoplay failed:', e));
                }
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(video);
    
    setTimeout(() => {
        const playPromise = video.play();
        if (playPromise) {
            playPromise
                .then(() => console.log('Video autoplay successful'))
                .catch(e => console.log('Video autoplay failed:', e));
        }
    }, 100);
}

// Enhanced expand media function with better detection, popup handling, and video optimization
function expandMedia(frameId) {
    const frame = document.getElementById(frameId);
    if (!frame || expandedMedia) return;
    
    const video = frame.querySelector('video');
    const img = frame.querySelector('img:not(.placeholder)');
    
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
        console.log('No media element found in frame:', frameId);
        return;
    }
    
    console.log('Expanding media:', isVideo ? 'video' : 'image', 'from frame:', frameId);
    
    const frameRect = frame.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const isMobile = window.innerWidth <= 768;
    
    // Improved popup sizing for better video display
    let popupSize;
    if (isVideo) {
        popupSize = isMobile ? 320 : 480;
    } else {
        popupSize = isMobile ? 280 : 420;
    }
    
    const offset = isMobile ? 20 : 40;
    
    let popupX, popupY;
    
    // Determine best position based on frame location
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
        // Stop all audio and store state when video starts
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
        
        // Video event handling
        expandedElement.addEventListener('play', () => {
            console.log('Video started playing');
            showTypingMessage('Playing video... 🎬');
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
        // Better image handling
        expandedElement = document.createElement('img');
        expandedElement.src = mediaElement.src;
        expandedElement.alt = mediaElement.alt || 'Memory';
        
        // Add loading state
        expandedElement.onload = () => {
            console.log('Image loaded in popup');
        };
        
        expandedElement.onerror = () => {
            console.log('Image failed to load in popup');
            showTypingMessage('Image failed to load');
        };
    }
    
    // Optimized styling for both images and videos with better fitting
    expandedElement.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
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
    
    // Create floating animation style if not exists
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
            console.log('Closing video, current time:', currentVideo.currentTime);
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
    
    // Auto-close after 15 seconds for images only on mobile
    if (!isVideo && isMobile) {
        setTimeout(() => {
            if (expandedMedia === popup) {
                closeMedia();
            }
        }, 15000);
    } else if (!isVideo && !isMobile) {
        setTimeout(() => {
            if (expandedMedia === popup) {
                closeMedia();
            }
        }, 20000);
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

// Enhanced setup media frame function with better video handling
function setupMediaFrame(frameId, mediaSrc, altText) {
    const frame = document.getElementById(frameId);
    if (!frame || !mediaSrc) return;
    
    // Clear existing content except placeholder
    const existingMedia = frame.querySelectorAll('img:not(.placeholder), video');
    existingMedia.forEach(el => el.remove());
    
    let mediaElement;
    if (isVideoSource(mediaSrc)) {
        // Create video element with optimized settings
        mediaElement = document.createElement('video');
        mediaElement.src = mediaSrc;
        mediaElement.muted = true;
        mediaElement.loop = true;
        mediaElement.autoplay = true;
        mediaElement.playsInline = true;
        mediaElement.preload = 'metadata';
        
        // Optimized video styling for better frame fitting
        mediaElement.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
            object-position: center center;
            border-radius: 12px;
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            transition: transform 0.3s ease;
        `;
        
        // Handle video loading errors
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
        
        // Setup video when loaded
        mediaElement.onloadedmetadata = () => {
            optimizeVideoAspectRatio(mediaElement, frame);
            setupVideoElement(mediaElement, frame);
        };
    } else {
        // Create image element
        mediaElement = document.createElement('img');
        mediaElement.src = mediaSrc;
        mediaElement.alt = altText || 'Memory';
        mediaElement.loading = 'lazy';
        
        // Proper image styling
        mediaElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center center;
            border-radius: 12px;
            display: block;
        `;
        
        // Handle image loading errors
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
    }
    
    frame.appendChild(mediaElement);
    
    // Enhanced frame click handling
    frame.style.cursor = 'pointer';
    
    // Remove existing click listeners to prevent duplicates
    const newFrame = frame.cloneNode(true);
    frame.parentNode.replaceChild(newFrame, frame);
    
    // Add new click handler
    const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Frame clicked:', frameId);
        expandMedia(frameId);
    };
    
    newFrame.addEventListener('click', clickHandler);
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

// Preload audio on demand
function preloadAudioOnDemand(audioId) {
    const audio = document.getElementById(audioId);
    if (audio && audio.preload === 'none') {
        audio.preload = 'auto';
        audio.load();
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Show initial welcome message
    setTimeout(() => {
        showTypingMessage('🔪start by 💔', 4000);
    }, 1000);
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
    
    // Setup offline detection
    window.addEventListener('online', checkOfflineStatus);
    window.addEventListener('offline', checkOfflineStatus);
    
    // Check initial status without showing online message
    isOffline = !navigator.onLine;
    if (!navigator.onLine) {
        document.getElementById('offlineIndicator')?.classList.add('show');
    }
    
    // Mark that initial load is complete after a short delay
    setTimeout(() => {
        isInitialLoad = false;
    }, 2000);
    
    // Create offline indicator
    createOfflineIndicator();
    
    // Initialize media frames first, then auto-detect videos
    setTimeout(() => {
        initializeMediaFrames();
        autoDetectVideos();
    }, 100);
    
    // Setup event listeners
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', goBackToMain);
    }
    
    const messageIcon = document.querySelector('.message-icon');
    if (messageIcon) {
        messageIcon.addEventListener('click', showMessage);
    }
    
    const closeMessage = document.querySelector('.close-message');
    if (closeMessage) {
        closeMessage.addEventListener('click', hideMessage);
    }
    
    // Close modal when clicking outside
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) {
                hideMessage();
            }
        });
    }
    
    // Setup main heart with improved event handling
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.addEventListener('click', playMainMusic);
        mainHeart.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playMainMusic();
            }
        });
    }
    
    // Setup music buttons with improved event handling
    for (let i = 1; i <= 4; i++) {
        const musicBtn = document.getElementById(`musicBtn${i}`);
        if (musicBtn) {
            musicBtn.addEventListener('click', () => playMusic(i));
            musicBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playMusic(i);
                }
            });
        }
    }
    
    console.log('Initialization complete');
});

// Create tears periodically
setInterval(createTear, 800);