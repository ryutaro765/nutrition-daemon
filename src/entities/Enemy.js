import { GAME_CONFIG, ENEMY_CONFIG } from '../config/gameConfig.js';
import { BulletFactory } from './Bullet.js';

/**
 * 敵基底クラス
 */
export class Enemy {
    constructor(options = {}) {
        // 基本プロパティ
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 40;
        this.height = options.height || 40;
        this.speed = options.speed || 1;
        this.hp = options.hp || 20;
        this.maxHp = options.maxHp || this.hp;
        this.color = options.color || '#333333';
        this.type = options.type || 'generic';
        this.pattern = options.pattern || 'straight';
        
        // 攻撃関連
        this.shootCooldown = options.shootCooldown || 120;
        this.maxShootCooldown = this.shootCooldown;
        this.damage = options.damage || 5; // 敵弾ダメージを半減（10→5）
        this.contactDamage = options.contactDamage || 20;
        
        // アニメーション
        this.animationFrame = 0;
        this.walkFrame = Math.random() * Math.PI * 2;
        this.angle = options.angle || 0;
        
        // 移動パターン用
        this.initialX = options.initialX || this.x;
        this.initialY = options.initialY || this.y;
        this.amplitude = options.amplitude || 50;
        this.frequency = options.frequency || 0.03;
        this.baseY = 0;
        
        // 特殊プロパティ
        this.formationOffset = options.formationOffset || 0;
        this.blinkTimer = 0;
        
        // 削除フラグ
        this.shouldRemove = false;
        
        // タイプ固有の初期化
        this.initializeType();
    }

    /**
     * タイプ固有の初期化
     */
    initializeType() {
        const config = ENEMY_CONFIG[this.type.toUpperCase()];
        if (config) {
            this.width = config.width;
            this.height = config.height;
            this.hp = config.hp;
            this.maxHp = config.hp;
            this.speed = config.speed;
            this.color = config.color;
        }
    }

    /**
     * 敵更新
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemyBullets - 敵弾配列
     */
    update(player, enemyBullets) {
        // 射撃クールダウン更新
        this.shootCooldown--;
        
        // 攻撃処理
        this.handleShooting(player, enemyBullets);
        
        // 移動処理
        this.handleMovement(player);
        
        // アニメーション更新
        this.updateAnimation();
        
        // 画面外チェック
        this.checkBounds();
    }

