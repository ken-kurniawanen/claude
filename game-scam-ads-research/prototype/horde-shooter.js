// Horde Shooter - Player shoots at waves of enemies marching in formation
// Based on Last Z / Last Fortress style ads

function createHordeShooter(canvas, ctx) {
    const W = canvas.width;
    const H = canvas.height;

    // Game state
    let score = 0;
    let wave = 1;
    let gameOver = false;
    let playerHP = 100;
    let waveTimer = 0;
    let shakeTimer = 0;
    let shakeX = 0;
    let shakeY = 0;

    // Player
    const player = {
        x: W / 2,
        y: H * 0.82,
        size: 28,
        angle: -Math.PI / 2,
        fireRate: 8,
        fireCooldown: 0,
        damage: 25,
    };

    // Touch / mouse state
    let pointerX = W / 2;
    let pointerY = H / 2;
    let pointerDown = false;

    // Bullets
    const bullets = [];
    // Enemies
    let enemies = [];
    // Particles
    const particles = [];
    // Damage numbers
    const damageNumbers = [];
    // Muzzle flash
    let muzzleFlash = 0;

    // Spawn a wave of enemies in formation
    function spawnWave() {
        const rows = Math.min(3 + Math.floor(wave / 2), 8);
        const cols = Math.min(4 + Math.floor(wave / 3), 10);
        const spacing = 30;
        const startX = W / 2 - (cols - 1) * spacing / 2;
        const startY = -rows * spacing - 40;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({
                    x: startX + c * spacing + (Math.random() - 0.5) * 6,
                    y: startY + r * spacing,
                    hp: 30 + wave * 10,
                    maxHp: 30 + wave * 10,
                    size: 14,
                    speed: 0.4 + wave * 0.05,
                    type: Math.random() < 0.15 ? 'big' : 'normal',
                });
            }
        }
        // Make big ones actually big
        enemies.forEach(e => {
            if (e.type === 'big') {
                e.size = 20;
                e.hp *= 3;
                e.maxHp *= 3;
                e.speed *= 0.7;
            }
        });
    }

    function shootBullet() {
        const dx = pointerX - player.x;
        const dy = pointerY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const speed = 12;
        bullets.push({
            x: player.x,
            y: player.y - player.size / 2,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            damage: player.damage,
        });
        muzzleFlash = 4;
    }

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 15,
                maxLife: 35,
                size: 2 + Math.random() * 3,
                color,
            });
        }
    }

    function spawnDamageNumber(x, y, value) {
        damageNumbers.push({
            x, y,
            value,
            life: 40,
            vy: -1.5,
        });
    }

    // Input handlers
    function onPointerDown(e) {
        e.preventDefault();
        pointerDown = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        pointerX = touch.clientX - rect.left;
        pointerY = touch.clientY - rect.top;
    }
    function onPointerMove(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        pointerX = touch.clientX - rect.left;
        pointerY = touch.clientY - rect.top;
    }
    function onPointerUp(e) {
        e.preventDefault();
        pointerDown = false;
    }

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp, { passive: false });

    // Initial wave
    spawnWave();

    function update() {
        if (gameOver) return;

        // Screen shake decay
        if (shakeTimer > 0) {
            shakeTimer--;
            shakeX = (Math.random() - 0.5) * shakeTimer;
            shakeY = (Math.random() - 0.5) * shakeTimer;
        } else {
            shakeX = 0;
            shakeY = 0;
        }

        // Player aiming
        const dx = pointerX - player.x;
        const dy = pointerY - player.y;
        player.angle = Math.atan2(dy, dx);

        // Shooting
        if (pointerDown) {
            player.fireCooldown--;
            if (player.fireCooldown <= 0) {
                shootBullet();
                player.fireCooldown = player.fireRate;
            }
        }

        // Muzzle flash
        if (muzzleFlash > 0) muzzleFlash--;

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                bullets.splice(i, 1);
                continue;
            }
            // Check collision with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const edx = b.x - e.x;
                const edy = b.y - e.y;
                if (edx * edx + edy * edy < (e.size + 4) * (e.size + 4)) {
                    e.hp -= b.damage;
                    spawnDamageNumber(e.x, e.y - e.size, b.damage);
                    spawnParticles(b.x, b.y, '#ffaa00', 3);
                    bullets.splice(i, 1);
                    if (e.hp <= 0) {
                        score += e.type === 'big' ? 30 : 10;
                        spawnParticles(e.x, e.y, '#ff4444', 8);
                        shakeTimer = 5;
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            // Move toward player
            const edx = player.x - e.x;
            const edy = player.y - e.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            if (edist > 0) {
                e.x += (edx / edist) * e.speed;
                e.y += (edy / edist) * e.speed;
            }
            // Check if reached player
            if (edist < player.size + e.size) {
                playerHP -= 1;
                if (playerHP <= 0) {
                    gameOver = true;
                }
            }
        }

        // Spawn next wave
        if (enemies.length === 0) {
            waveTimer++;
            if (waveTimer > 60) {
                wave++;
                waveTimer = 0;
                playerHP = Math.min(100, playerHP + 20);
                spawnWave();
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Update damage numbers
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const d = damageNumbers[i];
            d.y += d.vy;
            d.life--;
            if (d.life <= 0) damageNumbers.splice(i, 1);
        }
    }

    function draw() {
        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Background - platform/ground
        ctx.fillStyle = '#3a3a5c';
        ctx.fillRect(0, 0, W, H);

        // Ground platform
        const groundY = H * 0.7;
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(0, groundY, W, H - groundY);

        // Grid lines on ground
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = groundY; y < H; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Path/bridge for enemies
        const pathW = W * 0.55;
        const pathX = (W - pathW) / 2;
        ctx.fillStyle = '#555580';
        ctx.fillRect(pathX, 0, pathW, groundY);
        // Path rails
        ctx.fillStyle = '#6a6a90';
        ctx.fillRect(pathX - 4, 0, 4, groundY);
        ctx.fillRect(pathX + pathW, 0, 4, groundY);

        // Draw enemies
        enemies.forEach(e => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(e.x, e.y + e.size, e.size * 0.8, e.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            if (e.type === 'big') {
                // Big enemy (tank-like)
                ctx.fillStyle = '#8b0000';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff2222';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.fillRect(e.x - 5, e.y - 4, 4, 4);
                ctx.fillRect(e.x + 1, e.y - 4, 4, 4);
                ctx.fillStyle = '#f00';
                ctx.fillRect(e.x - 4, e.y - 3, 2, 2);
                ctx.fillRect(e.x + 2, e.y - 3, 2, 2);
            } else {
                // Normal enemy (zombie soldier)
                // Body
                ctx.fillStyle = '#4a6a4a';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.fillStyle = '#5a7a5a';
                ctx.beginPath();
                ctx.arc(e.x, e.y - 4, e.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff0';
                ctx.fillRect(e.x - 4, e.y - 6, 3, 2);
                ctx.fillRect(e.x + 1, e.y - 6, 3, 2);
            }

            // HP bar
            if (e.hp < e.maxHp) {
                const barW = e.size * 2;
                const barH = 3;
                const barX = e.x - barW / 2;
                const barY = e.y - e.size - 8;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#4caf50' : '#f44336';
                ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
            }
        });

        // Draw bullets
        bullets.forEach(b => {
            // Bullet trail
            ctx.fillStyle = '#ffdd44';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.arc(b.x - b.vx * 0.3, b.y - b.vy * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw player
        const px = player.x;
        const py = player.y;

        // Body
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(px, py, player.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner body detail
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(px, py - 4, player.size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Gun
        const gunLen = 22;
        const gunX = px + Math.cos(player.angle) * gunLen;
        const gunY = py + Math.sin(player.angle) * gunLen;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(gunX, gunY);
        ctx.stroke();

        // Muzzle flash
        if (muzzleFlash > 0) {
            const flashSize = 10 + Math.random() * 8;
            const gradient = ctx.createRadialGradient(gunX, gunY, 0, gunX, gunY, flashSize);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(gunX, gunY, flashSize, 0, Math.PI * 2);
            ctx.fill();
        }

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

        // Draw damage numbers
        damageNumbers.forEach(d => {
            const alpha = d.life / 40;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('-' + d.value, d.x, d.y);
        });
        ctx.globalAlpha = 1;

        // HUD
        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Score: ' + score, W / 2, 40);

        // Wave
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ffa500';
        ctx.fillText('Wave ' + wave, W / 2, 65);

        // HP bar
        const hpBarW = 160;
        const hpBarH = 14;
        const hpBarX = W / 2 - hpBarW / 2;
        const hpBarY = H - 50;
        ctx.fillStyle = '#333';
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
        ctx.fillStyle = playerHP > 30 ? '#4caf50' : '#f44336';
        ctx.fillRect(hpBarX, hpBarY, hpBarW * (playerHP / 100), hpBarH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.fillText('HP', W / 2, hpBarY + 11);

        // Enemy count
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(enemies.length.toString(), 20, 55);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ffaaaa';
        ctx.fillText('enemies', 22, 72);

        // Next wave message
        if (enemies.length === 0 && !gameOver) {
            ctx.fillStyle = '#4ecdc4';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Wave ' + (wave + 1) + ' incoming...', W / 2, H / 2);
        }

        // Game over
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText('Score: ' + score + '  |  Wave: ' + wave, W / 2, H / 2 + 20);
            ctx.fillStyle = '#aaa';
            ctx.font = '16px sans-serif';
            ctx.fillText('Tap to restart', W / 2, H / 2 + 60);
        }

        ctx.restore();
    }

    // Restart on tap when game over
    function onRestart(e) {
        if (!gameOver) return;
        e.preventDefault();
        score = 0;
        wave = 1;
        playerHP = 100;
        gameOver = false;
        enemies = [];
        bullets.length = 0;
        particles.length = 0;
        damageNumbers.length = 0;
        spawnWave();
    }
    canvas.addEventListener('click', onRestart);
    canvas.addEventListener('touchstart', onRestart, { passive: false });

    return {
        update,
        draw,
        cleanup() {
            canvas.removeEventListener('mousedown', onPointerDown);
            canvas.removeEventListener('mousemove', onPointerMove);
            canvas.removeEventListener('mouseup', onPointerUp);
            canvas.removeEventListener('touchstart', onPointerDown);
            canvas.removeEventListener('touchmove', onPointerMove);
            canvas.removeEventListener('touchend', onPointerUp);
            canvas.removeEventListener('click', onRestart);
            canvas.removeEventListener('touchstart', onRestart);
        }
    };
}
