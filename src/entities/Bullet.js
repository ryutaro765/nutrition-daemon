import { GAME_CONFIG, BULLET_CONFIG } from '../config/gameConfig.js';

/**
 * 弾丸クラス
 * プレイヤーと敵の各種弾丸を管理
 */
export class Bullet {
    constructor(options = {}) {
        // 基本プロパティ
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0; // X方向速度
        this.vy = options.vy || 0; // Y方向速度
        this.width = options.width || 8;
        this.height = options.height || 16;
        this.damage = options.damage || 25;
        this.color = options.color || '#ffffff';
        this.isPlayerBullet = options.isPlayerBullet || false;
        
        // 弾丸タイプ
        this.type = options.type || 'normal'; // normal, laser, flame, thunder, fireball, sword
        this.weaponLevel = options.weaponLevel || 1;
        
        // 特殊プロパティ
        this.life = options.life || -1; // -1は無限
        this.maxLife = options.maxLife || 60;
        this.scale = options.scale || 1;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        
        // 強化弾用エフェクト
        this.glowColor = options.glowColor || null;
        this.glowRadius = options.glowRadius || 0;
        this.trailLength = options.trailLength || 0;
        this.trailAlpha = options.trailAlpha || 0.7;
        this.sparkleCount = options.sparkleCount || 0;
        this.wobbleAmplitude = options.wobbleAmplitude || 0;
        this.fireParticleCount = options.fireParticleCount || 0;
        this.pulsePeriod = options.pulsePeriod || 20;
        this.secondaryColor = options.secondaryColor || null;
        
        // 雷撃弾用ジグザグ
        this.zigzagTime = 0;
        this.zigzagAmplitude = options.zigzagAmplitude || 30;
        this.zigzagFrequency = options.zigzagFrequency || 0.3;
        this.baseVx = this.vx;
        
        // ファイヤーボール用軌跡
        this.trail = [];
        this.maxTrailLength = Math.max(10, this.trailLength || 0);
        
        // 強化弾用エフェクト追加プロパティ
        this.wobbleTime = 0;
        this.baseX = this.x;
        this.baseY = this.y;
        this.sparkleTimer = 0;
        
        // 炎弾用パーティクル
        this.particles = [];
        this.particleSpawnTimer = 0;
        
        // 削除フラグ
        this.shouldRemove = false;
        
        // エフェクト用タイマー
        this.effectTimer = 0;
    }

    /**
     * 弾丸更新
     */
    update() {
        // ライフタイムチェック
        if (this.life > 0) {
            this.life--;
            if (this.life <= 0) {
                this.shouldRemove = true;
                return;
            }
        }

        // タイプ別更新処理
        switch (this.type) {
            case 'megaLaser':
                this.updateMegaLaser();
                break;
            case 'flame':
                this.updateFlame();
                break;
            case 'thunder':
                this.updateThunder();
                break;
            case 'fireball':
                this.updateFireball();
                break;
            case 'sword':
                this.updateSword();
                break;
            case 'deluxe3way':
                this.updateDeluxe3Way();
                break;
            case 'deluxe5way':
                this.updateDeluxe5Way();
                break;
            case 'deluxecircle':
                this.updateDeluxeCircle();
                break;
            default:
                this.updateNormal();
                break;
        }

        // 画面外チェック
        this.checkBounds();
        
        // エフェクトタイマー
        this.effectTimer++;
    }

