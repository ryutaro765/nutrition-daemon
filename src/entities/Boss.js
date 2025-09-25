import { GAME_CONFIG, BOSS_CONFIG } from '../config/gameConfig.js';
import { BulletFactory, Bullet } from './Bullet.js';

/**
 * ボス基底クラス
 */
export class Boss {
    
    /**
     * 安全な弾丸生成ヘルパー
     * @param {Object} options - 弾丸オプション
     * @returns {Bullet|null} 弾丸オブジェクトまたはnull
     */
    createSafeBullet(options) {
        try {
            const bullet = new Bullet(options);
            
            // 弾丸の有効性を確認
            if (bullet && typeof bullet.update === 'function') {
                return bullet;
            } else {
                console.error('❌ Boss created invalid bullet:', bullet);
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating boss bullet:', error, 'Options:', options);
            return null;
        }
    }

    constructor(options = {}) {
        // 基本プロパティ
        this.x = options.x || GAME_CONFIG.CANVAS_WIDTH / 2 - 90;
        this.y = options.y || -180;
        this.width = options.width || 180;
        this.height = options.height || 180;
        this.speed = options.speed || 0.8;
        this.hp = options.hp || 800;
        this.maxHp = options.maxHp || this.hp;
        
        // 色設定
        this.color = options.color || '#8B0000';
        this.secondaryColor = options.secondaryColor || '#DC143C';
        this.accentColor = options.accentColor || '#FF6347';
        this.glowColor = options.glowColor || '#FF4500';
        
        // ボス固有
        this.type = options.type || 'flame_demon_lord';
        this.name = options.name || '炎獄の魔王';
        this.bulletDamage = options.bulletDamage || 8;
        this.bossIndex = options.bossIndex || 0;
        
        // アニメーション
        this.moveTimer = 0;
        this.walkFrame = 0;
        this.eyeGlow = 0;
        this.auraPhase = 0;
        
        // 攻撃パターン
        this.shootCooldown = 0;
        this.attackPhase = 0;
        this.attackTimer = 0;
        this.specialAttackCooldown = 0;
        
        // ステージ進入
        this.hasEnteredStage = false;
        this.entranceComplete = false;
        
        // 削除フラグ
        this.shouldRemove = false;
        
        // タイプ固有の初期化
        this.initializeBossType();
    }

    /**
     * ボスタイプ固有の初期化
     */
    initializeBossType() {
        const config = BOSS_CONFIG.TYPES[this.bossIndex];
        if (config) {
            this.width = config.width;
            this.height = config.height;
            this.hp = config.hp;
            this.maxHp = config.hp;
            this.bulletDamage = config.bulletDamage;
            this.color = config.color;
            this.secondaryColor = config.secondaryColor;
            this.accentColor = config.accentColor;
            this.glowColor = config.glowColor;
            this.name = config.name;
            
            // Set boss type based on index
            switch(this.bossIndex) {
                case 0:
                    this.type = 'medusa';
                    break;
                case 1:
                    this.type = 'flame_demon_lord';
                    break;
                case 2:
                    this.type = 'ice_demon_lord';
                    break;
                default:
                    this.type = 'flame_demon_lord';
            }
            
            if (config.spriteScale) {
                this.spriteScale = config.spriteScale;
            }
        }
    }

    /**
     * ボス更新
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemyBullets - 敵弾配列
     */
    update(player, enemyBullets) {
        // アニメーション更新
        this.updateAnimation();
        
        // 登場処理
        if (!this.entranceComplete) {
            this.handleEntrance();
            return;
        }
        
        // 移動処理
        this.handleMovement();
        
        // 攻撃処理
        this.handleAttacks(player, enemyBullets);
        
        // タイマー更新
        this.updateTimers();
    }

    /**
     * アニメーション更新
     */
    updateAnimation() {
        this.moveTimer += 1;
        this.walkFrame += 0.08;
        this.eyeGlow += 0.1;
        this.auraPhase += 0.008;
    }

    /**
     * 登場処理
     */
    handleEntrance() {
        if (this.y < 60) {
            this.y += this.speed;
        } else {
            this.entranceComplete = true;
        }
    }

    /**
     * 移動処理
     */
    handleMovement() {
        // HP段階に応じた移動パターン
        const hpRatio = this.hp / this.maxHp;
        
        if (hpRatio > 0.7) {
            // 高HP時：ゆっくり左右移動
            this.x += Math.sin(this.moveTimer * 0.02) * 1.5;
        } else if (hpRatio > 0.3) {
            // 中HP時：活発な移動
            this.x += Math.sin(this.moveTimer * 0.04) * 2.5;
            this.y += Math.sin(this.moveTimer * 0.03) * 0.8;
        } else {
            // 低HP時：激しい移動
            this.x += Math.sin(this.moveTimer * 0.06) * 3.5;
            this.y += Math.sin(this.moveTimer * 0.05) * 1.2;
        }
        
        // 画面内に制限
        const margin = 50;
        this.x = Math.max(margin, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.width - margin, this.x));
        this.y = Math.max(20, Math.min(200, this.y));
    }

