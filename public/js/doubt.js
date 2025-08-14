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
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Create visualizer bars inside audio status
        createIntegratedVisualizer();
    } catch (error) {
        console.log('Audio analyser setup failed:', error);
    }
}

// Create integrated visualizer with enhanced bar animation
function createIntegratedVisualizer() {
    const audioStatus = document.getElementById('audioStatus');
    if (!audioStatus) return;
    
    // Check if visualizer already exists
    if (audioStatus.querySelector('.integrated-visualizer')) return;
    
    const visualizer = document.createElement('div');
    visualizer.className = 'integrated-visualizer';
    visualizer.style.cssText = `
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 12px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 1px;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 2;
    `;
    
    // Create 25 compact bars for a fuller visualization
    for (let i = 0; i < 25; i++) {
        const bar = document.createElement('div');
        bar.className = 'integrated-bar';
        bar.style.cssText = `
            width: 6px;
            height: 3px;
            background: linear-gradient(to top, #ff1744, #ff4569);
            border-radius: 1.5px;
            transform-origin: bottom;
            transition: height 0.1s ease-out;
            box-shadow: 0 0 3px rgba(255, 23, 68, 0.6);
            animation: barPulse 2s ease-in-out infinite;
            animation-delay: ${i * 0.05}s;
        `;
        visualizer.appendChild(bar);
    }
    
    // Add pulsing animation keyframes if not exists
    if (!document.getElementById('barPulseStyle')) {
        const style = document.createElement('style');
        style.id = 'barPulseStyle';
        style.textContent = `
            @keyframes barPulse {
                0%, 100% {
                    transform: scaleY(1);
                    opacity: 0.8;
                }
                50% {
                    transform: scaleY(1.2);
                    opacity: 1;
                }
            }
            
            @keyframes barBeat {
                0%, 100% {
                    transform: scaleY(1) scaleX(1);
                }
                50% {
                    transform: scaleY(1.8) scaleX(1.1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    audioStatus.appendChild(visualizer);
}

// Enhanced update visualization with more dynamic animation
function updateIntegratedVisualization() {
    if (!analyser || !dataArray) return;
    
    analyser.getByteFrequencyData(dataArray);
    const audioStatus = document.getElementById('audioStatus');
    const visualizer = audioStatus?.querySelector('.integrated-visualizer');
    const bars = visualizer?.querySelectorAll('.integrated-bar');
    
    if (bars) {
        // Calculate average volume for global effects
        const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const normalizedAvg = avgVolume / 255;
        
        bars.forEach((bar, index) => {
            // Sample frequency data with some overlap for smoother visualization
            const dataIndex = Math.floor((index / bars.length) * dataArray.length);
            const value = dataArray[dataIndex] || 0;
            
            // Enhanced height calculation with better responsiveness
            const minHeight = 1;
            const maxHeight = 12;
            const sensitivity = 2.5; // Increased sensitivity
            const height = Math.max(minHeight, (value / 255) * maxHeight * sensitivity);
            
            // Smooth transitions with variable speed based on intensity
            const currentHeight = parseFloat(bar.style.height) || minHeight;
            const targetHeight = height;
            const transitionSpeed = 0.3 + (normalizedAvg * 0.4); // Faster transitions for louder music
            const smoothedHeight = currentHeight + (targetHeight - currentHeight) * transitionSpeed;
            
            bar.style.height = smoothedHeight + 'px';
            
            // Enhanced color system with beat detection
            const intensity = value / 255;
            const beatDetected = intensity > 0.7;
            
            // Dynamic color gradients
            let gradient;
            if (beatDetected) {
                // Bright flash colors for beats
                gradient = `linear-gradient(to top, #ff1744, #ff6b9d, #ffffff)`;
                bar.style.animation = 'barBeat 0.2s ease-out';
            } else {
                // Standard gradient with intensity-based colors
                const hue = 340 + (intensity * 30); // Red to pink-red spectrum
                const saturation = 85 + (intensity * 15);
                const lightness1 = 45 + (intensity * 15);
                const lightness2 = 60 + (intensity * 25);
                gradient = `linear-gradient(to top, hsl(${hue}, ${saturation}%, ${lightness1}%), hsl(${hue}, ${saturation}%, ${lightness2}%))`;
                bar.style.animation = `barPulse ${2 - normalizedAvg}s ease-in-out infinite`;
                bar.style.animationDelay = `${index * 0.05}s`;
            }
            
            bar.style.background = gradient;
            
            // Dynamic glow effects
            const glowIntensity = Math.max(0.3, intensity);
            const glowSize = 2 + (intensity * 4);
            const glowColor = `rgba(255, 23, 68, ${glowIntensity})`;
            
            if (beatDetected) {
                bar.style.boxShadow = `
                    0 0 ${glowSize * 2}px ${glowColor},
                    0 0 ${glowSize}px rgba(255, 107, 157, 0.6),
                    inset 0 0 2px rgba(255, 255, 255, 0.3)
                `;
            } else {
                bar.style.boxShadow = `
                    0 0 ${glowSize}px ${glowColor},
                    0 -1px 2px rgba(255, 23, 68, 0.2)
                `;
            }
            
            // Add subtle width variation for high frequencies
            if (index > bars.length * 0.7 && intensity > 0.6) {
                bar.style.width = `${3 + intensity}px`;
            } else {
                bar.style.width = '3px';
            }
        });
        
        // Add global visualizer effects based on average volume
        if (normalizedAvg > 0.6) {
            visualizer.style.filter = `brightness(${1 + normalizedAvg * 0.3}) saturate(${1 + normalizedAvg * 0.2})`;
        } else {
            visualizer.style.filter = 'brightness(1) saturate(1)';
        }
    }
    
    animationId = requestAnimationFrame(updateIntegratedVisualization);
}