    /**
     * 通常弾更新
     */
    updateNormal() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
    }

    /**
     * メガレーザー更新
     */
    updateMegaLaser() {
        // レーザーは移動しない（固定位置で描画）
        this.y = 0; // 画面上端から
        this.height = GAME_CONFIG.CANVAS_HEIGHT; // 画面下端まで
    }

    /**
     * 炎弾更新
     */
    updateFlame() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 上昇する炎の演出
        this.vy -= 0.1; // 重力風の減速
        this.vx *= 0.99; // 空気抵抗
        
        // パーティクル生成
        this.particleSpawnTimer++;
        if (this.particleSpawnTimer % 3 === 0) {
            this.spawnFlameParticle();
        }
        
        // 既存パーティクル更新
        this.updateParticles();
    }

    /**
     * 雷撃弾更新
     */
    updateThunder() {
        this.zigzagTime += this.zigzagFrequency;
        
        // ジグザグ移動
        this.vx = this.baseVx + Math.sin(this.zigzagTime) * this.zigzagAmplitude * 0.1;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 雷エフェクト
        this.rotation = Math.sin(this.zigzagTime * 2) * 30; // 小刻みな回転
    }

    /**
     * ファイヤーボール更新
     */
    updateFireball() {
        // 軌跡記録
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 5; // 回転
        
        // 軌跡パーティクル生成
        if (this.effectTimer % 2 === 0) {
            this.spawnFireballParticle();
        }
        
        this.updateParticles();
    }

    /**
     * ソード弾更新
     */
    updateSword() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed || 10; // 回転
    }

    /**
     * デラックス3WAY弾更新
     */
    updateDeluxe3Way() {
        // 軌跡記録
        if (this.trailLength > 0) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // 基本移動
        this.x += this.vx;
        this.y += this.vy;
        
        // 回転
        this.rotation += this.rotationSpeed || 0;
        
        // スパークルタイマー更新
        this.sparkleTimer++;
    }

    /**
     * デラックス5WAY弾更新
     */
    updateDeluxe5Way() {
        // 軌跡記録
        if (this.trailLength > 0) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // ワブル（揺れ）効果
        this.wobbleTime += 0.3;
        const wobbleOffset = Math.sin(this.wobbleTime) * (this.wobbleAmplitude || 0);
        
        // 基本移動 + ワブル
        this.x += this.vx + wobbleOffset * 0.1;
        this.y += this.vy;
        
        // 回転
        this.rotation += this.rotationSpeed || 0;
        
        // スパークルタイマー更新
        this.sparkleTimer++;
        
        // スパークルパーティクル生成
        if (this.sparkleCount > 0 && this.sparkleTimer % 8 === 0) {
            this.spawnSparkle();
        }
    }

    /**
     * デラックスサークル弾更新
     */
    updateDeluxeCircle() {
        // 軌跡記録
        if (this.trailLength > 0) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // 基本移動
        this.x += this.vx;
        this.y += this.vy;
        
        // 回転
        this.rotation += this.rotationSpeed || 0;
        
        // パルス効果用
        this.effectTimer++;
        
        // ファイアパーティクル生成
        if (this.fireParticleCount > 0 && this.effectTimer % 4 === 0) {
            this.spawnFireParticle();
        }
    }

    /**
     * 炎パーティクル生成
     */
    spawnFlameParticle() {
        this.particles.push({
            x: this.x + (Math.random() - 0.5) * this.width,
            y: this.y + (Math.random() - 0.5) * this.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 20,
            maxLife: 20,
            size: Math.random() * 3 + 1
        });
    }

    /**
     * ファイヤーボールパーティクル生成
     */
    spawnFireballParticle() {
        this.particles.push({
            x: this.x + (Math.random() - 0.5) * this.width,
            y: this.y + (Math.random() - 0.5) * this.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 15,
            maxLife: 15,
            size: Math.random() * 4 + 2
        });
    }

    /**
     * スパークルパーティクル生成
     */
    spawnSparkle() {
        for (let i = 0; i < (this.sparkleCount || 1); i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * this.width * 2,
                y: this.y + (Math.random() - 0.5) * this.height * 2,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 10,
                maxLife: 10,
                size: Math.random() * 2 + 1,
                type: 'sparkle'
            });
        }
    }

    /**
     * ファイアパーティクル生成（円形弾用）
     */
    spawnFireParticle() {
        for (let i = 0; i < (this.fireParticleCount || 1); i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 12,
                maxLife: 12,
                size: Math.random() * 3 + 1,
                type: 'fire'
            });
        }
    }

    /**
     * パーティクル更新
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * 画面外チェック
     */
    checkBounds() {
        const margin = 50;
        if (this.x < -margin || 
            this.x > GAME_CONFIG.CANVAS_WIDTH + margin || 
            this.y < -margin || 
            this.y > GAME_CONFIG.CANVAS_HEIGHT + margin) {
            
            // レーザーは画面外判定しない
            if (this.type !== 'megaLaser') {
                this.shouldRemove = true;
            }
        }
    }

    /**
     * 描画処理
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        switch (this.type) {
            case 'megaLaser':
                this.drawMegaLaser(renderer);
                break;
            case 'flame':
                this.drawFlame(renderer);
                break;
            case 'thunder':
                this.drawThunder(renderer);
                break;
            case 'fireball':
                this.drawFireball(renderer);
                break;
            case 'sword':
                this.drawSword(renderer);
                break;
            case 'deluxe3way':
                this.drawDeluxe3Way(renderer);
                break;
            case 'deluxe5way':
                this.drawDeluxe5Way(renderer);
                break;
            case 'deluxecircle':
                this.drawDeluxeCircle(renderer);
                break;
            default:
                this.drawNormal(renderer);
                break;
        }
    }

    /**
     * 通常弾描画
     * @param {Object} renderer - レンダラー
     */
    drawNormal(renderer) {
        if (this.rotation !== 0) {
            renderer.ctx.save();
            renderer.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            renderer.ctx.rotate(this.rotation * Math.PI / 180);
            renderer.drawRect(-this.width / 2, -this.height / 2, this.width, this.height, this.color);
            renderer.ctx.restore();
        } else {
            renderer.drawRect(this.x, this.y, this.width, this.height, this.color);
        }
    }

    /**
     * メガレーザー描画
     * @param {Object} renderer - レンダラー
     */
    drawMegaLaser(renderer) {
        // 外側の光（範囲縮小）
        renderer.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        renderer.ctx.fillRect(this.x - 10, this.y, this.width + 20, this.height);
        
        // 中間の光
        renderer.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        renderer.ctx.fillRect(this.x - 5, this.y, this.width + 10, this.height);
        
        // メインレーザー
        renderer.ctx.fillStyle = '#00ffff';
        renderer.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 内側の明るい部分
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.fillRect(this.x + this.width * 0.3, this.y, this.width * 0.4, this.height);
        
        // きらめきエフェクト
        for (let i = 0; i < 20; i++) {
            const sparkX = this.x + Math.random() * this.width;
            const sparkY = this.y + Math.random() * this.height;
            const sparkSize = Math.random() * 3 + 1;
            
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
            renderer.ctx.fillRect(sparkX, sparkY, sparkSize, sparkSize);
        }
    }

    /**
     * 炎弾描画
     * @param {Object} renderer - レンダラー
     */
    drawFlame(renderer) {
        // パーティクル描画
        this.drawFlameParticles(renderer);
        
        // メイン炎弾
        const gradient = renderer.ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff8800');
        gradient.addColorStop(1, '#ff0000');
        
        renderer.ctx.fillStyle = gradient;
        renderer.ctx.beginPath();
        renderer.ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2, 
            0, 
            Math.PI * 2
        );
        renderer.ctx.fill();
    }

    /**
     * 雷撃弾描画
     * @param {Object} renderer - レンダラー
     */
    drawThunder(renderer) {
        // 電気エフェクト
        renderer.ctx.strokeStyle = '#ffff00';
        renderer.ctx.lineWidth = 3;
        renderer.ctx.lineCap = 'round';
        
        // ジグザグライトニング
        renderer.ctx.beginPath();
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = this.x + t * this.width;
            const y = this.y + t * this.height + Math.sin(this.zigzagTime + i) * 5;
            
            if (i === 0) {
                renderer.ctx.moveTo(x, y);
            } else {
                renderer.ctx.lineTo(x, y);
            }
        }
        renderer.ctx.stroke();
        
        // 中心の明るい部分
        renderer.ctx.strokeStyle = '#ffffff';
        renderer.ctx.lineWidth = 1;
        renderer.ctx.stroke();
        
        // 電気球
        renderer.ctx.fillStyle = '#ffff00';
        renderer.ctx.beginPath();
        renderer.ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            4, 
            0, 
            Math.PI * 2
        );
        renderer.ctx.fill();
    }

    /**
     * ファイヤーボール描画
     * @param {Object} renderer - レンダラー
     */
    drawFireball(renderer) {
        // 軌跡描画
        this.drawFireballTrail(renderer);
        
        // パーティクル描画
        this.drawFireballParticles(renderer);
        
        // メインファイヤーボール（多層）
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 外側の炎
        renderer.ctx.fillStyle = '#ff0000';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 中間の炎
        renderer.ctx.fillStyle = '#ff8800';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, this.width * 0.35, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 内側の炎
        renderer.ctx.fillStyle = '#ffff00';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, this.width * 0.2, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 中心の白い核
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, this.width * 0.1, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * ソード弾描画
     * @param {Object} renderer - レンダラー
     */
    drawSword(renderer) {
        renderer.ctx.save();
        renderer.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        renderer.ctx.rotate(this.rotation * Math.PI / 180);
        
        // ソードの刃
        renderer.ctx.fillStyle = '#c0c0c0';
        renderer.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height * 0.8);
        
        // ソードの柄
        renderer.ctx.fillStyle = '#8b4513';
        renderer.ctx.fillRect(-this.width * 0.3, this.height * 0.3, this.width * 0.6, this.height * 0.2);
        
        renderer.ctx.restore();
    }

    /**
     * デラックス3WAY弾描画
     * @param {Object} renderer - レンダラー
     */
    drawDeluxe3Way(renderer) {
        // 軌跡描画
        this.drawBulletTrail(renderer);
        
        // グロー効果
        if (this.glowRadius > 0) {
            this.drawGlow(renderer);
        }
        
        // メイン弾丸
        renderer.ctx.save();
        renderer.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        renderer.ctx.rotate(this.rotation * Math.PI / 180);
        
        // グラデーション作成
        const gradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color || '#00ffff');
        gradient.addColorStop(1, '#0088cc');
        
        renderer.ctx.fillStyle = gradient;
        renderer.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 中心のハイライト
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.fillRect(-this.width / 4, -this.height / 2, this.width / 2, this.height);
        
        renderer.ctx.restore();
        
        // パーティクル描画
        this.drawBulletParticles(renderer);
    }

    /**
     * デラックス5WAY弾描画
     * @param {Object} renderer - レンダラー
     */
    drawDeluxe5Way(renderer) {
        // 軌跡描画
        this.drawBulletTrail(renderer);
        
        // グロー効果
        if (this.glowRadius > 0) {
            this.drawGlow(renderer);
        }
        
        // メイン弾丸
        renderer.ctx.save();
        renderer.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        renderer.ctx.rotate(this.rotation * Math.PI / 180);
        
        // グラデーション作成（マゼンタ系）
        const gradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color || '#ff00ff');
        gradient.addColorStop(1, '#cc0088');
        
        renderer.ctx.fillStyle = gradient;
        renderer.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 外側のオーラ
        if (this.glowColor) {
            renderer.ctx.fillStyle = this.glowColor;
            renderer.ctx.globalAlpha = 0.3;
            renderer.ctx.fillRect(-this.width / 1.5, -this.height / 1.5, this.width * 1.5, this.height * 1.5);
            renderer.ctx.globalAlpha = 1.0;
        }
        
        renderer.ctx.restore();
        
        // パーティクル描画
        this.drawBulletParticles(renderer);
    }

    /**
     * デラックスサークル弾描画
     * @param {Object} renderer - レンダラー
     */
    drawDeluxeCircle(renderer) {
        // 軌跡描画
        this.drawBulletTrail(renderer);
        
        // グロー効果
        if (this.glowRadius > 0) {
            this.drawGlow(renderer);
        }
        
        // パルス効果
        const pulseScale = this.pulsePeriod > 0 ? 
            1 + Math.sin(this.effectTimer / this.pulsePeriod) * 0.2 : 1;
        
        renderer.ctx.save();
        renderer.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        renderer.ctx.rotate(this.rotation * Math.PI / 180);
        renderer.ctx.scale(pulseScale, pulseScale);
        
        // 外側の炎
        const outerGradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        outerGradient.addColorStop(0, '#ffffff');
        outerGradient.addColorStop(0.3, this.color || '#ff8c00');
        outerGradient.addColorStop(0.7, this.secondaryColor || '#ff4500');
        outerGradient.addColorStop(1, '#cc2200');
        
        renderer.ctx.fillStyle = outerGradient;
        renderer.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 内側の明るい部分
        const innerGradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 4);
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(1, this.color || '#ff8c00');
        
        renderer.ctx.fillStyle = innerGradient;
        renderer.ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 2);
        
        renderer.ctx.restore();
        
        // パーティクル描画
        this.drawBulletParticles(renderer);
    }

    /**
     * 炎パーティクル描画
     * @param {Object} renderer - レンダラー
     */
    drawFlameParticles(renderer) {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            const colors = ['#ffff00', '#ff8800', '#ff0000'];
            const colorIndex = Math.floor((1 - alpha) * 2.99);
            
            renderer.ctx.fillStyle = colors[colorIndex];
            renderer.ctx.globalAlpha = alpha;
            renderer.ctx.beginPath();
            renderer.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
        renderer.ctx.globalAlpha = 1.0;
    }

    /**
     * ファイヤーボール軌跡描画
     * @param {Object} renderer - レンダラー
     */
    drawFireballTrail(renderer) {
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            const alpha = (this.trail.length - i) / this.trail.length;
            
            renderer.ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
            renderer.ctx.lineWidth = (alpha * 8) + 2;
            renderer.ctx.lineCap = 'round';
            
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(current.x, current.y);
            renderer.ctx.lineTo(next.x, next.y);
            renderer.ctx.stroke();
        }
    }

    /**
     * ファイヤーボールパーティクル描画
     * @param {Object} renderer - レンダラー
     */
    drawFireballParticles(renderer) {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            renderer.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            renderer.ctx.beginPath();
            renderer.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
    }

    /**
     * 弾丸軌跡描画
     * @param {Object} renderer - レンダラー
     */
    drawBulletTrail(renderer) {
        if (this.trail.length < 2) return;
        
        renderer.ctx.save();
        renderer.ctx.lineCap = 'round';
        renderer.ctx.lineJoin = 'round';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            const alpha = ((this.trail.length - i) / this.trail.length) * (this.trailAlpha || 0.7);
            const width = ((this.trail.length - i) / this.trail.length) * (this.width / 2);
            
            // Handle both hex and rgb color formats for alpha blending
            let strokeColor;
            if (this.color.startsWith('#')) {
                // Convert hex to rgba
                const r = parseInt(this.color.slice(1, 3), 16);
                const g = parseInt(this.color.slice(3, 5), 16);
                const b = parseInt(this.color.slice(5, 7), 16);
                strokeColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else if (this.color.includes('rgb')) {
                strokeColor = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            } else {
                strokeColor = `rgba(255, 255, 255, ${alpha})`;
            }
            renderer.ctx.strokeStyle = strokeColor;
            renderer.ctx.lineWidth = Math.max(1, width);
            
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(current.x + this.width / 2, current.y + this.height / 2);
            renderer.ctx.lineTo(next.x + this.width / 2, next.y + this.height / 2);
            renderer.ctx.stroke();
        }
        
        renderer.ctx.restore();
    }

    /**
     * グロー効果描画
     * @param {Object} renderer - レンダラー
     */
    drawGlow(renderer) {
        if (!this.glowColor || this.glowRadius <= 0) return;
        
        renderer.ctx.save();
        renderer.ctx.globalAlpha = 0.5;
        
        // 外側のグロー
        const gradient = renderer.ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.glowRadius
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        renderer.ctx.fillStyle = gradient;
        renderer.ctx.beginPath();
        renderer.ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.glowRadius, 
            0, 
            Math.PI * 2
        );
        renderer.ctx.fill();
        
        renderer.ctx.restore();
    }

    /**
     * 弾丸用パーティクル描画
     * @param {Object} renderer - レンダラー
     */
    drawBulletParticles(renderer) {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            switch (particle.type) {
                case 'sparkle':
                    // キラキラエフェクト
                    renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    renderer.ctx.beginPath();
                    renderer.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    renderer.ctx.fill();
                    
                    // 十字の光線
                    renderer.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    renderer.ctx.lineWidth = 1;
                    renderer.ctx.beginPath();
                    renderer.ctx.moveTo(particle.x - particle.size * 2, particle.y);
                    renderer.ctx.lineTo(particle.x + particle.size * 2, particle.y);
                    renderer.ctx.moveTo(particle.x, particle.y - particle.size * 2);
                    renderer.ctx.lineTo(particle.x, particle.y + particle.size * 2);
                    renderer.ctx.stroke();
                    break;
                    
                case 'fire':
                    // 火花エフェクト
                    const colors = ['#ffff00', '#ff8800', '#ff4400'];
                    const colorIndex = Math.floor((1 - alpha) * 2.99);
                    // Handle hex colors for alpha blending
                    let fillColor;
                    if (colors[colorIndex].startsWith('#')) {
                        const r = parseInt(colors[colorIndex].slice(1, 3), 16);
                        const g = parseInt(colors[colorIndex].slice(3, 5), 16);
                        const b = parseInt(colors[colorIndex].slice(5, 7), 16);
                        fillColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    } else {
                        fillColor = colors[colorIndex].replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                    }
                    renderer.ctx.fillStyle = fillColor;
                    renderer.ctx.beginPath();
                    renderer.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    renderer.ctx.fill();
                    break;
                    
                default:
                    // デフォルトパーティクル
                    renderer.ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
                    renderer.ctx.beginPath();
                    renderer.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    renderer.ctx.fill();
                    break;
            }
        }
    }

    /**
     * 境界ボックス取得
     * @returns {Object} 境界ボックス
     */
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    /**
     * 削除フラグ設定
     */
    markForRemoval() {
        this.shouldRemove = true;
    }
}

