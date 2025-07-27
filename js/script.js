// Audio objects for each song
let audioPlayers = {};

// Initialize audio players
function initAudio() {
    audioPlayers = {
        1: new Audio('assets/audio/song1.mp3'),
        2: new Audio('assets/audio/song2.mp3'),
        3: new Audio('assets/audio/song3.mp3')
    };

    // Set up audio properties
    Object.values(audioPlayers).forEach(audio => {
        audio.loop = false;
        audio.volume = 0.7;
    });
}

// Create animated stars
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    createSparkles();

    // Pause any currently playing audio
    Object.values(audioPlayers).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

    // Pause any currently playing audio
    Object.values(audioPlayers).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';

        // Pause any currently playing audio
        Object.values(audioPlayers).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
}

// Music player functionality
function playMusic(songNumber) {
    const audio = audioPlayers[songNumber];
    const button = event.target.closest('.play-btn');

    if (!audio) {
        // Fallback if audio file doesn't exist
        const messages = [
            "🎵 Playing: 'The Way You Look Tonight' 🎵",
            "🎶 Playing: 'Your Song' by Elton John 🎶",
            "🎼 Playing: 'Perfect' by Ed Sheeran 🎼"
        ];

        alert(messages[songNumber - 1] + "\n\n(Add your audio files to assets/audio/ folder!)");
        return;
    }

    // Stop all other audio
    Object.values(audioPlayers).forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
            otherAudio.pause();
            otherAudio.currentTime = 0;
        }
    });

    // Toggle play/pause
    if (audio.paused) {
        audio.play().then(() => {
            button.innerHTML = '<span class="music-note">⏸️</span> Pause Music <span class="music-note">⏸️</span>';

            // Reset button when song ends
            audio.onended = function() {
                button.innerHTML = '<span class="music-note">🎵</span> Play Our Song <span class="music-note">🎵</span>';
                if (songNumber === 2) {
                    button.innerHTML = '<span class="music-note">🎶</span> Feel the Rhythm <span class="music-note">🎶</span>';
                } else if (songNumber === 3) {
                    button.innerHTML = '<span class="music-note">🎼</span> Our Forever Song <span class="music-note">🎼</span>';
                }
            };
        }).catch(error => {
            console.log('Audio playback failed:', error);
            // Fallback message
            const messages = [
                "🎵 Add 'song1.mp3' to assets/audio/ folder 🎵",
                "🎶 Add 'song2.mp3' to assets/audio/ folder 🎶",
                "🎼 Add 'song3.mp3' to assets/audio/ folder 🎼"
            ];
            alert(messages[songNumber - 1]);
        });
    } else {
        audio.pause();
        audio.currentTime = 0;

        // Reset button text
        if (songNumber === 1) {
            button.innerHTML = '<span class="music-note">🎵</span> Play Our Song <span class="music-note">🎵</span>';
        } else if (songNumber === 2) {
            button.innerHTML = '<span class="music-note">🎶</span> Feel the Rhythm <span class="music-note">🎶</span>';
        } else if (songNumber === 3) {
            button.innerHTML = '<span class="music-note">🎼</span> Our Forever Song <span class="music-note">🎼</span>';
        }
    }
}

// Create sparkle effects
function createSparkles() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.innerHTML = '✨';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.position = 'fixed';
            sparkle.style.zIndex = '1001';
            document.body.appendChild(sparkle);

            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 2000);
        }, i * 200);
    }
}

// Add rose click effects
function addRoseClickEffects() {
    document.querySelectorAll('.rose-wrapper').forEach(rose => {
        rose.addEventListener('click', function() {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1.1)';
            }, 200);
        });
    });
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Close any open modal
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });

        // Pause any playing audio
        Object.values(audioPlayers).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
});

// Image error handling
function handleImageError(img) {
    img.style.display = 'none';
    if (img.nextElementSibling && img.nextElementSibling.classList.contains('photo-placeholder')) {
        img.nextElementSibling.style.display = 'flex';
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    createStars();
    initAudio();
    addRoseClickEffects();

    // Handle image loading errors
    document.querySelectorAll('.photo').forEach(img => {
        img.addEventListener('error', function() {
            handleImageError(this);
        });

        // Check if image loads successfully
        img.addEventListener('load', function() {
            if (this.nextElementSibling && this.nextElementSibling.classList.contains('photo-placeholder')) {
                this.nextElementSibling.style.display = 'none';
            }
        });
    });
});

// Preload images for better performance
function preloadImages() {
    const imageUrls = [
        'assets/images/photo1.jpg',
        'assets/images/photo2.jpg',
        'assets/images/photo3.jpg',
        'assets/images/photo4.jpg',
        'assets/images/photo5.jpg',
        'assets/images/photo6.jpg'
    ];

    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Call preload on page load
window.addEventListener('load', preloadImages);
