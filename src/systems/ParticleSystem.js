import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * パーティクルクラス
 */
class Particle {
    constructor(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.size = options.size || 2;
        this.color = options.color || '#FFFFFF';
        this.type = options.type || 'default';
        this.angle = options.angle || 0;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
        this.shouldRemove = false;
        
        // 特殊プロパティ
        this.scaleSpeed = options.scaleSpeed || 0;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.alpha = options.alpha || 1;
        this.alphaDecay = options.alphaDecay || 0;
    }

    /**
     * パーティクル更新
     */
    update() {
        // 移動
        this.x += this.vx;
        this.y += this.vy;
        
        // 重力適用
        this.vy += this.gravity;
        
        // 摩擦適用
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // 回転
        this.rotation += this.rotationSpeed;
        
        // サイズ変更
        this.size += this.scaleSpeed;
        if (this.size <= 0) {
            this.shouldRemove = true;
            return;
        }
        
        // アルファ減衰
        this.alpha -= this.alphaDecay;
        if (this.alpha <= 0) {
            this.alpha = 0;
            this.shouldRemove = true;
            return;
        }
        
        // 寿命減少
        this.life--;
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }

    /**
     * パーティクル描画
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        if (this.shouldRemove) return;
        
        const lifeFactor = this.life / this.maxLife;
        renderer.ctx.save();
        
        switch (this.type) {
            case 'spark':
                this.drawSpark(renderer, lifeFactor);
                break;
            case 'explosion':
                this.drawExplosion(renderer, lifeFactor);
                break;
            case 'flame':
                this.drawFlame(renderer, lifeFactor);
                break;
            case 'smoke':
                this.drawSmoke(renderer, lifeFactor);
                break;
            case 'laser_trail':
                this.drawLaserTrail(renderer, lifeFactor);
                break;
            case 'speed_trail':
                this.drawSpeedTrail(renderer, lifeFactor);
                break;
            default:
                this.drawDefault(renderer, lifeFactor);
                break;
        }
        
        renderer.ctx.restore();
    }

    /**
     * 火花パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawSpark(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor;
        renderer.ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        
        // 輝きエフェクト
        if (lifeFactor > 0.7) {
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            renderer.ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        }
    }

    /**
     * 爆発パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawExplosion(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor;
        const currentSize = this.size * (1.5 - lifeFactor * 0.5);
        
        renderer.ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.beginPath();
        renderer.ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 内側の明るい部分
        if (lifeFactor > 0.5) {
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            renderer.ctx.beginPath();
            renderer.ctx.arc(this.x, this.y, currentSize * 0.5, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
    }

    /**
     * 炎パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawFlame(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor;
        const currentSize = this.size * (0.5 + lifeFactor * 0.5);
        
        // 炎の形を描画
        renderer.ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(this.x, this.y, currentSize, currentSize * 1.5, this.rotation, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 炎の中心
        if (lifeFactor > 0.3) {
            renderer.ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.7})`;
            renderer.ctx.beginPath();
            renderer.ctx.ellipse(this.x, this.y, currentSize * 0.6, currentSize * 0.9, this.rotation, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
    }

    /**
     * 煙パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawSmoke(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor * 0.6;
        const currentSize = this.size * (1 + (1 - lifeFactor) * 2);
        
        renderer.ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
        renderer.ctx.beginPath();
        renderer.ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * レーザー軌跡パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawLaserTrail(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor;
        const width = this.size * lifeFactor;
        
        renderer.ctx.strokeStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.lineWidth = width;
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(this.x, this.y);
        renderer.ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        renderer.ctx.stroke();
    }

    /**
     * 高速移動軌跡パーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawSpeedTrail(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor * 0.8;
        
        renderer.ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    /**
     * デフォルトパーティクル描画
     * @param {Object} renderer - レンダラー
     * @param {number} lifeFactor - 寿命係数
     */
    drawDefault(renderer, lifeFactor) {
        const alpha = this.alpha * lifeFactor;
        renderer.ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        renderer.ctx.beginPath();
        renderer.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        renderer.ctx.fill();
    }
}

