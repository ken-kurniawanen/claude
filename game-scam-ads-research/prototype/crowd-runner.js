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

    // =====================
    // BATTLE PHASE FUNCTIONS
    // =====================

    function spawnBattleEnemies() {
        enemies = [];
        const rows = Math.min(2 + Math.floor(level / 2), 6);
        const cols = Math.min(3 + Math.floor(level / 3), 8);
        const spacing = 30;
        const startX = W / 2 - (cols - 1) * spacing / 2;
        const startY = -rows * spacing - 40;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({
                    x: startX + c * spacing + (Math.random() - 0.5) * 6,
                    y: startY + r * spacing,
                    hp: 20 + level * 8,
                    maxHp: 20 + level * 8,
                    size: 14,
                    speed: 0.35 + level * 0.04,
                    type: Math.random() < 0.12 ? 'big' : 'normal',
                });
            }
        }
        enemies.forEach(e => {
            if (e.type === 'big') {
                e.size = 20;
                e.hp *= 3;
                e.maxHp *= 3;
                e.speed *= 0.7;
            }
        });
    }

    function shootBullet(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const spd = 10;
        bullets.push({
            x: fromX, y: fromY,
            vx: (dx / dist) * spd, vy: (dy / dist) * spd,
            damage: 15 + Math.floor(level * 2),
        });
    }

    function findNearestEnemy(x, y) {
        let nearest = null;
        let nearDist = Infinity;
        for (const e of enemies) {
            const dx = e.x - x;
            const dy = e.y - y;
            const d = dx * dx + dy * dy;
            if (d < nearDist) { nearDist = d; nearest = e; }
        }
        return nearest;
    }

    function updateBattlePhase() {
        battleTimer++;

        // Screen shake decay
        if (shakeTimer > 0) {
            shakeTimer--;
            shakeX = (Math.random() - 0.5) * shakeTimer;
            shakeY = (Math.random() - 0.5) * shakeTimer;
        } else { shakeX = 0; shakeY = 0; }

        // Army auto-fires at nearest enemy
        autoFireTimer++;
        const fireRate = Math.max(4, 12 - Math.floor(armyCount / 15));
        if (autoFireTimer >= fireRate && enemies.length > 0) {
            autoFireTimer = 0;
            // Multiple soldiers fire based on army size
            const shooters = Math.min(Math.ceil(armyCount / 8), 6);
            for (let s = 0; s < shooters; s++) {
                const target = findNearestEnemy(W / 2, H * 0.75);
                if (!target) break;
                const offsetX = (Math.random() - 0.5) * Math.min(armyCount * 2, 80);
                shootBullet(W / 2 + offsetX, H * 0.75, target.x + (Math.random() - 0.5) * 10, target.y);
            }
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx; b.y += b.vy;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                bullets.splice(i, 1); continue;
            }
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (dx * dx + dy * dy < (e.size + 4) * (e.size + 4)) {
                    e.hp -= b.damage;
                    spawnFloatingNumber(e.x, e.y - e.size, '-' + b.damage, '#ff4444');
                    spawnParticles(b.x, b.y, '#ffaa00', 3);
                    bullets.splice(i, 1);
                    if (e.hp <= 0) {
                        enemiesDefeated++;
                        spawnParticles(e.x, e.y, '#ff4444', 8);
                        shakeTimer = 5;
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Update enemies - march toward army
        const armyBaseY = H * 0.75;
        for (const e of enemies) {
            const dx = W / 2 - e.x;
            const dy = armyBaseY - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }
            // Enemy reaches army - kills soldiers
            if (dist < 30) {
                armyCount = Math.max(0, armyCount - 1);
                e.hp = 0; // enemy dies on contact too
                spawnParticles(e.x, e.y, '#f44336', 5);
                updateArmyUnits();
            }
        }
        // Remove dead enemies from contact
        enemies = enemies.filter(e => e.hp > 0);

        // Animate display count
        if (armyDisplayCount < armyCount) armyDisplayCount = Math.min(armyDisplayCount + 1, armyCount);
        if (armyDisplayCount > armyCount) armyDisplayCount = Math.max(armyDisplayCount - 1, armyCount);

        // Check win/lose
        if (armyCount <= 0) { phase = 'lost'; return; }
        if (enemies.length === 0) {
            phase = 'won';
            spawnParticles(W / 2, H * 0.5, '#ffd700', 25);
            spawnFloatingNumber(W / 2, H * 0.35, 'VICTORY!', '#ffd700');
        }
    }

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

    // =====================
    // DRAW FUNCTIONS
    // =====================

    function drawGatePhase() {
        // Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#b8d4b8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Grass
        ctx.fillStyle = '#6aaa6a';
        ctx.fillRect(0, 0, roadX, H);
        ctx.fillRect(roadX + roadWidth, 0, W - roadX - roadWidth, H);

        // Road
        ctx.fillStyle = '#777';
        ctx.fillRect(roadX, 0, roadWidth, H);

        // Dashed center line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -((distance * 2) % 40);
        ctx.beginPath();
        ctx.moveTo(roadX + roadWidth / 2, 0);
        ctx.lineTo(roadX + roadWidth / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Road edges
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(roadX, 0); ctx.lineTo(roadX, H);
        ctx.moveTo(roadX + roadWidth, 0); ctx.lineTo(roadX + roadWidth, H);
        ctx.stroke();

        // Scenery
        scenery.forEach(s => {
            const sy = s.y + distance + H * 0.6;
            if (sy < -50 || sy > H + 50) return;
            if (s.type === 'tree') {
                ctx.fillStyle = '#5a8a5a';
                ctx.beginPath(); ctx.arc(s.x, sy - 15, 14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(s.x - 3, sy - 5, 6, 15);
            } else {
                ctx.fillStyle = '#888';
                ctx.fillRect(s.x - 2, sy - 25, 4, 30);
                ctx.fillStyle = '#ffdd44';
                ctx.beginPath(); ctx.arc(s.x, sy - 26, 5, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Gates
        for (const gate of gates) {
            const gy = gate.y + distance + H * 0.6;
            if (gy < -80 || gy > H + 80 || gate.passed) continue;

            const gateH = 60;
            const halfW = laneWidth;

            // Left gate
            const leftIsGood = typeof gate.leftValue === 'string' || gate.leftValue > 0;
            ctx.fillStyle = leftIsGood ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)';
            ctx.fillRect(roadX, gy - gateH / 2, halfW, gateH);
            ctx.strokeStyle = leftIsGood ? '#27ae60' : '#c0392b';
            ctx.lineWidth = 3;
            ctx.strokeRect(roadX, gy - gateH / 2, halfW, gateH);

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

            ctx.fillStyle = '#fff';
            const rightText = typeof gate.rightValue === 'string' ? gate.rightValue :
                (gate.rightValue > 0 ? '+' + gate.rightValue : '' + gate.rightValue);
            ctx.fillText(rightText, roadX + halfW + halfW / 2, gy + 10);

            // Divider
            ctx.fillStyle = '#fff';
            ctx.fillRect(roadX + halfW - 2, gy - gateH / 2, 4, gateH);
        }

        // Draw army
        drawArmy(armyX, H * 0.65);

        // HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Level ' + level + ' - Gate Run', W / 2, 40);

        // Progress bar
        const progW = W * 0.6;
        const progX = (W - progW) / 2;
        const progress = Math.min(totalDistance / levelLength, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(progX, 52, progW, 10);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(progX, 52, progW * progress, 10);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.strokeRect(progX, 52, progW, 10);

        if (totalDistance < 200) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '16px sans-serif';
            ctx.fillText('Drag left/right to choose gates', W / 2, H * 0.45);
        }
    }

    function drawBattlePhase() {
        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Background
        ctx.fillStyle = '#3a3a5c';
        ctx.fillRect(0, 0, W, H);

        // Ground
        const groundY = H * 0.6;
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(0, groundY, W, H - groundY);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = groundY; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Enemies
        enemies.forEach(e => {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(e.x, e.y + e.size, e.size * 0.8, e.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            if (e.type === 'big') {
                ctx.fillStyle = '#8b0000';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff2222';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(e.x - 5, e.y - 4, 4, 4);
                ctx.fillRect(e.x + 1, e.y - 4, 4, 4);
                ctx.fillStyle = '#f00';
                ctx.fillRect(e.x - 4, e.y - 3, 2, 2);
                ctx.fillRect(e.x + 2, e.y - 3, 2, 2);
            } else {
                ctx.fillStyle = '#4a6a4a';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#5a7a5a';
                ctx.beginPath(); ctx.arc(e.x, e.y - 4, e.size * 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff0';
                ctx.fillRect(e.x - 4, e.y - 6, 3, 2);
                ctx.fillRect(e.x + 1, e.y - 6, 3, 2);
            }

            // HP bar
            if (e.hp < e.maxHp) {
                const barW = e.size * 2;
                const barX = e.x - barW / 2;
                const barY = e.y - e.size - 8;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, 3);
                ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#4caf50' : '#f44336';
                ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), 3);
            }
        });

        // Bullets
        bullets.forEach(b => {
            ctx.fillStyle = '#ffdd44';
            ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff8800';
            ctx.beginPath(); ctx.arc(b.x - b.vx * 0.3, b.y - b.vy * 0.3, 3, 0, Math.PI * 2); ctx.fill();
        });

        // Army at bottom
        drawArmy(W / 2, H * 0.75);

        // HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Level ' + level + ' - BATTLE', W / 2, 40);

        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(enemies.length.toString(), 20, 50);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#ffaaaa';
        ctx.fillText('enemies left', 22, 67);

        ctx.restore();
    }

    function drawArmy(cx, cy) {
        const time = Date.now() / 1000;
        armyUnits.forEach(unit => {
            const bobY = Math.sin(time * 4 + unit.bobPhase) * 2;
            const ux = cx + unit.offsetX;
            const uy = cy + unit.offsetY + bobY;

            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath(); ctx.ellipse(ux, uy + 8, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = unit.color;
            ctx.beginPath(); ctx.arc(ux, uy, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffe0bd';
            ctx.beginPath(); ctx.arc(ux, uy - 5, 4, 0, Math.PI * 2); ctx.fill();
        });

        // Count
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(Math.round(armyDisplayCount).toString(), cx, cy - 25);
        ctx.fillText(Math.round(armyDisplayCount).toString(), cx, cy - 25);
    }

    function drawFX() {
        particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        floatingNumbers.forEach(f => {
            ctx.globalAlpha = f.life / 50;
            ctx.fillStyle = f.color;
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
        });
        ctx.globalAlpha = 1;
    }

    function drawTransition() {
        // Fade from gate bg to battle bg
        const t = 1 - transitionTimer / 90;
        ctx.fillStyle = `rgb(${Math.round(135 - 77 * t)}, ${Math.round(206 - 148 * t)}, ${Math.round(235 - 143 * t)})`;
        ctx.fillRect(0, 0, W, H);

        drawArmy(W / 2, H * 0.6);

        ctx.fillStyle = '#ffa500';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PREPARE FOR BATTLE!', W / 2, H * 0.35);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Army: ' + armyCount + ' soldiers', W / 2, H * 0.42);
    }

    function drawResult() {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        if (phase === 'won') {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 40);
            ctx.fillStyle = '#fff';
            ctx.font = '22px sans-serif';
            ctx.fillText('Survivors: ' + armyCount + ' soldiers', W / 2, H / 2 + 10);
            ctx.fillText('Enemies defeated: ' + enemiesDefeated, W / 2, H / 2 + 40);
        } else {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DEFEATED', W / 2, H / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText('Your army was wiped out', W / 2, H / 2 + 20);
        }

        ctx.fillStyle = '#aaa';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tap to ' + (phase === 'won' ? 'continue' : 'retry'), W / 2, H / 2 + 80);
    }

    function draw() {
        if (phase === 'gate') drawGatePhase();
        else if (phase === 'transition') drawTransition();
        else if (phase === 'battle') drawBattlePhase();

        drawFX();

        if (phase === 'won' || phase === 'lost') drawResult();
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
