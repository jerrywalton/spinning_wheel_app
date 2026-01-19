
// Prize segments configuration
const segments = [
    { text: "100 Coins", icon: "🪙", bgColor: "#8B5CF6", textColor: "#fff" },
    { text: "Try Again", icon: "🔄", bgColor: "#EC4899", textColor: "#fff" },
    { text: "Big Win!", icon: "🏆", bgColor: "#F59E0B", textColor: "#fff" },
    { text: "50 Coins", icon: "💰", bgColor: "#10B981", textColor: "#fff" },
    { text: "Free Spin", icon: "🎡", bgColor: "#3B82F6", textColor: "#fff" },
    { text: "200 Coins", icon: "💎", bgColor: "#EF4444", textColor: "#fff" },
    { text: "25 Coins", icon: "⭐", bgColor: "#6366F1", textColor: "#fff" },
    { text: "Jackpot!", icon: "🎰", bgColor: "#F97316", textColor: "#fff" },
];

let rotation = 0;
let isSpinning = false;
let spinCount = 0;

const segmentAngle = 360 / segments.length;

// Get elements
const wheelContainer = document.querySelector('#wheelContainer') as HTMLElement;
const canvas = document.querySelector('#wheelCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const wheelGlow = document.querySelector('#wheelGlow') as HTMLElement;
const spinBtn = document.querySelector('#spinBtn') as HTMLButtonElement;
const btnText = document.querySelector('#btnText') as HTMLElement;
const btnIcon = document.querySelector('#btnIcon') as HTMLElement;
const spinCounter = document.querySelector('#spinCounter') as HTMLElement;
const prizeModal = document.querySelector('#prizeModal') as HTMLElement;
const prizeIcon = document.querySelector('#prizeIcon') as HTMLElement;
const prizeText = document.querySelector('#prizeText') as HTMLElement;
const prizeCloseBtn = document.querySelector('#prizeCloseBtn') as HTMLElement;
const container = document.querySelector('.spin-container') as HTMLElement;


// Set canvas size
function resizeCanvas() {
    const size = wheelContainer.offsetWidth;
    if (size <= 0) return; // Prevent drawing with invalid size
    canvas.width = size * 2; // For retina
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    ctx.scale(2, 2);
    drawWheel();
}

// Draw the wheel
function drawWheel() {
    const size = canvas.width / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    segments.forEach((segment, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.bgColor;
        ctx.fill();

        // Add subtle border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text and icon
        ctx.save();
        ctx.translate(centerX, centerY);
        const textAngle = startAngle + (segmentAngle / 2) * (Math.PI / 180);
        ctx.rotate(textAngle);

        // Icon
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(segment.icon, radius * 0.85, 0);

        // Text
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = segment.textColor;
        ctx.fillText(segment.text, radius * 0.5, 0);
        //ctx.fillText(segment.text, radius * 0.4, 0);

        ctx.restore();
    });

    // Inner decorative circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Get winning segment based on rotation
function getWinningSegment(finalRotation: number) {
    // Normalize rotation to 0-360
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    // The pointer is at top (0 degrees ), wheel rotates clockwise
    // We need to find which segment is at the top
    const pointerAngle = (360 - normalizedRotation + 90) % 360;
    const segmentIndex = Math.floor(pointerAngle / segmentAngle) % segments.length;
    return segments[segmentIndex];
}

// Create confetti
function createConfetti() {
    const colors = ['#fbbf24', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#EF4444'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = -10 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3500);
    }
}

// Show prize modal
function showPrize(segment: any) {
    prizeIcon.textContent = segment.icon;
    prizeText.textContent = segment.text;
    prizeModal.classList.add('show');
    createConfetti();
}

// Hide prize modal
prizeCloseBtn.addEventListener('click', () => {
    prizeModal.classList.remove('show');
});

// Spin handler
function handleSpin() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    btnText.textContent = 'Spinning...';
    btnIcon.classList.add('spinning');
    wheelGlow.classList.add('spinning');

    // Random rotation: 5-8 full spins + random segment
    const fullSpins = (Math.floor(Math.random() * 4) + 5) * 360;
    const randomOffset = Math.floor(Math.random() * 360);
    rotation += fullSpins + randomOffset;

    wheelContainer.style.transform = `rotate(${rotation}deg)`;

    // Update counter
    spinCount++;
    spinCounter.textContent = `Total spins: ${spinCount}`;
    spinCounter.classList.add('visible');

    // Show prize after animation
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        btnText.textContent = 'SPIN';
        btnIcon.classList.remove('spinning');
        wheelGlow.classList.remove('spinning');

        const winner = getWinningSegment(rotation);
        showPrize(winner);
    }, 5000);
}

spinBtn.addEventListener('click', handleSpin);

// Initialize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
