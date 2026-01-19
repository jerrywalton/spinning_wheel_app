
// main.ts - Spin & Win - TypeScript + PixiJS
// Created by Jerry Walton
// https://github.com/jerrywalton/spinning-wheel

import * as PIXI from 'pixi.js';

// Setup PixiJS Application
const app = new PIXI.Application();

(async () => {
    await app.init({
        resizeTo: window,
        backgroundColor: '#0f0d1f',
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
    });

    // Append the canvas to the game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.appendChild(app.canvas);
    }

    createGame();
})();

// Prize segments configuration
const segments = [
    { text: "100 Coins", icon: "🪙", color: 0x8B5CF6, textColor: "#fff" },
    { text: "Try Again", icon: "🔄", color: 0xEC4899, textColor: "#fff" },
    { text: "Big Win!", icon: "🏆", color: 0xF59E0B, textColor: "#fff" },
    { text: "50 Coins", icon: "💰", color: 0x10B981, textColor: "#fff" },
    { text: "Free Spin", icon: "🎡", color: 0x3B82F6, textColor: "#fff" },
    { text: "200 Coins", icon: "💎", color: 0xEF4444, textColor: "#fff" },
    { text: "25 Coins", icon: "⭐", color: 0x6366F1, textColor: "#fff" },
    { text: "Jackpot!", icon: "🎰", color: 0xF97316, textColor: "#fff" },
];

// Game State
let isSpinning = false;
let wheelContainer: PIXI.Container;
let spinButton: PIXI.Container;
let rotation = 0;
const segmentAngle = 360 / segments.length;
const WHEEL_RADIUS = 200;

function createGame() {
    // 1. Background Effects (Simple Glows)
    createBackgroundGlows();

    // 2. Wheel Container (Centered)
    wheelContainer = new PIXI.Container();
    wheelContainer.x = app.screen.width / 2;
    wheelContainer.y = app.screen.height / 2 + 25; // Offset slightly down
    app.stage.addChild(wheelContainer);

    // 3. Draw Wheel
    drawWheel();

    // 4. Pointer
    drawPointer();

    // 5. Spin Button
    createSpinButton();

    // 6. Handle Resize
    window.addEventListener('resize', handleResize);
}

function handleResize() {
    if (!wheelContainer) return;
    wheelContainer.x = app.screen.width / 2;
    wheelContainer.y = app.screen.height / 2 + 25;

    if (spinButton) {
        spinButton.x = app.screen.width / 2;
        spinButton.y = wheelContainer.y + WHEEL_RADIUS + 100;
    }

    // Position background glows if we made them globally accessible, 
    // or just re-create them. For simplicity, we'll leave them static or simple.
}

function createBackgroundGlows() {
    const glow1 = new PIXI.Graphics();
    glow1.circle(0, 0, 150);
    glow1.fill({ color: 0xA855F7, alpha: 0.1 });
    glow1.filterArea = app.screen;
    // Note: Pixi v8 filters or standard blur
    const blurFilter = new PIXI.BlurFilter();
    blurFilter.strength = 60;
    glow1.filters = [blurFilter];
    glow1.x = app.screen.width * 0.2;
    glow1.y = app.screen.height * 0.2;
    app.stage.addChild(glow1);

    const glow2 = new PIXI.Graphics();
    glow2.circle(0, 0, 200);
    glow2.fill({ color: 0xF59E0B, alpha: 0.1 });
    glow2.filters = [blurFilter];
    glow2.x = app.screen.width * 0.8;
    glow2.y = app.screen.height * 0.8;
    app.stage.addChild(glow2);
}

