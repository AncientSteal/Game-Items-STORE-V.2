const container = document.getElementById('snake-container');
const segments = [];
const length = 15;
let posX = window.innerWidth / 2;
let posY = window.innerHeight / 2;
let speedX = 5;
let speedY = 5;
let targetX = null;
let targetY = null;
const attractionForce = 0.5;

for (let i = 0; i < length; i++) {
    const el = document.createElement('div');
    el.className = 'snake-segment';
    container.appendChild(el);
    segments.push({el, x: posX, y: posY})
}

function moveSnake() {
    posX += speedX;
    posY += speedY;
    if (targetX !== null && targetY !== null) {
        speedX += (targetX - posX) * 0.02 * attractionForce;
        speedY += (targetY - posY) * 0.02 * attractionForce;
    } else {
        speedX += (Math.random() - 0.5) * 2;
        speedY += (Math.random() - 0.5) * 2;
    }

    const maxSpeed = 6;
    speedX = Math.max(Math.min(speedX,maxSpeed), -maxSpeed);
    speedY  = Math.max(Math.min(speedY,maxSpeed), -maxSpeed);

    if (posX < 0 || posX > window.innerWidth) {
        speedX *= -1;
    }
    if (posY < 0 || posY > window.innerHeight) {
        speedY *= -1;
    }

    for (let i = length - 1; i > 0; i--) {
        segments[i].x = segments[i - 1].x;
        segments[i].y = segments[i - 1].y;
    }
    segments[0].x = posX;
    segments[0].y = posY;

    segments.forEach((seg, i) => {
        seg.el.style.left = `${seg.x}px`;
        seg.el.style.top = `${seg.y}px`;
        seg.el.style.opacity = 1 - (i/length);
    });
    requestAnimationFrame(moveSnake);
}

function setTarget (x,y) {
    targetX = x;
    targetY = y;
}

function clearTarget() {
    targetX = null;
    targetY = null;
}

moveSnake();