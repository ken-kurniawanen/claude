// Crowd Runner - Unified gate-run + battle game
// Phase 1: Run through +/- gates to grow your army
// Phase 2: Your army battles a horde of enemies
// Based on Last War / Last Z style scam ads

function createCrowdRunner(canvas, ctx) {
    const W = canvas.width;
    const H = canvas.height;

    // === GAME STATE ===
    let phase = 'gate'; // 'gate', 'transition', 'battle', 'won', 'lost'
    let level = 1;
    let armyCount = 10;
    let armyDisplayCount = 10;
    let transitionTimer = 0;

    // === GATE PHASE STATE ===
    let distance = 0;
    let totalDistance = 0;
    let speed = 2.5;
    let levelLength = 3000;
    const armyUnits = [];
    let gates = [];
    const scenery = [];
    let touchX = W / 2;
    let armyX = W / 2;
    const roadWidth = W * 0.65;
    const roadX = (W - roadWidth) / 2;
    const laneWidth = roadWidth / 2;

    // === BATTLE PHASE STATE ===
    let enemies = [];
    const bullets = [];
    let autoFireTimer = 0;
    let shakeTimer = 0;
    let shakeX = 0;
    let shakeY = 0;
    let battleTimer = 0;
    let enemiesDefeated = 0;

    // === SHARED FX ===
    const particles = [];
    const floatingNumbers = [];

    // =====================
    // GATE PHASE FUNCTIONS
    // =====================

    function generateLevel() {
        gates = [];
        scenery.length = 0;
        distance = 0;
        totalDistance = 0;
        levelLength = 2500 + level * 500;
        speed = 2.5 + level * 0.15;

        const gateSpacing = 350;
        const numGates = Math.floor(levelLength / gateSpacing);

        for (let i = 0; i < numGates; i++) {
            const y = -(i + 1) * gateSpacing;
            const leftValue = generateGateValue();
            let rightValue = generateGateValue();
            if (Math.random() < 0.7) {
                if (leftValue > 0) rightValue = -Math.abs(rightValue);
                else rightValue = Math.abs(rightValue);
            }
            gates.push({ y, leftValue, rightValue, passed: false, width: roadWidth, x: roadX });
        }

        // Generate scenery
        for (let y = 0; y > -levelLength - 500; y -= 80) {
            if (Math.random() < 0.4) {
                scenery.push({ x: roadX - 20 - Math.random() * 40, y, type: Math.random() < 0.5 ? 'tree' : 'lamp' });
            }
            if (Math.random() < 0.4) {
                scenery.push({ x: roadX + roadWidth + 20 + Math.random() * 40, y, type: Math.random() < 0.5 ? 'tree' : 'lamp' });
            }
        }

        updateArmyUnits();
    }

    function generateGateValue() {
        const values = [5, 10, 15, 20, -5, -10, -15, -20, -25];
        if (level > 3) values.push(30, -30, 25);
        if (Math.random() < 0.2 && level > 1) {
            return Math.random() < 0.5 ? 'x2' : 'x3';
        }
        return values[Math.floor(Math.random() * values.length)];
    }

    function updateArmyUnits() {
        armyUnits.length = 0;
        const count = Math.min(Math.max(armyCount, 0), 200);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + i * 0.5;
            const radius = Math.sqrt(i) * 8;
            armyUnits.push({
                offsetX: Math.cos(angle) * radius,
                offsetY: Math.sin(angle) * radius * 0.5 + 10,
                bobPhase: Math.random() * Math.PI * 2,
                color: `hsl(${200 + Math.random() * 30}, 70%, ${50 + Math.random() * 20}%)`,
            });
        }
    }

    function applyGateValue(value) {
        const prevCount = armyCount;
        if (typeof value === 'string') {
            if (value === 'x2') armyCount *= 2;
            else if (value === 'x3') armyCount *= 3;
        } else {
            armyCount += value;
        }
        armyCount = Math.max(0, Math.min(armyCount, 200));
        armyCount = Math.round(armyCount);

        const diff = armyCount - prevCount;
        if (diff > 0) {
            spawnFloatingNumber(armyX, H * 0.55, '+' + diff, '#4caf50');
            spawnParticles(armyX, H * 0.6, '#4caf50', 12);
        } else if (diff < 0) {
            spawnFloatingNumber(armyX, H * 0.55, '' + diff, '#f44336');
            spawnParticles(armyX, H * 0.6, '#f44336', 12);
        }
        updateArmyUnits();
    }

    function updateGatePhase() {
        armyX += (touchX - armyX) * 0.1;
        armyX = Math.max(roadX + 20, Math.min(roadX + roadWidth - 20, armyX));

        distance += speed;
        totalDistance += speed;

        if (armyDisplayCount < armyCount) armyDisplayCount = Math.min(armyDisplayCount + 1, armyCount);
        if (armyDisplayCount > armyCount) armyDisplayCount = Math.max(armyDisplayCount - 1, armyCount);

        // Check gates
        for (const gate of gates) {
            if (gate.passed) continue;
            const screenY = gate.y + distance + H * 0.6;
            if (screenY > H * 0.6 && screenY < H * 0.65) {
                gate.passed = true;
                const midX = roadX + roadWidth / 2;
                if (armyX < midX) applyGateValue(gate.leftValue);
                else applyGateValue(gate.rightValue);
            }
        }

        if (armyCount <= 0) { phase = 'lost'; return; }

        // Check if gate phase complete (all gates passed)
        if (totalDistance >= levelLength) {
            phase = 'transition';
            transitionTimer = 90; // 1.5 seconds
            spawnFloatingNumber(W / 2, H * 0.4, 'PREPARE FOR BATTLE!', '#ffa500');
        }
    }

    // =====================
    // SHARED FX FUNCTIONS
    // =====================

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            particles.push({
                x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                life: 25 + Math.random() * 15, maxLife: 40, size: 3 + Math.random() * 3, color,
            });
        }
    }

    function spawnFloatingNumber(x, y, text, color) {
        floatingNumbers.push({ x, y, text, color, life: 50, vy: -2 });
    }

    function updateFX() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatingNumbers.length - 1; i >= 0; i--) {
            const f = floatingNumbers[i];
            f.y += f.vy; f.life--;
            if (f.life <= 0) floatingNumbers.splice(i, 1);
        }
    }

    // === PLACEHOLDER: battle functions added in chunk 2 ===
    function spawnBattleEnemies() {}
    function updateBattlePhase() {}

    // =====================
    // INPUT
    // =====================

    function onPointerDown(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        touchX = touch.clientX - rect.left;
    }
    function onPointerMove(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        touchX = touch.clientX - rect.left;
    }
    function onTap(e) {
        if (phase === 'won' || phase === 'lost') {
            e.preventDefault();
            if (phase === 'won') level++;
            armyCount = 10;
            armyDisplayCount = 10;
            enemies = [];
            bullets.length = 0;
            particles.length = 0;
            floatingNumbers.length = 0;
            phase = 'gate';
            generateLevel();
        }
    }

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('click', onTap);
    canvas.addEventListener('touchstart', onTap, { passive: false });

    // Init
    generateLevel();

    // =====================
    // MAIN UPDATE
    // =====================

    function update() {
        if (phase === 'gate') updateGatePhase();
        else if (phase === 'transition') {
            transitionTimer--;
            if (transitionTimer <= 0) {
                phase = 'battle';
                battleTimer = 0;
                enemiesDefeated = 0;
                spawnBattleEnemies();
            }
        }
        else if (phase === 'battle') updateBattlePhase();
        updateFX();
    }

    // === PLACEHOLDER: draw functions added in chunk 3 ===

    function draw() {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', W / 2, H / 2);
    }

    return {
        update,
        draw,
        cleanup() {
            canvas.removeEventListener('mousedown', onPointerDown);
            canvas.removeEventListener('mousemove', onPointerMove);
            canvas.removeEventListener('touchstart', onPointerDown);
            canvas.removeEventListener('touchmove', onPointerMove);
            canvas.removeEventListener('click', onTap);
            canvas.removeEventListener('touchstart', onTap);
        }
    };
}