/**
 * 弾丸ファクトリークラス
 * 武器レベルに応じた弾丸生成
 */
export class BulletFactory {
    /**
     * プレイヤー弾丸生成
     * @param {number} weaponLevel - 武器レベル
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @returns {Array} 弾丸配列
     */
    static createPlayerBullets(weaponLevel, centerX, centerY) {
        const bullets = [];
        
        switch (weaponLevel) {
            case 1: // 通常弾
                bullets.push(new Bullet({
                    x: centerX - 4,
                    y: centerY,
                    vx: 0,
                    vy: -12,
                    ...BULLET_CONFIG.NORMAL,
                    isPlayerBullet: true,
                    type: 'normal'
                }));
                break;
                
            case 2: // 2連弾
                bullets.push(new Bullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: 0,
                    vy: -12,
                    ...BULLET_CONFIG.NORMAL,
                    isPlayerBullet: true,
                    type: 'normal'
                }));
                bullets.push(new Bullet({
                    x: centerX + 4,
                    y: centerY,
                    vx: 0,
                    vy: -12,
                    ...BULLET_CONFIG.NORMAL,
                    isPlayerBullet: true,
                    type: 'normal'
                }));
                break;
                
            case 3: // 3WAY弾 (DELUXE)
                for (let i = -1; i <= 1; i++) {
                    bullets.push(new Bullet({
                        x: centerX - 6, // Larger bullet, adjust position
                        y: centerY,
                        vx: i * 3,
                        vy: -12,
                        ...BULLET_CONFIG.DELUXE_3WAY,
                        isPlayerBullet: true,
                        type: 'deluxe3way',
                        weaponLevel: 3
                    }));
                }
                break;
                