// Enhanced start visualization with intro animation
function startIntegratedVisualization() {
    const audioStatus = document.getElementById('audioStatus');
    const visualizer = audioStatus?.querySelector('.integrated-visualizer');
    
    if (visualizer) {
        // Animate bars appearing one by one
        const bars = visualizer.querySelectorAll('.integrated-bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.transform = 'scaleY(1)';
                bar.style.opacity = '1';
            }, index * 20);
        });
        
        visualizer.style.opacity = '1';
        
        // Add a subtle bounce effect to the whole visualizer
        visualizer.style.animation = 'visualizerIntro 0.6s ease-out';
        
        // Create intro animation if not exists
        if (!document.getElementById('visualizerIntroStyle')) {
            const style = document.createElement('style');
            style.id = 'visualizerIntroStyle';
            style.textContent = `
                @keyframes visualizerIntro {
                    0% {
                        transform: translateX(-50%) scale(0.8) translateY(5px);
                        opacity: 0;
                    }
                    60% {
                        transform: translateX(-50%) scale(1.05) translateY(-2px);
                    }
                    100% {
                        transform: translateX(-50%) scale(1) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        updateIntegratedVisualization();
    }
}

// Enhanced stop visualization with outro animation
function stopIntegratedVisualization() {
    const audioStatus = document.getElementById('audioStatus');
    const visualizer = audioStatus?.querySelector('.integrated-visualizer');
    
    if (visualizer) {
        // Animate bars disappearing
        const bars = visualizer.querySelectorAll('.integrated-bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.height = '1px';
                bar.style.background = '#ff1744';
                bar.style.boxShadow = '0 0 2px rgba(255, 23, 68, 0.3)';
                bar.style.animation = 'none';
                bar.style.width = '3px';
            }, index * 15);
        });
        
        // Fade out the whole visualizer
        setTimeout(() => {
            visualizer.style.opacity = '0';
            visualizer.style.filter = 'brightness(1) saturate(1)';
        }, bars.length * 15 + 200);
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
            
            // Restore visual states
            if (playingElement) {
                playingElement.classList.add('playing');
                if (playingElement.classList.contains('music-chaos')) {
                    playingElement.classList.add('pulsing');
                }
                if (playingElement.id === 'mainHeart') {
                    playingElement.classList.add('beating');
                }
            }
            
            // Resume playback
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    startIntegratedVisualization();
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

// Enhanced stop all audio with state preservation option
function stopAllAudio(preserveState = false) {
    // Store state if requested and audio is playing
    if (preserveState) {
        storeAudioState();
    } else {
        audioStateBeforeVideo = null;
    }
    
    // Stop current audio
    if (currentAudio) {
        currentAudio.pause();
        if (!preserveState) {
            currentAudio.currentTime = 0;
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
    
    // Reset visual states
    document.querySelectorAll('.music-chaos').forEach(btn => {
        btn.classList.remove('playing', 'pulsing');
    });
    
    const mainHeart = document.getElementById('mainHeart');
    if (mainHeart) {
        mainHeart.classList.remove('playing', 'beating');
    }
    
    stopIntegratedVisualization();
    hideAudioStatus();
    currentPlayingElement = null;
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
    startIntegratedVisualization();
    
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
            showTypingMessage('Audio playback failed, restoring audio...');
            restoreAudioState();
        });
    }
    
    // Handle audio end
    audioElement.onended = () => {
        if (visualElement) {
            visualElement.classList.remove('playing', 'pulsing', 'beating');
        }
        stopIntegratedVisualization();
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
            stopIntegratedVisualization();
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
            heart.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
                pointer-events: none;
                z-index: 100;
                animation: heartExplode${i} 2s ease-out forwards;
            `;
            
            // Create unique animation for each heart
            if (!document.getElementById(`heartExplodeStyle${i}`)) {
                const style = document.createElement('style');
                style.id = `heartExplodeStyle${i}`;
                const angle = (360 / heartCount) * i;
                const distance = window.innerWidth <= 768 ? 150 : 200;
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

// Create music explosion effect
function createMusicExplosion(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const noteCount = window.innerWidth <= 768 ? 4 : 6;
    const notes = ['🎵', '🎶', '🎼', '🎧'];
    
    for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            note.innerHTML = notes[i % notes.length];
            note.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                transform: translate(-50%, -50%);
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 100;
                animation: musicExplode${i} 1.5s ease-out forwards;
            `;
            
            // Create unique animation for each note
            if (!document.getElementById(`musicExplodeStyle${i}`)) {
                const style = document.createElement('style');
                style.id = `musicExplodeStyle${i}`;
                const angle = (360 / noteCount) * i;
                const distance = 80;
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

// Network status handler
function handleNetworkStatus(isOnline) {
    const indicator = document.getElementById('offlineIndicator');
    if (!isOnline) {
        indicator?.classList.add('show');
        showTypingMessage('You are now offline. Playing cached content...');
    } else {
        indicator?.classList.remove('show');
        // Only show "you are back online" message if it's not the initial load
        if (!isInitialLoad) {
            showTypingMessage('You are back online. Restoring audio...');
        }
    }
}

// Typing message display function
function showTypingMessage(message, duration = 3000) {
    // Remove existing typing message
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
    
    // Show the container
    setTimeout(() => typingDiv.classList.add('show'), 100);
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < message.length) {
            textSpan.innerHTML += message.charAt(i);
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

// Check offline status function
function checkOfflineStatus() {
    isOffline = !navigator.onLine;
    handleNetworkStatus(navigator.onLine);
}

// Enhanced frame initialization for better media handling
function initializeMediaFrames() {
    // Get all image and video frames
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach(frame => {
        const img = frame.querySelector('img:not(.placeholder)');
        const video = frame.querySelector('video');
        
        if (video) {
            setupVideoElement(video, frame);
        } else if (img) {
            frame.style.cursor = 'pointer';
            
            // Remove existing listeners by cloning
            const newFrame = frame.cloneNode(true);
            frame.parentNode.replaceChild(newFrame, frame);
            
            // Add click handler for images
            newFrame.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                expandMedia(newFrame.id);
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
    tear.style.cssText = `
        left: ${Math.random() * 100}%;
        animation-duration: ${(Math.random() * 2 + 2)}s;
    `;
    document.body.appendChild(tear);
    
    setTimeout(() => {
        if (tear.parentNode) {
            tear.remove();
        }
    }, 4000);
}

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
        const img = frame.querySelector('img:not(.placeholder)');
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
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach(frame => {
        let video = frame.querySelector('video');
        if (video) {
            setupVideoElement(video, frame);
            return;
        }
        
        const img = frame.querySelector('img:not(.placeholder)');
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
    
    video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
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
        img.style.display = 'none';
        frame.insertBefore(video, frame.firstChild);
        setupVideoElement(video, frame);
        console.log('Video loaded and replaced image:', video.src);
    };
    
    video.load();
}

// Setup video element with proper handling
function setupVideoElement(video, frame) {
    if (!video || !frame) return;
    
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
    `;
    
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

// Enhanced expand media function with better mobile support
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
    
    let popupSize, popupX, popupY;
    
    if (isMobile) {
        // Mobile: Use responsive sizing with safe margins
        const safeMargin = 20;
        const maxSize = Math.min(viewportWidth, viewportHeight) - (safeMargin * 2);
        
        if (isVideo) {
            // Videos get more space on mobile for better controls
            popupSize = Math.min(maxSize, viewportWidth * 0.9, viewportHeight * 0.7);
        } else {
            // Images use slightly less space
            popupSize = Math.min(maxSize, viewportWidth * 0.85, viewportHeight * 0.6);
        }
        
        // Center on mobile for better UX
        popupX = (viewportWidth - popupSize) / 2;
        popupY = (viewportHeight - popupSize) / 2;
        
        // Adjust Y position to avoid status bars and keyboard
        if (popupY < 40) popupY = 40;
        if (popupY + popupSize > viewportHeight - 40) {
            popupY = viewportHeight - popupSize - 40;
        }
        
    } else {
        // Desktop: Original positioning logic with improvements
        popupSize = isVideo ? 430 : 400;
        const offset = 40;
        
        // Smart positioning to avoid edges
        if (frameRect.right + popupSize + offset < viewportWidth) {
            // Position to the right
            popupX = frameRect.right + offset;
            popupY = Math.max(20, Math.min(frameRect.top, viewportHeight - popupSize - 20));
        } else if (frameRect.left - popupSize - offset > 0) {
            // Position to the left
            popupX = frameRect.left - popupSize - offset;
            popupY = Math.max(20, Math.min(frameRect.top, viewportHeight - popupSize - 20));
        } else if (frameRect.bottom + popupSize + offset < viewportHeight) {
            // Position below
            popupX = Math.max(20, Math.min(frameRect.left, viewportWidth - popupSize - 20));
            popupY = frameRect.bottom + offset;
        } else {
            // Position above
            popupX = Math.max(20, Math.min(frameRect.left, viewportWidth - popupSize - 20));
            popupY = Math.max(20, frameRect.top - popupSize - offset);
        }
    }
    
    // Ensure popup stays within viewport bounds
    popupX = Math.max(10, Math.min(popupX, viewportWidth - popupSize - 10));
    popupY = Math.max(10, Math.min(popupY, viewportHeight - popupSize - 10));
    
    const popup = document.createElement('div');
    popup.className = 'media-popup';
    popup.style.cssText = `
        position: fixed;
        top: ${popupY}px;
        left: ${popupX}px;
        width: ${popupSize}px;
        height: ${popupSize}px;
        background: rgba(10, 10, 10, 0.95);
        border: ${isMobile ? '2px' : '3px'} solid #ff1744;
        border-radius: ${isMobile ? '15px' : '20px'};
        backdrop-filter: blur(15px);
        box-shadow: 0 15px 35px rgba(255, 23, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 150;
        opacity: 0;
        transform: scale(0.3) rotate(-5deg);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
        cursor: pointer;
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 20px);
    `;
    
    let expandedElement;
    if (isVideo) {
        console.log('Video starting, stopping all audio');
        stopAllAudio(true);
        
        expandedElement = document.createElement('video');
        expandedElement.src = mediaElement.src || mediaElement.querySelector('source')?.src;
        expandedElement.controls = true;
        expandedElement.autoplay = true;
        expandedElement.loop = mediaElement.loop;
        expandedElement.volume = isMobile ? 0.6 : 0.8; // Lower volume on mobile
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
        border-radius: ${isMobile ? '13px' : '17px'};
        display: block;
    `;
    
    // Mobile-optimized close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    const closeBtnSize = isMobile ? 40 : 35;
    const closeBtnOffset = isMobile ? 8 : 10;
    
    closeBtn.style.cssText = `
        position: absolute;
        top: ${closeBtnOffset}px;
        right: ${closeBtnOffset}px;
        background: rgba(255, 23, 68, 0.9);
        border: none;
        color: white;
        font-size: ${isMobile ? '1.6rem' : '1.4rem'};
        width: ${closeBtnSize}px;
        height: ${closeBtnSize}px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 151;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
        -webkit-touch-callout: none;
        user-select: none;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 23, 68, 1)';
        closeBtn.style.transform = 'scale(1.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 23, 68, 0.9)';
        closeBtn.style.transform = 'scale(1)';
    });
    
    // Touch feedback for mobile
    if (isMobile) {
        closeBtn.addEventListener('touchstart', () => {
            closeBtn.style.background = 'rgba(255, 23, 68, 1)';
            closeBtn.style.transform = 'scale(0.95)';
        });
        
        closeBtn.addEventListener('touchend', () => {
            closeBtn.style.background = 'rgba(255, 23, 68, 0.9)';
            closeBtn.style.transform = 'scale(1)';
        });
    }
    
    popup.appendChild(expandedElement);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
    
    expandedMedia = popup;
    
    // Show with smooth animation
    requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1) rotate(0deg)';
    });
    
    // Reduced floating animation on mobile to save battery
    if (!isMobile) {
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'floatPopup 3s ease-in-out infinite';
            }
        }, 400);
    }
    
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
    
    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMedia();
    });
    
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeMedia();
        }
    });
    
    // Mobile-specific touch handling
    if (isMobile) {
        let startX, startY;
        
        popup.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        popup.addEventListener('touchend', (e) => {
            if (!e.touches.length) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = Math.abs(endX - startX);
                const deltaY = Math.abs(endY - startY);
                
                // Close if tap (not swipe) on background
                if (deltaX < 10 && deltaY < 10 && e.target === popup) {
                    closeMedia();
                }
            }
        });
    }
    
    // Auto-close timing adjustment
    if (!isVideo) {
        const autoCloseDelay = isMobile ? 15000 : 20000; // Shorter on mobile
        setTimeout(() => {
            if (expandedMedia === popup) {
                closeMedia();
            }
        }, autoCloseDelay);
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

// Enhanced setup media frame function
function setupMediaFrame(frameId, mediaSrc, altText) {
    const frame = document.getElementById(frameId);
    if (!frame || !mediaSrc) return;
    
    // Clear existing content except placeholder
    const existingMedia = frame.querySelectorAll('img:not(.placeholder), video');
    existingMedia.forEach(el => el.remove());
    
    let mediaElement;
    if (isVideoSource(mediaSrc)) {
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
        
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
        mediaElement.onloadedmetadata = () => setupVideoElement(mediaElement, frame);
    } else {
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
        
        mediaElement.onerror = () => showPlaceholder(frameId.replace('imageFrame', ''));
    }
    
    frame.appendChild(mediaElement);
    
    frame.style.cursor = 'pointer';
    
    // Remove existing click listeners by cloning
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

// Show audio status with integrated visualizer
function showAudioStatus(message) {
    const status = document.getElementById('audioStatus');
    if (status) {
        // Clear existing content
        status.innerHTML = '';
        
        // Create text container
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        textSpan.style.cssText = `
            display: flex;
            align-items: center;
            flex: 1;
        `;
        
        status.appendChild(textSpan);
        
        // Create integrated visualizer if it doesn't exist
        createIntegratedVisualizer();
        
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

// Enhanced responsive setup for media frames
function setupResponsiveMediaFrames() {
    const frames = document.querySelectorAll('.image-frame, .video-frame');
    
    frames.forEach((frame, index) => {
        // Add responsive classes based on position
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Ensure frames have proper spacing on mobile
            frame.style.margin = '10px 0';
            frame.style.minHeight = '150px';
            frame.style.maxHeight = '250px';
        }
        
        // Ensure proper touch targets on mobile
        if (isMobile) {
            frame.style.minHeight = '44px'; // iOS recommended touch target
            frame.style.position = 'relative';
        }
    });
}

// Add viewport meta tag check for mobile optimization
function ensureViewportMeta() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewportMeta);
        console.log('Added viewport meta tag for mobile optimization');
    }
}