/**
 * パーティクルシステム
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500; // パーティクル数上限
        this.updateSkipFrame = 0; // 更新間引きカウンター
        this.updateSkipInterval = 1; // 1フレームおきに更新
        this.creationCooldown = 0; // パーティクル生成クールダウン
    }

    /**
     * パーティクル追加
     * @param {Object} options - パーティクル設定
     */
    addParticle(options) {
        // パーティクル数上限チェック
        if (this.particles.length >= this.maxParticles) {
            // 古いパーティクルを強制削除
            this.particles.splice(0, Math.min(50, this.particles.length - this.maxParticles + 50));
        }
        
        this.particles.push(new Particle(options));
    }

    /**
     * 複数パーティクル追加
     * @param {Array} particleOptions - パーティクル設定配列
     */
    addParticles(particleOptions) {
        for (const options of particleOptions) {
            this.addParticle(options);
        }
    }

    /**
     * 爆発エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} color - 色
     * @param {number} count - パーティクル数
     */
    createExplosion(x, y, color = '#FF6600', count = 10) {
        // 生成クールダウンチェック
        if (this.creationCooldown > 0) {
            count = Math.min(count, 5); // クールダウン中は数を制限
        }
        
        // パーティクル数が上限近い場合は生成数を削減
        if (this.particles.length > this.maxParticles * 0.8) {
            count = Math.min(count, 3);
        }
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                size: 3 + Math.random() * 4,
                color: color,
                type: 'explosion',
                gravity: 0.1,
                friction: 0.95,
                alpha: 1,
                alphaDecay: 0.02
            });
        }
    }

    /**
     * 火花エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} color - 色
     * @param {number} count - パーティクル数
     */
    createSparks(x, y, color = '#FFFF00', count = 8) {
        // 生成クールダウンチェック
        if (this.creationCooldown > 0) {
            count = Math.min(count, 3);
        }
        
        // パーティクル数が上限近い場合は生成数を削減
        if (this.particles.length > this.maxParticles * 0.8) {
            count = Math.min(count, 2);
        }
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            this.addParticle({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 15,
                size: 1 + Math.random() * 2,
                color: color,
                type: 'spark',
                gravity: 0.05,
                friction: 0.98,
                alpha: 1,
                alphaDecay: 0.03
            });
        }
    }

    /**
     * 炎エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createFlame(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const colors = ['rgba(255, 100, 0)', 'rgba(255, 150, 0)', 'rgba(255, 200, 0)'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.addParticle({
                x: x + (Math.random() - 0.5) * 8,
                y: y + Math.random() * 5,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 2,
                life: 25 + Math.random() * 15,
                size: 2 + Math.random() * 3,
                color: color,
                type: 'flame',
                gravity: -0.02,
                friction: 0.99,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                alpha: 0.8,
                alphaDecay: 0.02
            });
        }
    }

    /**
     * 煙エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createSmoke(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.addParticle({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 1,
                vy: -0.5 - Math.random() * 1.5,
                life: 40 + Math.random() * 20,
                size: 3 + Math.random() * 5,
                color: 'rgba(100, 100, 100)',
                type: 'smoke',
                gravity: -0.01,
                friction: 0.99,
                alpha: 0.6,
                alphaDecay: 0.01,
                scaleSpeed: 0.05
            });
        }
    }

    /**
     * レーザー軌跡エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {string} color - 色
     */
    createLaserTrail(x, y, vx, vy, color = '#00FFFF') {
        this.addParticle({
            x: x,
            y: y,
            vx: vx * 0.3,
            vy: vy * 0.3,
            life: 10,
            size: 3,
            color: color,
            type: 'laser_trail',
            friction: 0.9,
            alpha: 0.8,
            alphaDecay: 0.08
        });
    }

    /**
     * 高速移動軌跡エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} color - 色
     */
    createSpeedTrail(x, y, color = 'rgba(255, 255, 255)') {
        this.addParticle({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: 0,
            vy: 0,
            life: 8,
            size: 2 + Math.random() * 2,
            color: color,
            type: 'speed_trail',
            alpha: 0.6,
            alphaDecay: 0.08
        });
    }

    /**
     * パワーアップ取得エフェクト生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} color - 色
     */
    createPowerUpEffect(x, y, color = '#FFD700') {
        // 外側の爆発
        this.createExplosion(x, y, color, 12);
        
        // 内側のキラキラ
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 20 + Math.random() * 15;
            
            this.addParticle({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * -1,
                vy: Math.sin(angle) * -1,
                life: 30,
                size: 2,
                color: '#FFFFFF',
                type: 'spark',
                gravity: 0,
                friction: 0.95,
                alpha: 1,
                alphaDecay: 0.03
            });
        }
    }

    /**
     * システム更新
     */
    update() {
        // 生成クールダウン更新
        if (this.creationCooldown > 0) {
            this.creationCooldown--;
        }
        
        // 更新間引き処理
        this.updateSkipFrame++;
        if (this.updateSkipFrame < this.updateSkipInterval) {
            return;
        }
        this.updateSkipFrame = 0;
        
        // パーティクル数が多い場合、更新頻度を下げる
        const particleCount = this.particles.length;
        if (particleCount > this.maxParticles * 0.7) {
            this.updateSkipInterval = 2; // 2フレームおきに更新
        } else {
            this.updateSkipInterval = 1; // 毎フレーム更新
        }
        
        // パーティクル更新
        for (const particle of this.particles) {
            particle.update();
        }
        
        // 削除対象を除去
        this.particles = this.particles.filter(particle => !particle.shouldRemove);
        
        // 強制削除（緊急対策）
        if (this.particles.length > this.maxParticles) {
            // 最も古いパーティクル（配列の先頭）から削除
            const removeCount = this.particles.length - this.maxParticles;
            this.particles.splice(0, removeCount);
        }
    }

    /**
     * システム描画
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        for (const particle of this.particles) {
            particle.draw(renderer);
        }
    }

    /**
     * すべてのパーティクルをクリア
     */
    clear() {
        this.particles = [];
    }

    /**
     * パーティクル数取得
     * @returns {number} パーティクル数
     */
    getParticleCount() {
        return this.particles.length;
    }
    
    /**
     * 生成クールダウン設定
     * @param {number} frames - クールダウンフレーム数
     */
    setCreationCooldown(frames) {
        this.creationCooldown = frames;
    }
    
    /**
     * パフォーマンス状況取得
     * @returns {Object} パフォーマンス情報
     */
    getPerformanceInfo() {
        return {
            particleCount: this.particles.length,
            maxParticles: this.maxParticles,
            utilization: (this.particles.length / this.maxParticles * 100).toFixed(1) + '%',
            updateInterval: this.updateSkipInterval,
            creationCooldown: this.creationCooldown
        };
    }
}