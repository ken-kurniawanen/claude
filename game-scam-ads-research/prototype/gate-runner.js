// Number Gate Runner - Army runs through +/- gates to grow or shrink
// Based on Last War / Lords Mobile style ads

function createGateRunner(canvas, ctx) {
    const W = canvas.width;
    const H = canvas.height;

    // Game state
    let gameState = 'playing'; // 'playing', 'won', 'lost'
    let level = 1;
    let distance = 0;
    let speed = 2.5;
    let totalDistance = 0;
    let levelLength = 3000;

    // Army
    let armyCount = 10;
    let armyDisplayCount = 10;
    const armyUnits = [];

    // Road
    const roadWidth = W * 0.65;
    const roadX = (W - roadWidth) / 2;
    const laneWidth = roadWidth / 2;

    // Gates
    let gates = [];

    // Particles
    const particles = [];
    // Floating numbers
    const floatingNumbers = [];

    // Scenery elements
    const scenery = [];

    // Touch
    let touchX = W / 2;
    let armyX = W / 2;

    function generateLevel() {
        gates = [];
        scenery.length = 0;
        distance = 0;
        totalDistance = 0;
        levelLength = 2500 + level * 500;
        speed = 2.5 + level * 0.15;

        // Generate gates
        const gateSpacing = 350;
        const numGates = Math.floor(levelLength / gateSpacing);

        for (let i = 0; i < numGates; i++) {
            const y = -(i + 1) * gateSpacing;
            const leftValue = generateGateValue();
            let rightValue = generateGateValue();
            // Ensure one is good and one is bad (mostly)
            if (Math.random() < 0.7) {
                if (leftValue > 0) rightValue = -Math.abs(rightValue);
                else rightValue = Math.abs(rightValue);
            }
            gates.push({
                y,
                leftValue,
                rightValue,
                passed: false,
                width: roadWidth,
                x: roadX,
            });
        }

        // Boss gate at end
        gates.push({
            y: -(numGates + 1) * gateSpacing,
            isBoss: true,
            bossHP: 20 + level * 15,
            bossMaxHP: 20 + level * 15,
            width: roadWidth,
            x: roadX,
        });

        // Generate scenery (trees, lamps)
        for (let y = 0; y > -levelLength - 500; y -= 80) {
            if (Math.random() < 0.4) {
                scenery.push({
                    x: roadX - 20 - Math.random() * 40,
                    y,
                    type: Math.random() < 0.5 ? 'tree' : 'lamp',
                });
            }
            if (Math.random() < 0.4) {
                scenery.push({
                    x: roadX + roadWidth + 20 + Math.random() * 40,
                    y,
                    type: Math.random() < 0.5 ? 'tree' : 'lamp',
                });
            }
        }

        // Reinit army
        updateArmyUnits();
    }

    function generateGateValue() {
        const values = [5, 10, 15, 20, -5, -10, -15, -20, -25];
        // Higher levels have bigger swings
        if (level > 3) values.push(30, -30, 25);
        // Multiply gates
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

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 25 + Math.random() * 15,
                maxLife: 40,
                size: 3 + Math.random() * 3,
                color,
            });
        }
    }

    function spawnFloatingNumber(x, y, text, color) {
        floatingNumbers.push({ x, y, text, color, life: 50, vy: -2 });
    }

    // Input
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

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });

    function onTap(e) {
        if (gameState === 'won' || gameState === 'lost') {
            e.preventDefault();
            if (gameState === 'won') level++;
            armyCount = 10;
            gameState = 'playing';
            generateLevel();
        }
    }
    canvas.addEventListener('click', onTap);
    canvas.addEventListener('touchstart', onTap, { passive: false });

    generateLevel();

    function update() {
        if (gameState !== 'playing') return;

        // Smooth army movement
        armyX += (touchX - armyX) * 0.1;
        armyX = Math.max(roadX + 20, Math.min(roadX + roadWidth - 20, armyX));

        // Scroll
        distance += speed;
        totalDistance += speed;

        // Animate display count
        if (armyDisplayCount < armyCount) armyDisplayCount = Math.min(armyDisplayCount + 1, armyCount);
        if (armyDisplayCount > armyCount) armyDisplayCount = Math.max(armyDisplayCount - 1, armyCount);

        // Check gates
        for (const gate of gates) {
            if (gate.passed) continue;
            const screenY = gate.y + distance + H * 0.6;
            if (screenY > H * 0.6 && screenY < H * 0.65) {
                gate.passed = true;
                if (gate.isBoss) {
                    // Boss fight
                    const remaining = armyCount - gate.bossHP;
                    if (remaining > 0) {
                        armyCount = remaining;
                        updateArmyUnits();
                        spawnParticles(W / 2, H * 0.4, '#ffa500', 20);
                        spawnFloatingNumber(W / 2, H * 0.35, 'BOSS DEFEATED!', '#ffd700');
                        gameState = 'won';
                    } else {
                        armyCount = 0;
                        updateArmyUnits();
                        gameState = 'lost';
                    }
                } else {
                    // Normal gate - which side is the army on?
                    const midX = roadX + roadWidth / 2;
                    if (armyX < midX) {
                        applyGateValue(gate.leftValue);
                    } else {
                        applyGateValue(gate.rightValue);
                    }
                }
            }
        }

        // Check army death
        if (armyCount <= 0 && gameState === 'playing') {
            gameState = 'lost';
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Update floating numbers
        for (let i = floatingNumbers.length - 1; i >= 0; i--) {
            const f = floatingNumbers[i];
            f.y += f.vy;
            f.life--;
            if (f.life <= 0) floatingNumbers.splice(i, 1);
        }
    }

    function draw() {
        // Sky/background
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#b8d4b8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Grass sides
        ctx.fillStyle = '#6aaa6a';
        ctx.fillRect(0, 0, roadX, H);
        ctx.fillRect(roadX + roadWidth, 0, W - roadX - roadWidth, H);

        // Road
        ctx.fillStyle = '#777';
        ctx.fillRect(roadX, 0, roadWidth, H);

        // Road center line (dashed)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        const dashOffset = (distance * 2) % 40;
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(roadX + roadWidth / 2, 0);
        ctx.lineTo(roadX + roadWidth / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Road edge lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(roadX, 0);
        ctx.lineTo(roadX, H);
        ctx.moveTo(roadX + roadWidth, 0);
        ctx.lineTo(roadX + roadWidth, H);
        ctx.stroke();

        // Draw scenery
        scenery.forEach(s => {
            const sy = s.y + distance + H * 0.6;
            if (sy < -50 || sy > H + 50) return;
            if (s.type === 'tree') {
                ctx.fillStyle = '#5a8a5a';
                ctx.beginPath();
                ctx.arc(s.x, sy - 15, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(s.x - 3, sy - 5, 6, 15);
            } else {
                ctx.fillStyle = '#888';
                ctx.fillRect(s.x - 2, sy - 25, 4, 30);
                ctx.fillStyle = '#ffdd44';
                ctx.beginPath();
                ctx.arc(s.x, sy - 26, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw gates
        for (const gate of gates) {
            const gy = gate.y + distance + H * 0.6;
            if (gy < -80 || gy > H + 80) continue;

            if (gate.isBoss) {
                // Boss gate
                const bossSize = 40;
                ctx.fillStyle = gate.passed ? '#666' : '#8b0000';
                ctx.beginPath();
                ctx.arc(roadX + roadWidth / 2, gy, bossSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(roadX + roadWidth / 2, gy, bossSize * 0.75, 0, Math.PI * 2);
                ctx.fill();
                // Boss HP
                if (!gate.passed) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(gate.bossHP.toString(), roadX + roadWidth / 2, gy + 8);
                    ctx.font = '12px sans-serif';
                    ctx.fillText('BOSS', roadX + roadWidth / 2, gy - 30);
                }
                continue;
            }

            if (gate.passed) continue;

            const gateH = 60;
            const halfW = laneWidth;

            // Left gate
            const leftColor = (typeof gate.leftValue === 'string' || gate.leftValue > 0) ? '#e74c3c' : '#e74c3c';
            const leftIsGood = typeof gate.leftValue === 'string' || gate.leftValue > 0;
            ctx.fillStyle = leftIsGood ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)';
            ctx.fillRect(roadX, gy - gateH / 2, halfW, gateH);
            ctx.strokeStyle = leftIsGood ? '#27ae60' : '#c0392b';
            ctx.lineWidth = 3;
            ctx.strokeRect(roadX, gy - gateH / 2, halfW, gateH);

            // Left text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            const leftText = typeof gate.leftValue === 'string' ? gate.leftValue :
                (gate.leftValue > 0 ? '+' + gate.leftValue : '' + gate.leftValue);
            ctx.fillText(leftText, roadX + halfW / 2, gy + 10);

            // Right gate
            const rightIsGood = typeof gate.rightValue === 'string' || gate.rightValue > 0;
            ctx.fillStyle = rightIsGood ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)';
            ctx.fillRect(roadX + halfW, gy - gateH / 2, halfW, gateH);
            ctx.strokeStyle = rightIsGood ? '#27ae60' : '#c0392b';
            ctx.lineWidth = 3;
            ctx.strokeRect(roadX + halfW, gy - gateH / 2, halfW, gateH);

            // Right text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            const rightText = typeof gate.rightValue === 'string' ? gate.rightValue :
                (gate.rightValue > 0 ? '+' + gate.rightValue : '' + gate.rightValue);
            ctx.fillText(rightText, roadX + halfW + halfW / 2, gy + 10);

            // Divider
            ctx.fillStyle = '#fff';
            ctx.fillRect(roadX + halfW - 2, gy - gateH / 2, 4, gateH);
        }

        // Draw army
        const armyY = H * 0.65;
        const time = Date.now() / 1000;

        // Draw units
        armyUnits.forEach((unit, i) => {
            const bobY = Math.sin(time * 4 + unit.bobPhase) * 2;
            const ux = armyX + unit.offsetX;
            const uy = armyY + unit.offsetY + bobY;

            if (ux < roadX - 10 || ux > roadX + roadWidth + 10) return;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(ux, uy + 8, 5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = unit.color;
            ctx.beginPath();
            ctx.arc(ux, uy, 6, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#ffe0bd';
            ctx.beginPath();
            ctx.arc(ux, uy - 5, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Army count display
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(Math.round(armyDisplayCount).toString(), armyX, armyY - 25);
        ctx.fillText(Math.round(armyDisplayCount).toString(), armyX, armyY - 25);

        // Draw particles
        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw floating numbers
        floatingNumbers.forEach(f => {
            const alpha = f.life / 50;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = f.color;
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
        });
        ctx.globalAlpha = 1;

        // HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Level ' + level, W / 2, 40);

        // Progress bar
        const progW = W * 0.6;
        const progH = 10;
        const progX = (W - progW) / 2;
        const progY = 52;
        const progress = Math.min(totalDistance / levelLength, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(progX, progY, progW, progH);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(progX, progY, progW * progress, progH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(progX, progY, progW, progH);

        // Instruction
        if (totalDistance < 200) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '16px sans-serif';
            ctx.fillText('Drag left/right to choose gates', W / 2, H * 0.45);
        }

        // Win/lose screens
        if (gameState === 'won') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText('Army: ' + armyCount + ' soldiers', W / 2, H / 2 + 20);
            ctx.fillStyle = '#aaa';
            ctx.font = '16px sans-serif';
            ctx.fillText('Tap to continue', W / 2, H / 2 + 60);
        }

        if (gameState === 'lost') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DEFEATED', W / 2, H / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText('Your army was wiped out', W / 2, H / 2 + 20);
            ctx.fillStyle = '#aaa';
            ctx.font = '16px sans-serif';
            ctx.fillText('Tap to retry', W / 2, H / 2 + 60);
        }
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