// Handle orientation change
function handleOrientationChange() {
    if (expandedMedia) {
        // Close expanded media on orientation change to prevent layout issues
        const closeBtn = expandedMedia.querySelector('button');
        if (closeBtn) {
            closeBtn.click();
        }
    }
    
    // Re-setup responsive frames after orientation change
    setTimeout(() => {
        setupResponsiveMediaFrames();
    }, 100);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Show initial welcome message
    setTimeout(() => {
        showTypingMessage('🔪start by 💔', 4000);
    }, 1000);
    
    // Initialize audio context on first user interaction
    const initAudioOnInteraction = () => {
        initAudioContext();
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('touchstart', initAudioOnInteraction);
    };
    
    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('touchstart', initAudioOnInteraction);
    
    // Setup offline detection
    window.addEventListener('online', checkOfflineStatus);
    window.addEventListener('offline', checkOfflineStatus);
    
    // Check initial status without showing online message
    isOffline = !navigator.onLine;
    if (!navigator.onLine) {
        const indicator = document.getElementById('offlineIndicator');
        indicator?.classList.add('show');
    }
    
    // Mark that initial load is complete after a short delay
    setTimeout(() => {
        isInitialLoad = false;
    }, 2000);
    
    // Create offline indicator
    createOfflineIndicator();
    
    // Add mobile optimizations
    ensureViewportMeta();
    setupResponsiveMediaFrames();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', () => {
        setTimeout(setupResponsiveMediaFrames, 100);
    });
    
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
    
    // Setup main heart
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
    
    // Setup music buttons
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