function drawWheel() {
    // Outer Wheel Glow
    const glow = new PIXI.Graphics();
    glow.circle(0, 0, WHEEL_RADIUS + 20);
    glow.fill({ color: 0xFBBF24, alpha: 0.2 });
    const blur = new PIXI.BlurFilter();
    blur.strength = 30;
    glow.filters = [blur];
    wheelContainer.addChild(glow);

    // Wheel Segments
    const segmentsContainer = new PIXI.Container();
    wheelContainer.addChild(segmentsContainer);

    segments.forEach((segment, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

        const g = new PIXI.Graphics();

        // Helper for polar to cartesian
        const getPt = (r: number, theta: number) => ({
            x: Math.cos(theta) * r,
            y: Math.sin(theta) * r
        });

        // Calculate parameters for the segment shape
        const inset = 1;
        const cornerRadius = 8;
        const hubRadius = 35;
        const rOuter = WHEEL_RADIUS - inset;
        const rInner = hubRadius + inset;

        const angleGapOuter = cornerRadius / rOuter;
        const angleGapInner = cornerRadius / rInner;
        const offsetOuter = inset / rOuter;
        const offsetInner = inset / rInner;

        const sAngleOuter = startAngle + offsetOuter;
        const eAngleOuter = endAngle - offsetOuter;
        const sAngleInner = startAngle + offsetInner;
        const eAngleInner = endAngle - offsetInner;

        // Draw the segment shape
        g.beginPath();

        // 1. Outer Edge (Arc)
        g.arc(0, 0, rOuter, sAngleOuter + angleGapOuter, eAngleOuter - angleGapOuter);

        // Corner: Outer End
        const p1_oe = getPt(rOuter, eAngleOuter);
        const p2_ie = getPt(rInner, eAngleInner);
        const dx_oe = p2_ie.x - p1_oe.x;
        const dy_oe = p2_ie.y - p1_oe.y;
        const len_oe = Math.sqrt(dx_oe * dx_oe + dy_oe * dy_oe);
        const target_oe = {
            x: p1_oe.x + (dx_oe / len_oe) * cornerRadius,
            y: p1_oe.y + (dy_oe / len_oe) * cornerRadius
        };
        const cpOuterEnd = getPt(rOuter, eAngleOuter);
        g.quadraticCurveTo(cpOuterEnd.x, cpOuterEnd.y, target_oe.x, target_oe.y);

        // 2. Right Side Line
        const target_ie_start = {
            x: p1_oe.x + (dx_oe / len_oe) * (len_oe - cornerRadius),
            y: p1_oe.y + (dy_oe / len_oe) * (len_oe - cornerRadius)
        };
        g.lineTo(target_ie_start.x, target_ie_start.y);

        // Corner: Inner End
        const cpInnerEnd = getPt(rInner, eAngleInner);
        const target_ie_end = getPt(rInner, eAngleInner - angleGapInner);
        g.quadraticCurveTo(cpInnerEnd.x, cpInnerEnd.y, target_ie_end.x, target_ie_end.y);

        // 3. Inner Edge (Arc)
        g.arc(0, 0, rInner, eAngleInner - angleGapInner, sAngleInner + angleGapInner, true);

        // Corner: Inner Start
        const cpInnerStart = getPt(rInner, sAngleInner);
        const p1_is = getPt(rInner, sAngleInner);
        const p2_os = getPt(rOuter, sAngleOuter);
        const dx_is = p2_os.x - p1_is.x;
        const dy_is = p2_os.y - p1_is.y;
        const len_is = Math.sqrt(dx_is * dx_is + dy_is * dy_is);
        const target_is_end = {
            x: p1_is.x + (dx_is / len_is) * cornerRadius,
            y: p1_is.y + (dy_is / len_is) * cornerRadius
        };
        g.quadraticCurveTo(cpInnerStart.x, cpInnerStart.y, target_is_end.x, target_is_end.y);

        // 4. Left Side Line
        const target_os_start = {
            x: p1_is.x + (dx_is / len_is) * (len_is - cornerRadius),
            y: p1_is.y + (dy_is / len_is) * (len_is - cornerRadius)
        };
        g.lineTo(target_os_start.x, target_os_start.y);

        // Corner: Outer Start (Closing)
        const cpOuterStart = getPt(rOuter, sAngleOuter);
        const target_os_end = getPt(rOuter, sAngleOuter + angleGapOuter);
        g.quadraticCurveTo(cpOuterStart.x, cpOuterStart.y, target_os_end.x, target_os_end.y);

        // Fill the shape
        g.fill({ color: segment.color });

        // Optional: keep the decorative stroke or use it as border
        g.stroke({ width: 2, color: 0x333333, alpha: 0.5, join: 'round' });

        segmentsContainer.addChild(g);

        // Text & Icon
        const textAngle = startAngle + (segmentAngle / 2) * (Math.PI / 180);

        // Container for text to allow easy rotation
        const contentContainer = new PIXI.Container();
        contentContainer.rotation = textAngle;
        segmentsContainer.addChild(contentContainer);

        // Icon
        const iconText = new PIXI.Text({
            text: segment.icon,
            style: {
                fontFamily: 'Arial',
                fontSize: 32,
                fill: '#ffffff',
            }
        });
        iconText.anchor.set(0.5);
        iconText.x = WHEEL_RADIUS * 0.85; // Distance from center
        iconText.rotation = Math.PI / 2; // Orient icon correctly
        contentContainer.addChild(iconText);

        // Label
        const labelText = new PIXI.Text({
            text: segment.text,
            style: {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: segment.textColor,
            }
        });
        labelText.anchor.set(0.5);
        labelText.x = WHEEL_RADIUS * 0.5;
        labelText.rotation = Math.PI / 2; // Orient text perpendicular to radius? No, usually parallel.
        // Actually, for a wheel, usually text runs along the radius.
        // With container rotation = textAngle, 0 degrees is pointing outwards along the radius.
        // If we want text readable, we usually don't rotate it further, 
        // OR we rotate it 90 deg if we want it stacked.
        // Let's try 0 first (aligned with radius)
        labelText.rotation = 0;
        contentContainer.addChild(labelText);
    });

    // Center Hub
    const hub = new PIXI.Graphics();
    hub.circle(0, 0, 35);
    hub.fill({ color: 0x1e1b4b });
    hub.stroke({ width: 3, color: 0xFBBF24 });
    wheelContainer.addChild(hub);

    const star = new PIXI.Text({
        text: "✨",
        style: { fontSize: 24 }
    });
    star.anchor.set(0.5);
    wheelContainer.addChild(star);

    // outer ring
    const ring = new PIXI.Graphics();
    ring.circle(0, 0, WHEEL_RADIUS + 6);
    //hub.fill({ color: 0x1e1b4b });
    ring.stroke({ width: 3, color: 0xFBBF24 });
    wheelContainer.addChild(ring);
}