    /**
     * 攻撃処理
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemyBullets - 敵弾配列
     */
    handleAttacks(player, enemyBullets) {
        this.shootCooldown--;
        this.specialAttackCooldown--;
        
        if (this.shootCooldown <= 0) {
            const bullets = this.createAttackPattern(player);
            
            // 弾丸検証
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                if (!bullet || typeof bullet.update !== 'function') {
                    console.error('❌ Invalid boss bullet removed:', bullet?.constructor?.name);
                    bullets.splice(i, 1);
                }
            }
            
            enemyBullets.push(...bullets);
            this.resetAttackCooldown();
        }
        
        // 特殊攻撃
        if (this.specialAttackCooldown <= 0) {
            const specialBullets = this.createSpecialAttack(player);
            
            // 特殊弾丸検証
            for (let i = specialBullets.length - 1; i >= 0; i--) {
                const bullet = specialBullets[i];
                if (!bullet || typeof bullet.update !== 'function') {
                    console.error('❌ Invalid boss special bullet removed:', bullet?.constructor?.name);
                    specialBullets.splice(i, 1);
                }
            }
            
            enemyBullets.push(...specialBullets);
            this.resetSpecialAttackCooldown();
        }
    }

    /**
     * 攻撃パターン生成
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createAttackPattern(player) {
        const bullets = [];
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        const hpRatio = this.hp / this.maxHp;
        
        switch (this.bossIndex) {
            case 0: // メデューサ
                bullets.push(...this.createMedusaAttack(player, centerX, centerY, hpRatio));
                break;
            case 1: // 炎獄の魔王
                bullets.push(...this.createFlameDemonAttack(player, centerX, centerY, hpRatio));
                break;
            case 2: // 氷結の魔王
                bullets.push(...this.createIceDemonAttack(player, centerX, centerY, hpRatio));
                break;
        }
        
        return bullets;
    }

    /**
     * 炎獄の魔王攻撃パターン
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} hpRatio - HP比率
     * @returns {Array} 弾丸配列
     */
    createFlameDemonAttack(player, centerX, centerY, hpRatio) {
        const bullets = [];
        
        if (hpRatio > 0.7) {
            // 単発の狙い撃ち
            const dx = player.x - centerX;
            const dy = player.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const bullet = this.createSafeBullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: (dx / distance) * 5, // 3->5 (67% faster)
                    vy: (dy / distance) * 5, // 3->5 (67% faster)
                    width: 16,
                    height: 16,
                    damage: this.bulletDamage,
                    color: '#FF4500',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else if (hpRatio > 0.3) {
            // 3方向攻撃
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(player.y - centerY, player.x - centerX) + i * 0.5;
                const bullet = this.createSafeBullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: Math.cos(angle) * 5.5, // 3.5->5.5 (57% faster)
                    vy: Math.sin(angle) * 5.5, // 3.5->5.5 (57% faster)
                    width: 16,
                    height: 16,
                    damage: this.bulletDamage,
                    color: '#FF6347',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else {
            // 5方向攻撃
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(player.y - centerY, player.x - centerX) + i * 0.3;
                const bullet = this.createSafeBullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: Math.cos(angle) * 6, // 4->6 (50% faster)
                    vy: Math.sin(angle) * 6, // 4->6 (50% faster)
                    width: 18,
                    height: 18,
                    damage: this.bulletDamage + 2,
                    color: '#DC143C',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        }
        
        return bullets;
    }

    /**
     * 氷結の魔王攻撃パターン
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} hpRatio - HP比率
     * @returns {Array} 弾丸配列
     */
    createIceDemonAttack(player, centerX, centerY, hpRatio) {
        const bullets = [];
        
        if (hpRatio > 0.7) {
            // 予測攻撃
            const predictedX = player.x + (player.direction?.x || 0) * 100;
            const predictedY = player.y + (player.direction?.y || 0) * 100;
            const dx = predictedX - centerX;
            const dy = predictedY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const bullet = this.createSafeBullet({
                    x: centerX - 10,
                    y: centerY,
                    vx: (dx / distance) * 5.5, // 3.5->5.5 (57% faster)
                    vy: (dy / distance) * 5.5, // 3.5->5.5 (57% faster)
                    width: 20,
                    height: 20,
                    damage: this.bulletDamage + 2,
                    color: '#00BFFF',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else if (hpRatio > 0.3) {
            // 回転弾幕
            const rotationSpeed = this.moveTimer * 0.1;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + rotationSpeed;
                const bullet = this.createSafeBullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: Math.cos(angle) * 5, // 3->5 (67% faster)
                    vy: Math.sin(angle) * 5, // 3->5 (67% faster)
                    width: 16,
                    height: 16,
                    damage: this.bulletDamage,
                    color: '#87CEEB',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else {
            // 螺旋弾幕
            const spiralTime = this.moveTimer * 0.05;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + spiralTime;
                const radius = 2 + Math.sin(spiralTime + i) * 1;
                const bullet = this.createSafeBullet({
                    x: centerX - 8,
                    y: centerY,
                    vx: Math.cos(angle) * radius,
                    vy: Math.sin(angle) * radius,
                    width: 18,
                    height: 18,
                    damage: this.bulletDamage + 3,
                    color: '#4169E1',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        }
        
        return bullets;
    }

    /**
     * メデューサ攻撃パターン
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} hpRatio - HP比率
     * @returns {Array} 弾丸配列
     */
    createMedusaAttack(player, centerX, centerY, hpRatio) {
        const bullets = [];
        
        if (hpRatio > 0.7) {
            // 3方向攻撃
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(player.y - centerY, player.x - centerX) + i * 0.4;
                const bullet = this.createSafeBullet({
                    x: centerX - 10,
                    y: centerY,
                    vx: Math.cos(angle) * 6, // 4->6 (50% faster)
                    vy: Math.sin(angle) * 6, // 4->6 (50% faster)
                    width: 20,
                    height: 20,
                    damage: this.bulletDamage + 3,
                    color: '#9932CC',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else if (hpRatio > 0.3) {
            // 5方向攻撃
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(player.y - centerY, player.x - centerX) + i * 0.3;
                const bullet = this.createSafeBullet({
                    x: centerX - 10,
                    y: centerY,
                    vx: Math.cos(angle) * 6.5, // 4.5->6.5 (44% faster)
                    vy: Math.sin(angle) * 6.5, // 4.5->6.5 (44% faster)
                    width: 22,
                    height: 22,
                    damage: this.bulletDamage + 4,
                    color: '#8B008B',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        } else {
            // 円形弾幕
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const bullet = this.createSafeBullet({
                    x: centerX - 12,
                    y: centerY,
                    vx: Math.cos(angle) * 3.5,
                    vy: Math.sin(angle) * 3.5,
                    width: 24,
                    height: 24,
                    damage: this.bulletDamage + 5,
                    color: '#FF00FF',
                    type: 'normal',
                    isPlayerBullet: false
                });
                
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        }
        
        return bullets;
    }

    /**
     * 特殊攻撃生成
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createSpecialAttack(player) {
        const bullets = [];
        const hpRatio = this.hp / this.maxHp;
        
        // HP低下時のみ特殊攻撃 - more frequent threshold
        if (hpRatio < 0.7) { // 0.5->0.7 (earlier activation)
            switch (this.bossIndex) {
                case 0: // メデューサ：蛇の呪い
                    bullets.push(...this.createSnakeCurse(player));
                    break;
                case 1: // 炎獄の魔王：火炎放射
                    bullets.push(...this.createFlameBreath(player));
                    break;
                case 2: // 氷結の魔王：氷の嵐
                    bullets.push(...this.createIceStorm(player));
                    break;
            }
        }
        
        return bullets;
    }

    /**
     * 火炎放射攻撃
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createFlameBreath(player) {
        const bullets = [];
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        
        // 扇状の火炎弾
        for (let i = 0; i < 15; i++) {
            const angle = Math.atan2(player.y - centerY, player.x - centerX) + (i - 7) * 0.1;
            const speed = 2 + Math.random() * 2;
            
            const bullet = this.createSafeBullet({
                x: centerX - 8,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 16,
                height: 16,
                damage: this.bulletDamage + 6,
                color: '#FF4500',
                type: 'flame',
                life: 60,
                isPlayerBullet: false
            });
            
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }

    /**
     * 氷の嵐攻撃
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createIceStorm(player) {
        const bullets = [];
        
        // 全方位氷弾
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            
            const bullet = this.createSafeBullet({
                x: this.x + this.width / 2 - 10,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 20,
                height: 20,
                damage: this.bulletDamage + 4,
                color: '#00FFFF',
                type: 'normal',
                life: 90,
                isPlayerBullet: false
            });
            
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }

    /**
     * 蛇の呪い攻撃
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createSnakeCurse(player) {
        const bullets = [];
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        
        // 追尾する蛇弾
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            
            const bullet = this.createSafeBullet({
                x: centerX - 12,
                y: centerY,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                width: 24,
                height: 24,
                damage: this.bulletDamage + 7,
                color: '#9932CC',
                type: 'normal',
                life: 120,
                isPlayerBullet: false
            });
            
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }

    /**
     * 攻撃クールダウンリセット
     */
    resetAttackCooldown() {
        const hpRatio = this.hp / this.maxHp;
        // Much more aggressive attack patterns - 60% faster attacks
        const baseTimeout = hpRatio > 0.3 ? 32 : 20; // 80->32, 50->20 (60% faster)
        this.shootCooldown = baseTimeout + Math.random() * 16; // 40->16 (60% reduction)
    }

    /**
     * 特殊攻撃クールダウンリセット
     */
    resetSpecialAttackCooldown() {
        // Much more frequent special attacks - 70% faster
        this.specialAttackCooldown = 90 + Math.random() * 60; // 300->90, 200->60 (70% faster)
    }

    /**
     * タイマー更新
     */
    updateTimers() {
        this.attackTimer++;
    }

    /**
     * ダメージ処理
     * @param {number} damage - ダメージ量
     * @returns {boolean} 撃破されたかどうか
     */
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.shouldRemove = true;
            return true;
        }
        return false;
    }

    /**
     * 描画処理
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        // HPバー描画
        this.drawHealthBar(renderer);
        
        // オーラエフェクト
        this.drawAura(renderer);
        
        // メイン描画
        this.drawMain(renderer);
    }

    /**
     * HPバー描画
     * @param {Object} renderer - レンダラー
     */
    drawHealthBar(renderer) {
        const hpBarHeight = Math.max(16, this.height * 0.04);
        const y = this.y - hpBarHeight * 2;
        
        // 背景
        renderer.drawRect(this.x, y, this.width, hpBarHeight, '#8B0000');
        
        // 赤い枠
        renderer.drawRect(this.x + 4, y + 4, this.width - 8, hpBarHeight - 8, '#FF0000');
        
        // HP
        const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
        const hpWidth = (this.width - 8) * hpRatio;
        renderer.drawRect(this.x + 4, y + 4, hpWidth, hpBarHeight - 8, '#00FF00');
    }

    /**
     * オーラエフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawAura(renderer) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const auraSize = this.width / 2 + 30 + Math.sin(Date.now() * this.auraPhase) * 20;
        
        // 外側のオーラ
        renderer.ctx.fillStyle = 'rgba(139, 0, 0, 0.1)';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, auraSize + 30, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // 内側のオーラ
        renderer.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        renderer.ctx.beginPath();
        renderer.ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * メイン描画
     * @param {Object} renderer - レンダラー
     */
    drawMain(renderer) {
        // 全てのボスをスプライトで描画
        switch (this.type) {
            case 'medusa':
                renderer.drawSprite('medusa', this.x, this.y, this.spriteScale || 11.25);
                break;
            case 'flame_demon_lord':
                renderer.drawSprite('flame_demon_lord', this.x, this.y, this.spriteScale || 14.0625); // 225px / 16px = 14.0625
                break;
            case 'ice_demon_lord':
                renderer.drawSprite('ice_demon_lord', this.x, this.y, this.spriteScale || 16.875); // 270px / 16px = 16.875
                break;
            default:
                // フォールバック（従来の描画）
                this.drawTraditionalBoss(renderer);
                break;
        }
    }

    /**
     * 従来のボス描画
     * @param {Object} renderer - レンダラー
     */
    drawTraditionalBoss(renderer) {
        // メインボディ
        renderer.drawRect(this.x, this.y, this.width, this.height, this.color);
        
        // セカンダリ色部分
        const secWidth = this.width * 0.6;
        const secHeight = this.height * 0.4;
        const secX = this.x + this.width * 0.2;
        const secY = this.y + this.height * 0.1;
        renderer.drawRect(secX, secY, secWidth, secHeight, this.secondaryColor);
        
        // 目（光る）
        const eyeGlow = Math.sin(this.eyeGlow) * 0.5 + 0.5;
        const eyeColor = `rgba(255, 0, 0, ${0.8 + eyeGlow * 0.2})`;
        
        const eyeWidth = this.width * 0.1;
        const eyeHeight = this.height * 0.1;
        const leftEyeX = this.x + this.width * 0.3;
        const rightEyeX = this.x + this.width * 0.6;
        const eyeY = this.y + this.height * 0.2;
        
        renderer.drawRect(leftEyeX, eyeY, eyeWidth, eyeHeight, eyeColor);
        renderer.drawRect(rightEyeX, eyeY, eyeWidth, eyeHeight, eyeColor);
        
        // 口
        const mouthX = this.x + this.width * 0.35;
        const mouthY = this.y + this.height * 0.35;
        const mouthWidth = this.width * 0.3;
        const mouthHeight = this.height * 0.1;
        renderer.drawRect(mouthX, mouthY, mouthWidth, mouthHeight, '#000000');
        
        // 歯
        const toothWidth = this.width * 0.03;
        const toothHeight = this.height * 0.08;
        const leftToothX = this.x + this.width * 0.4;
        const rightToothX = this.x + this.width * 0.57;
        const toothY = this.y + this.height * 0.35;
        
        renderer.drawRect(leftToothX, toothY, toothWidth, toothHeight, '#FFFFFF');
        renderer.drawRect(rightToothX, toothY, toothWidth, toothHeight, '#FFFFFF');
        
        // 体の装飾
        const accentX = this.x + this.width * 0.1;
        const accentY = this.y + this.height * 0.5;
        const accentWidth = this.width * 0.8;
        const accentHeight = this.height * 0.4;
        renderer.drawRect(accentX, accentY, accentWidth, accentHeight, this.accentColor);
        
        // 腕
        const armWidth = this.width * 0.2;
        const armHeight = this.height * 0.3;
        const leftArmX = this.x - this.width * 0.1;
        const rightArmX = this.x + this.width * 0.9;
        const armY = this.y + this.height * 0.3;
        
        renderer.drawRect(leftArmX, armY, armWidth, armHeight, this.color);
        renderer.drawRect(rightArmX, armY, armWidth, armHeight, this.color);
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
 * ボスファクトリークラス
 */
export class BossFactory {
    /**
     * ボス生成
     * @param {number} bossIndex - ボスインデックス（0-2）
     * @returns {Boss} ボスオブジェクト
     */
    static createBoss(bossIndex) {
        const config = BOSS_CONFIG.TYPES[bossIndex];
        if (!config) {
            throw new Error(`Invalid boss index: ${bossIndex}`);
        }
        
        const bossOptions = {
            x: GAME_CONFIG.CANVAS_WIDTH / 2 - config.width / 2,
            y: -config.height,
            width: config.width,
            height: config.height,
            hp: config.hp,
            bulletDamage: config.bulletDamage,
            color: config.color,
            secondaryColor: config.secondaryColor,
            accentColor: config.accentColor,
            glowColor: config.glowColor,
            name: config.name,
            bossIndex: bossIndex
        };
        
        // ボスタイプ設定
        switch (bossIndex) {
            case 0:
                bossOptions.type = 'medusa';
                if (config.spriteScale) {
                    bossOptions.spriteScale = config.spriteScale;
                }
                break;
            case 1:
                bossOptions.type = 'flame_demon_lord';
                break;
            case 2:
                bossOptions.type = 'ice_demon_lord';
                break;
        }
        
        return new Boss(bossOptions);
    }
}