    /**
     * 射撃処理
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemyBullets - 敵弾配列
     */
    handleShooting(player, enemyBullets) {
        if (this.shootCooldown <= 0 && this.y > 0 && this.y < GAME_CONFIG.CANVAS_HEIGHT - 100) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (this.canShoot(distance)) {
                const bullets = this.createBullets(player);
                enemyBullets.push(...bullets);
                this.resetShootCooldown();
            }
        }
    }

    /**
     * 射撃可能判定
     * @param {number} distance - プレイヤーとの距離
     * @returns {boolean} 射撃可能か
     */
    canShoot(distance) {
        switch (this.type) {
            case 'sword_thrower':
                return distance < 300 && Math.random() < 0.2;
            case 'bomb_walker':
                return false; // 爆弾歩行敵は射撃しない
            default:
                return distance < 250 && Math.random() < 0.12;
        }
    }

    /**
     * 弾丸生成
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {Array} 弾丸配列
     */
    createBullets(player) {
        const pattern = this.type === 'sword_thrower' ? 'sword' : 'normal';
        return BulletFactory.createEnemyBullets(this, player, pattern);
    }

    /**
     * 射撃クールダウンリセット
     */
    resetShootCooldown() {
        switch (this.type) {
            case 'sword_thrower':
                this.shootCooldown = 200 + Math.random() * 100;
                break;
            default:
                this.shootCooldown = 250 + Math.random() * 350;
                break;
        }
    }

    /**
     * 移動処理
     * @param {Object} player - プレイヤーオブジェクト
     */
    handleMovement(player) {
        switch (this.pattern) {
            case 'walk_straight':
                this.moveWalkStraight();
                break;
            case 'fly_dynamic':
                this.moveFlyDynamic(player);
                break;
            case 'sine_curve':
                this.moveSineCurve();
                break;
            default:
                this.y += this.speed;
                break;
        }
    }

    /**
     * 直進歩行移動
     */
    moveWalkStraight() {
        this.y += this.speed;
        this.walkFrame += 0.15;
        
        // 爆弾キャラの点滅エフェクト
        if (this.type === 'bomb_walker') {
            this.blinkTimer += 0.2;
        }
    }

    /**
     * ダイナミック飛行移動（コウモリ）
     * @param {Object} player - プレイヤーオブジェクト
     */
    moveFlyDynamic(player) {
        this.y += this.speed;
        
        if (!this.swoopTimer) this.swoopTimer = Math.random() * 300;
        this.swoopTimer--;
        
        if (!this.swoopActive) {
            // 通常の蛇行飛行
            if (!this.baseY) this.baseY = this.y;
            this.x += Math.sin(this.angle + this.formationOffset) * (this.amplitude / 20);
            this.angle += 0.18;
            
            // ランダムで急降下開始
            if (this.swoopTimer <= 0 && Math.random() < 0.02) {
                this.swoopActive = true;
                this.swoopTimer = 120; // 2秒間の急降下
                this.swoopTargetX = player.x + (Math.random() - 0.5) * 100;
            }
        } else {
            // 急降下攻撃（緩化）
            const dx = this.swoopTargetX - this.x;
            this.x += dx * 0.02; // 0.03 → 0.02 (横移動速度さらに減)
            this.y += this.speed * 1.0; // 1.2 → 1.0 (降下速度さらに減)
            
            this.swoopTimer--;
            if (this.swoopTimer <= 0) {
                this.swoopActive = false;
                this.swoopTimer = 240 + Math.random() * 360; // 次の急降下まで4-10秒に延長
            }
        }
    }

    /**
     * サイン波飛行移動
     */
    moveSineCurve() {
        if (this.initialX < GAME_CONFIG.CANVAS_WIDTH / 2) {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }
        this.angle += this.frequency;
        this.y += Math.sin(this.angle) * this.amplitude * 0.025;
    }

    /**
     * アニメーション更新
     */
    updateAnimation() {
        this.animationFrame++;
        
        // タイプ別アニメーション
        switch (this.type) {
            case 'ground_walker':
            case 'sword_thrower':
            case 'bomb_walker':
                // 歩行アニメーション
                this.footLOffset = Math.sin(this.walkFrame) * 4;
                this.footROffset = Math.sin(this.walkFrame + Math.PI) * 4;
                break;
            case 'sine_flyer':
                // 羽ばたきアニメーション
                this.wingAngle = Math.sin(this.angle || 0) * 6;
                break;
        }
    }

    /**
     * 画面外チェック
     */
    checkBounds() {
        const margin = 100;
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT + margin || 
            this.x < -this.width - margin || 
            this.x > GAME_CONFIG.CANVAS_WIDTH + margin) {
            this.shouldRemove = true;
        }
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
        // 飛行敵の影描画
        if (this.type === 'bat' || this.type === 'sine_flyer') {
            this.drawShadow(renderer);
        }
        
        // HPバー描画
        if (this.hp < this.maxHp) {
            this.drawHealthBar(renderer);
        }
        
        // メイン描画
        this.drawMain(renderer);
    }

    /**
     * 影描画
     * @param {Object} renderer - レンダラー
     */
    drawShadow(renderer) {
        const shadowSize = this.type === 'bat' ? this.width * 0.7 : this.width * 0.6;
        
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(
            this.x + this.width / 2, 
            this.y + this.height + 10, 
            shadowSize / 2, 
            shadowSize / 4, 
            0, 0, Math.PI * 2
        );
        renderer.ctx.fill();
    }

    /**
     * HPバー描画
     * @param {Object} renderer - レンダラー
     */
    drawHealthBar(renderer) {
        // 背景
        renderer.drawRect(this.x, this.y - 9, this.width, 6, '#FF0000');
        
        // HP
        const hpWidth = (this.width - 2) * (this.hp / this.maxHp);
        renderer.drawRect(this.x + 2, this.y - 7, hpWidth, 2, '#00FF00');
    }

    /**
     * メイン描画
     * @param {Object} renderer - レンダラー
     */
    drawMain(renderer) {
        switch (this.type) {
            case 'bat':
                this.drawBat(renderer);
                break;
            case 'sine_flyer':
                this.drawSineFlyer(renderer);
                break;
            case 'ground_walker':
                this.drawGroundWalker(renderer);
                break;
            case 'sword_thrower':
                this.drawSwordThrower(renderer);
                break;
            case 'bomb_walker':
                this.drawBombWalker(renderer);
                break;
            default:
                renderer.drawRect(this.x, this.y, this.width, this.height, this.color);
                break;
        }
    }

    /**
     * コウモリ描画
     * @param {Object} renderer - レンダラー
     */
    drawBat(renderer) {
        renderer.drawSprite('bat', this.x, this.y, 3);
    }

    /**
     * サイン波飛行敵描画
     * @param {Object} renderer - レンダラー
     */
    drawSineFlyer(renderer) {
        renderer.drawSprite('broccoli_princess', this.x, this.y, 3);
    }

    /**
     * 地上歩行敵描画
     * @param {Object} renderer - レンダラー
     */
    drawGroundWalker(renderer) {
        renderer.drawSprite('egg_knight', this.x, this.y, 3);
    }

    /**
     * ソード投げ騎士描画
     * @param {Object} renderer - レンダラー
     */
    drawSwordThrower(renderer) {
        renderer.drawSprite('banana_hero', this.x, this.y, 3);
    }

    /**
     * 爆弾歩行敵描画
     * @param {Object} renderer - レンダラー
     */
    drawBombWalker(renderer) {
        // 点滅エフェクト
        const shouldBlink = Math.sin(this.blinkTimer * 8) > 0;
        
        // 点滅時は色を変えてスプライト描画
        if (shouldBlink) {
            // 赤っぽく光らせるためのオーバーレイ用スプライト描画
            renderer.ctx.save();
            renderer.ctx.globalCompositeOperation = 'source-over';
            renderer.drawSprite('fried_fang', this.x, this.y, 3);
            
            // 赤いグロー効果
            renderer.ctx.globalCompositeOperation = 'overlay';
            renderer.ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
            renderer.ctx.fillRect(this.x, this.y, this.width, this.height);
            renderer.ctx.restore();
            
            // 火花エフェクト
            for (let i = 0; i < 4; i++) {
                const sparkX = this.x + this.width / 2 + (Math.random() - 0.5) * 12;
                const sparkY = this.y - 4 + Math.random() * 8;
                const sparkSize = 1 + Math.random() * 2;
                renderer.ctx.fillStyle = Math.random() > 0.5 ? '#FFFF00' : '#FF6600';
                renderer.ctx.fillRect(sparkX, sparkY, sparkSize, sparkSize);
            }
        } else {
            // 通常時
            renderer.drawSprite('fried_fang', this.x, this.y, 3);
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
 * 敵ファクトリークラス
 */
export class EnemyFactory {
    /**
     * 敵スポーン処理
     * @param {Object} gameState - ゲーム状態
     * @returns {Array} 生成された敵の配列
     */
    static spawnEnemies(gameState) {
        const enemies = [];
        
        if (!gameState.isBossBattle && !gameState.gameCleared && !gameState.isBossMode && 
            gameState.gameStarted && Math.random() < gameState.enemySpawnRate) {
            
            const enemyType = Math.random();
            
            if (enemyType < 0.25) {
                // コウモリ編隊
                enemies.push(...this.createBatFormation());
            } else if (enemyType < 0.45) {
                // サイン波飛行敵
                enemies.push(this.createSineFlyer());
            } else if (enemyType < 0.65) {
                // 地上歩行敵
                enemies.push(this.createGroundWalker());
            } else if (enemyType < 0.8) {
                // ソード投げ騎士
                enemies.push(this.createSwordThrower());
            } else {
                // 爆弾歩行敵
                enemies.push(this.createBombWalker());
            }
        }
        
        return enemies;
    }

    /**
     * コウモリ編隊生成
     * @returns {Array} コウモリ配列
     */
    static createBatFormation() {
        const bats = [];
        const formationSize = Math.random() < 0.4 ? 1 : (Math.random() < 0.7 ? 2 : 3);
        
        for (let f = 0; f < formationSize; f++) {
            const bat = new Enemy({
                x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 140) + 70 + (f * 40),
                y: -48,
                width: 48,
                height: 48,
                speed: 0.3 + Math.random() * 0.1, // 0.6-0.8 → 0.3-0.4 (さらに50%減)
                hp: 20,
                type: 'bat',
                pattern: 'fly_dynamic',
                amplitude: 150 + Math.random() * 100,
                formationOffset: f * Math.PI / 3,
                shootCooldown: 120 + Math.random() * 180
            });
            
            bat.swoopTimer = Math.random() * 300;
            bat.swoopActive = false;
            bats.push(bat);
        }
        
        return bats;
    }

    /**
     * サイン波飛行敵生成
     * @returns {Enemy} サイン波飛行敵
     */
    static createSineFlyer() {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -43 : GAME_CONFIG.CANVAS_WIDTH + 43;
        
        return new Enemy({
            x: x,
            y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT / 2),
            width: 43,
            height: 43,
            speed: 0.35 + Math.random() * 0.15, // 0.7-0.95 → 0.35-0.5 (さらに50%減)
            hp: 100, // HPを60→100に強化
            type: 'sine_flyer',
            pattern: 'sine_curve',
            initialX: x,
            amplitude: 80 + Math.random() * 40,
            frequency: 0.03 + Math.random() * 0.02,
            shootCooldown: 100 + Math.random() * 150
        });
    }

    /**
     * 地上歩行敵生成
     * @returns {Enemy} 地上歩行敵
     */
    static createGroundWalker() {
        return new Enemy({
            x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 120) + 60,
            y: -43,
            width: 43,
            height: 43,
            speed: 0.2 + Math.random() * 0.1, // 0.4-0.6 → 0.2-0.3 (さらに50%減)
            hp: 50,
            type: 'ground_walker',
            pattern: 'walk_straight',
            shootCooldown: 150 + Math.random() * 200
        });
    }

    /**
     * ソード投げ騎士生成
     * @returns {Enemy} ソード投げ騎士
     */
    static createSwordThrower() {
        const enemy = new Enemy({
            x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 120) + 60,
            y: -50,
            width: 50,
            height: 50,
            speed: 0.18 + Math.random() * 0.07, // 0.35-0.5 → 0.18-0.25 (さらに50%減)
            hp: 80,
            type: 'sword_thrower',
            pattern: 'walk_straight',
            shootCooldown: 180 + Math.random() * 120
        });
        
        enemy.swordCount = 0;
        return enemy;
    }

    /**
     * 爆弾歩行敵生成
     * @returns {Enemy} 爆弾歩行敵
     */
    static createBombWalker() {
        return new Enemy({
            x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 120) + 60,
            y: -45,
            width: 45,
            height: 45,
            speed: 0.15 + Math.random() * 0.05, // 0.25-0.35 → 0.15-0.2 (さらに40%減)
            hp: 150, // 80 -> 150に増強（87.5%アップ）
            type: 'bomb_walker',
            pattern: 'walk_straight',
            contactDamage: 40
        });
    }
}