function drawPointer() {
    // Determine pointer position (top of wheel relative to screen)
    // Since wheelContainer is centered, we can anchor the pointer relative to it, but static.

    const pointerContainer = new PIXI.Container();

    // 1. Shadow (Dark copy, offset)
    const shadow = new PIXI.Graphics();
    shadow.poly([
        -18, -32,
        18, -32,
        0, 0
    ]);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    shadow.filters = [new PIXI.BlurFilter({ strength: 2 })];
    shadow.y = 4; // Offset
    pointerContainer.addChild(shadow);

    // 2. Pointer Body
    const pointer = new PIXI.Graphics();
    pointer.poly([
        -18, -32,  // top left
        18, -32,  // top right
        0, 0      // bottom tip
    ]);
    pointer.fill({ color: 0xFBBF24 });
    pointerContainer.addChild(pointer);

    // Helper to position pointer
    const updatePointerPos = () => {
        if (!wheelContainer) return;
        pointerContainer.x = wheelContainer.x;
        pointerContainer.y = wheelContainer.y - WHEEL_RADIUS + 10; // Overlap slightly
    };

    updatePointerPos();

    app.ticker.add(() => {
        updatePointerPos();
    });

    app.stage.addChild(pointerContainer);

}

function createSpinButton() {
    spinButton = new PIXI.Container();
    spinButton.x = app.screen.width / 2;
    spinButton.y = wheelContainer.y + WHEEL_RADIUS + 100;

    // Button Background
    const bg = new PIXI.Graphics();
    // RoundRect: x, y, width, height, radius
    bg.roundRect(-80, -30, 160, 60, 30);
    // Gradient simulation or simple fill
    bg.fill({ color: 0xF59E0B });
    // We can simulate gradient by drawing multiple creates or using specific fill API if supported in v8

    spinButton.addChild(bg);

    // Add shadow/glow
    const glow = new PIXI.Graphics();
    glow.roundRect(-80, -30, 160, 60, 30);
    glow.fill({ color: 0xFBBF24, alpha: 0.4 });
    // glow.filterArea = app.screen; // optimization removed to avoid artifacts
    glow.filters = [new PIXI.BlurFilter({ strength: 10 })];
    spinButton.addChildAt(glow, 0); // Add behind

    // Text
    const btnText = new PIXI.Text({
        text: "SPIN 🎯",
        style: {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: '#1f2937'
        }
    });
    btnText.anchor.set(0.5);
    spinButton.addChild(btnText);

    // Interactivity
    spinButton.eventMode = 'static';
    spinButton.cursor = 'pointer';

    spinButton.on('pointerdown', onSpinClick);
    spinButton.on('pointerover', () => {
        spinButton.scale.set(1.05);
    });
    spinButton.on('pointerout', () => {
        spinButton.scale.set(1);
    });

    app.stage.addChild(spinButton);
}