            case 4: // 5WAY弾 (DELUXE)
                for (let i = -2; i <= 2; i++) {
                    bullets.push(new Bullet({
                        x: centerX - 7, // Larger bullet, adjust position
                        y: centerY,
                        vx: i * 2.5,
                        vy: -12,
                        ...BULLET_CONFIG.DELUXE_5WAY,
                        isPlayerBullet: true,
                        type: 'deluxe5way',
                        weaponLevel: 4
                    }));
                }
                break;
                
            case 5: // サークル弾（8方向）(DELUXE)
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const speed = 15; // 攻撃距離延長（10→15）
                    bullets.push(new Bullet({
                        x: centerX - 8, // Larger bullet, adjust position
                        y: centerY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        ...BULLET_CONFIG.DELUXE_CIRCLE,
                        isPlayerBullet: true,
                        type: 'deluxecircle',
                        weaponLevel: 5
                    }));
                }
                break;
                
            case 6: // 一撃必殺レーザー（プレイヤーから発射される縦のレーザー）
                bullets.push(new Bullet({
                    x: centerX - 10, // レーザー幅20pxなので中央揃え
                    y: centerY - 10, // プレイヤーの少し上から発射開始
                    vx: 0,
                    vy: -20, // 高速で上方向に移動
                    width: 20,
                    height: 600, // 画面全体をカバーする高さ
                    damage: 9999,
                    color: '#00ffff',
                    life: 45,
                    isPlayerBullet: true,
                    type: 'megaLaser'
                }));
                break;
                
            case 7: // 炎弾
                for (let i = 0; i < 18; i++) { // 弾数を大幅増加（12→18）
                    const randomVx = (Math.random() - 0.5) * 24; // 横方向の範囲をさらに拡大（16→24）
                    const randomVy = -Math.random() * 16 - 10; // 縦方向の速度と範囲を大幅拡大（12→16、8→10）
                    bullets.push(new Bullet({
                        x: centerX - 6,
                        y: centerY,
                        vx: randomVx,
                        vy: randomVy,
                        ...BULLET_CONFIG.FLAME,
                        life: 120, // 生存時間をさらに延長（90→120）で遠方まで攻撃
                        isPlayerBullet: true,
                        type: 'flame'
                    }));
                }
                break;
                
            case 8: // 雷撃弾
                for (let i = 0; i < 5; i++) {
                    bullets.push(new Bullet({
                        x: centerX - 6,
                        y: centerY,
                        vx: (i - 2) * 2,
                        vy: -15,
                        ...BULLET_CONFIG.THUNDER,
                        isPlayerBullet: true,
                        type: 'thunder',
                        zigzagAmplitude: 30,
                        zigzagFrequency: 0.3
                    }));
                }
                break;
                
            case 9: // ファイヤーボール
                for (let i = 0; i < 3; i++) {
                    bullets.push(new Bullet({
                        x: centerX - 12,
                        y: centerY,
                        vx: (i - 1) * 3,
                        vy: -10,
                        ...BULLET_CONFIG.FIREBALL,
                        isPlayerBullet: true,
                        type: 'fireball'
                    }));
                }
                break;
        }
        
        return bullets;
    }

    /**
     * 敵弾丸生成
     * @param {Object} enemy - 敵オブジェクト
     * @param {Object} target - 標的位置
     * @param {string} pattern - 弾幕パターン
     * @returns {Array} 弾丸配列
     */
    static createEnemyBullets(enemy, target, pattern = 'normal') {
        const bullets = [];
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height;
        
        switch (pattern) {
            case 'normal':
                // プレイヤーを狙った弾
                const dx = target.x - centerX;
                const dy = target.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const speed = 4;
                
                bullets.push(new Bullet({
                    x: centerX - 4,
                    y: centerY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    width: 8,
                    height: 8,
                    damage: 10,
                    color: '#ff0000',
                    isPlayerBullet: false,
                    type: 'normal'
                }));
                break;
                
            case 'spread':
                // 3方向弾
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(target.y - centerY, target.x - centerX) + i * 0.3;
                    const speed = 3;
                    
                    bullets.push(new Bullet({
                        x: centerX - 4,
                        y: centerY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        width: 8,
                        height: 8,
                        damage: 8,
                        color: '#ff0000',
                        isPlayerBullet: false,
                        type: 'normal'
                    }));
                }
                break;
                
            case 'sword':
                // ソード弾
                const dx2 = target.x - centerX;
                const dy2 = target.y - centerY;
                const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                const speed2 = 3;
                
                bullets.push(new Bullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: (dx2 / distance2) * speed2,
                    vy: (dy2 / distance2) * speed2,
                    width: 16,
                    height: 24,
                    damage: 15,
                    color: '#c0c0c0',
                    isPlayerBullet: false,
                    type: 'sword',
                    rotationSpeed: 15
                }));
                break;
        }
        
        return bullets;
    }
}