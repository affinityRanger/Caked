let petalInterval;
let isPaused = false;

function createPetal(side) {
  if (isPaused) return;
  
  const petal = document.createElement('div');
  petal.classList.add('petal');
  petal.style.left = Math.random() * 100 + '%';
  petal.style.animationDelay = Math.random() * 2 + 's';
  petal.style.animationDuration = (Math.random() * 4 + 6) + 's';
  side.appendChild(petal);

  setTimeout(() => {
    if (petal.parentNode) {
      petal.remove();
    }
  }, 10000);
}

function pausePetals() {
  isPaused = true;
}

function resumePetals() {
  isPaused = false;
}

function createSparkleTransition() {
  const sparkleEmojis = ['✨', '⭐', '💘', '💜', '💖'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
      sparkle.style.position = 'absolute';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
      sparkle.style.zIndex = '10';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.animation = 'sparkleFloat 1.2s ease-out forwards';
      document.querySelector('.left-side').appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1200);
    }, i * 60);
  }
}

function createBreakingHeartTransition() {
  const darkEmojis = ['💔', '🖤', '⚫', '💀', '🥀', '⛈️'];
  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.innerHTML = darkEmojis[Math.floor(Math.random() * darkEmojis.length)];
      piece.style.position = 'absolute';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = Math.random() * 100 + '%';
      piece.style.fontSize = (Math.random() * 1 + 1.2) + 'rem';
      piece.style.zIndex = '10';
      piece.style.pointerEvents = 'none';
      piece.style.animation = 'breakingFall 1.5s ease-in forwards';
      document.querySelector('.right-side').appendChild(piece);
      setTimeout(() => piece.remove(), 1500);
    }, i * 50);
  }
}

function navigateToGarden() {
  const leftSide = document.querySelector('.left-side');
  leftSide.classList.add('clicking');
  createSparkleTransition();
  
  setTimeout(() => {
    window.location.href = 'hope.html';
  }, 1200);
}

function navigateToDoubt() {
  const rightSide = document.querySelector('.right-side');
  rightSide.classList.add('clicking');
  createBreakingHeartTransition();
  
  setTimeout(() => {
    window.location.href = 'doubt.html';
  }, 1500);
}

// Initialize petal animation
const leftSide = document.querySelector('.left-side');
const rightSide = document.querySelector('.right-side');

petalInterval = setInterval(() => {
  createPetal(leftSide);
  createPetal(rightSide);
}, 1200);

// Add some initial petals
setTimeout(() => {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createPetal(leftSide);
      createPetal(rightSide);
    }, i * 200);
  }
}, 1000);