function onSpinClick() {
    if (isSpinning) return;

    isSpinning = true;
    spinButton.alpha = 0.5;
    spinButton.cursor = 'default';

    // Calculate spin
    const fullSpins = (Math.floor(Math.random() * 4) + 5) * 360;
    const randomOffset = Math.floor(Math.random() * 360);
    const targetRotation = rotation + fullSpins + randomOffset;

    // Animate
    let startTime: number | null = null;
    const duration = 5000; // 5 seconds

    const animate = (time: any) => {
        if (!startTime) startTime = time.lastTime; // Pixi ticker uses ticks
        // Actually lets use raw requestAnimationFrame style logic with delta
        // Or simpler: use a tween library? Trying to keep dependencies low.
        // Let's implement simple ease-out cubic manually.
    };

    // Let's use GSAP-like logic manually with ticker
    const startRot = wheelContainer.rotation; // Rotation in Radians usually in Pixi?
    // Pixi uses radians.
    // 1 degree = PI/180

    const targetRad = targetRotation * (Math.PI / 180);
    const startRad = rotation * (Math.PI / 180); // Current rotation
    const changeRad = targetRad - startRad;

    let elapsed = 0;

    const tick = (ticker: PIXI.Ticker) => {
        elapsed += ticker.deltaMS;

        if (elapsed >= duration) {
            // Finished
            wheelContainer.rotation = targetRad % (Math.PI * 2);
            rotation = targetRotation; // Keep tracking degrees for logic if needed
            isSpinning = false;
            spinButton.alpha = 1;
            spinButton.cursor = 'pointer';
            app.ticker.remove(tick);

            checkWinner(targetRotation);
        } else {
            // Ease Out Cubic: 1 - pow(1 - x, 3)
            const t = elapsed / duration;
            const ease = 1 - Math.pow(1 - t, 3);
            wheelContainer.rotation = startRad + changeRad * ease;
        }
    };

    app.ticker.add(tick);
}

function checkWinner(finalRotation: number) {
    // Normalize rotation to 0-360
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;

    // Pointer is at top (0 degrees or -90 degrees depending on coord system)
    // In Pixi, 0 is right (3 o'clock). Top is -90 degrees (-PI/2).
    // Our segments start drawing at -90.

    // Let's trace the logic:
    // If wheel is rotated 0, index 0 is at -90 (Top).
    // If wheel rotates +90 (clockwise), index 0 moves to 0 (Right). Index 7 moves to Top.
    // So the segment at Top is determined by:
    // (StartAngle + Rotation) % 360... wait.

    // Simplest way: The "Angle" at the pointer (Top/-90deg) relative to the wheel's 0 is:
    // PointerAngleInWheelSpace = -90 - Rotation
    // Normalize to 0-360 positive.

    // Pixi rotation is in Radians. `finalRotation` var we tracked is Degrees.
    // `normalizedRotation` is 0..360.

    const pointerAngle = (270 - normalizedRotation) % 360;
    // why 270? -90 normalized is 270.
    // pointer is at 270 degrees in wheel space (assuming 0 is 3 o'clock).

    // We need to match this angle to our segments.
    // Segment 0 spans: -90 - (segmentAngle/2) to -90 + (segmentAngle/2)?
    // No, code says: startAngle = i * segmentAngle - 90.
    // So Segment 0 starts at -90 (270) and goes to -45 (315).
    // Wait, segmentAngle is 360/8 = 45.
    // i=0: -90 to -45.
    // i=1: -45 to 0.
    // ...

    // So if pointer is at 270 (-90), it hits the very start of Segment 0?
    // Let's adjust logic. precise hit testing.

    // Let's convert pointerAngle to "Index":
    // Angle - (-90) / 45 ?
    // (Angle + 90) / 45

    const effectiveAngle = (pointerAngle + 90 + 360) % 360;
    const index = Math.floor(effectiveAngle / segmentAngle);

    const winner = segments[index % segments.length];
    showPrize(winner);
}

// Prize Modal Logic (HTML Overlay)
const prizeModal = document.getElementById('prizeModal')!;
const prizeIcon = document.getElementById('prizeIcon')!;
const prizeText = document.getElementById('prizeText')!;
const prizeCloseBtn = document.getElementById('prizeCloseBtn')!;
const confettiContainer = document.body; // Append confetti to body

function showPrize(segment: any) {
    prizeIcon.textContent = segment.icon;
    prizeText.textContent = segment.text;
    prizeModal.classList.add('show');
    createConfetti();
}

prizeCloseBtn.addEventListener('click', () => {
    prizeModal.classList.remove('show');
});

// Create confetti (HTML DOM based for now, could be Pixi particles)
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
        document.body.appendChild(confetti); // Attach to body
        setTimeout(() => confetti.remove(), 3500);
    }
}
