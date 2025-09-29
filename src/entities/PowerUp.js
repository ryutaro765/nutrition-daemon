import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * パワーアップクラス
 */
export class PowerUp {
    constructor(options = {}) {
        // 基本プロパティ
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 48; // 36 -> 48に拡大（33%アップ）
        this.height = options.height || 48;
        this.speed = options.speed || 1.5;
        this.type = options.type || 'health';
        
        // アニメーション
        this.angle = 0;
        this.pulseTimer = 0;
        this.sparkleTimer = 0;
        
        // 削除フラグ
        this.shouldRemove = false;
        
        // タイプ別設定
        this.initializeType();
    }

    /**
     * タイプ別初期化
     */
    initializeType() {
        switch (this.type) {
            case 'carbohydrate':
                this.baseColor = '#FFD700'; // ゴールド
                this.accentColor = '#FFF8DC';
                this.description = 'エネルギー補給 +30HP';
                this.spriteKey = 'carbohydrate_ball';
                break;
            case 'protein':
                this.baseColor = '#FF6B6B'; // 赤
                this.accentColor = '#FFFFFF';
                this.description = '筋力強化 武器レベルアップ';
                this.spriteKey = 'protein_ball';
                break;
            case 'fat':
                this.baseColor = '#FF8C00'; // オレンジ
                this.accentColor = '#FFF8DC';
                this.description = '持久力向上 スピードモード';
                this.spriteKey = 'fat_ball';
                break;
            case 'vitamin':
                this.baseColor = '#32CD32'; // ライムグリーン
                this.accentColor = '#98FB98';
                this.description = '免疫力アップ +40HP';
                this.spriteKey = 'vitamin_ball';
                break;
            case 'mineral':
                this.baseColor = '#4169E1'; // ブルー
                this.accentColor = '#87CEEB';
                this.description = 'レーザー弾薬 +8';
                this.spriteKey = 'mineral_ball';
                break;
            default:
                this.baseColor = '#808080';
                this.accentColor = '#FFFFFF';
                this.description = '不明なアイテム';
                break;
        }
    }

    /**
     * パワーアップ更新
     */
    update() {
        // 落下移動
        this.y += this.speed;
        
        // 回転アニメーション
        this.angle += 0.1;
        
        // パルスアニメーション
        this.pulseTimer += 0.15;
        
        // キラキラエフェクト用タイマー
        this.sparkleTimer += 0.2;
        
        // 画面外チェック
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT) {
            this.shouldRemove = true;
        }
    }

    /**
     * プレイヤーとの衝突処理
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponSystem - 武器システム（オプション）
     * @returns {boolean} アイテムを取得したかどうか
     */
    applyEffect(gameState, weaponSystem = null) {
        switch (this.type) {
            case 'health':
                gameState.healHP(20);
                break;
            case 'power':
                gameState.addScore(100);
                break;
            case 'weapon':
                console.log(`🔫 WEAPON ITEM PICKUP: Before upgrade - GameState=${gameState.weaponLevel}, WeaponSystem=${weaponSystem?.currentLevel || 'N/A'}`);
                const upgradeSuccess = gameState.upgradeWeapon(weaponSystem);
                console.log(`🔫 WEAPON ITEM PICKUP: After upgrade - GameState=${gameState.weaponLevel}, WeaponSystem=${weaponSystem?.currentLevel || 'N/A'}, Success=${upgradeSuccess}`);
                break;
            case 'laser_ammo':
                gameState.addLaserAmmo(8);
                break;
            case 'speed_mode':
                gameState.activateSpeedMode(300); // 5秒間
                break;
        }
        
        this.shouldRemove = true;
        return true;
    }

    /**
     * 描画処理（可愛いボール風スプライト版）
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        // パルスエフェクト計算
        const pulseScale = 1 + Math.sin(this.pulseTimer) * 0.1;
        const finalScale = 0.75 * pulseScale; // 64x64を48x48にスケール（0.75倍）
        
        // 栄養素ボールスプライトキーを使用
        const spriteKey = this.spriteKey || 'carbohydrate_ball';
        console.log(`PowerUp type: ${this.type}, spriteKey: ${spriteKey}`);
        
        // 回転とスケールを適用して描画
        renderer.ctx.save();
        
        // 中心点で回転
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        renderer.ctx.translate(centerX, centerY);
        renderer.ctx.rotate(this.angle);
        
        // スプライト描画（中心基準）
        const spriteSize = 64 * finalScale; // 64x64画像用
        console.log(`🎨 Drawing sprite: ${spriteKey} for type: ${this.type}`);
        renderer.drawSprite(spriteKey, -spriteSize / 2, -spriteSize / 2, finalScale);
        
        // 栄養素アルファベット表示
        let letter = '';
        switch (this.type) {
            case 'carbohydrate': letter = 'C'; break;
            case 'protein': letter = 'P'; break;
            case 'fat': letter = 'F'; break;
            case 'vitamin': letter = 'V'; break;
            case 'mineral': letter = 'M'; break;
        }
        
        if (letter) {
            renderer.ctx.fillStyle = '#FFFFFF';
            renderer.ctx.strokeStyle = '#000000';
            renderer.ctx.lineWidth = 3;
            renderer.ctx.font = `bold ${Math.floor(12 * finalScale)}px Arial`;
            renderer.ctx.textAlign = 'center';
            renderer.ctx.textBaseline = 'middle';
            
            // 文字に縁取りを追加
            renderer.ctx.strokeText(letter, 0, 0);
            renderer.ctx.fillText(letter, 0, 0);
        }
        
        // キラキラエフェクト
        this.drawSparkleEffect(renderer);
        
        renderer.ctx.restore();
    }

    /**
     * 光のオーラ描画
     * @param {Object} renderer - レンダラー
     * @param {number} pulseScale - パルススケール
     */
    drawAura(renderer, pulseScale) {
        const auraSize = 25 * pulseScale;
        const alpha = 0.3 + Math.sin(this.pulseTimer * 2) * 0.2;
        
        renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // カラーオーラ
        renderer.ctx.fillStyle = this.baseColor.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba');
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, 0, auraSize * 0.8, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * メインアイテム描画
     * @param {Object} renderer - レンダラー
     * @param {number} width - 幅
     * @param {number} height - 高さ
     */
    drawMainItem(renderer, width, height) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        switch (this.type) {
            case 'health':
                this.drawHealthItem(renderer, halfWidth, halfHeight);
                break;
            case 'power':
                this.drawPowerItem(renderer, halfWidth, halfHeight);
                break;
            case 'weapon':
                this.drawWeaponItem(renderer, halfWidth, halfHeight);
                break;
            case 'laser_ammo':
                this.drawLaserAmmoItem(renderer, halfWidth, halfHeight);
                break;
            case 'speed_mode':
                this.drawSpeedModeItem(renderer, halfWidth, halfHeight);
                break;
        }
    }

    /**
     * 体力回復アイテム描画
     * @param {Object} renderer - レンダラー
     * @param {number} halfWidth - 半分の幅
     * @param {number} halfHeight - 半分の高さ
     */
    drawHealthItem(renderer, halfWidth, halfHeight) {
        // 赤い背景
        renderer.ctx.fillStyle = this.baseColor;
        renderer.ctx.fillRect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
        
        // 白い十字
        renderer.ctx.fillStyle = this.accentColor;
        renderer.ctx.fillRect(-3, -15, 6, 30);
        renderer.ctx.fillRect(-15, -3, 30, 6);
        
        // 光沢効果
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        renderer.ctx.fillRect(-halfWidth + 2, -halfHeight + 2, halfWidth / 2, halfHeight / 2);
    }

    /**
     * パワーアイテム描画（星型）
     * @param {Object} renderer - レンダラー
     * @param {number} halfWidth - 半分の幅
     * @param {number} halfHeight - 半分の高さ
     */
    drawPowerItem(renderer, halfWidth, halfHeight) {
        renderer.ctx.fillStyle = this.baseColor;
        renderer.ctx.beginPath();
        
        // 5角星描画
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = halfWidth * Math.cos(angle);
            const y = halfWidth * Math.sin(angle);
            
            if (i === 0) {
                renderer.ctx.moveTo(x, y);
            } else {
                renderer.ctx.lineTo(x, y);
            }
            
            // 内側の点
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
            const innerX = (halfWidth * 0.4) * Math.cos(innerAngle);
            const innerY = (halfWidth * 0.4) * Math.sin(innerAngle);
            renderer.ctx.lineTo(innerX, innerY);
        }
        
        renderer.ctx.closePath();
        renderer.ctx.fill();
        
        // 中心の光
        renderer.ctx.fillStyle = this.accentColor;
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, 0, halfWidth * 0.3, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * 武器アイテム描画
     * @param {Object} renderer - レンダラー
     * @param {number} halfWidth - 半分の幅
     * @param {number} halfHeight - 半分の高さ
     */
    drawWeaponItem(renderer, halfWidth, halfHeight) {
        // 青い背景
        renderer.ctx.fillStyle = this.baseColor;
        renderer.ctx.fillRect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
        
        // 薄い青の内側
        renderer.ctx.fillStyle = this.accentColor;
        renderer.ctx.fillRect(-halfWidth + 3, -halfHeight + 3, halfWidth * 2 - 6, halfHeight * 2 - 6);
        
        // 白い「W」文字
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.font = 'bold 24px Arial';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'middle';
        renderer.ctx.fillText('W', 0, 0);
        
        // 光沢効果
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        renderer.ctx.fillRect(-halfWidth + 2, -halfHeight + 2, halfWidth / 2, halfHeight / 2);
    }

    /**
     * レーザー弾薬アイテム描画
     * @param {Object} renderer - レンダラー
     * @param {number} halfWidth - 半分の幅
     * @param {number} halfHeight - 半分の高さ
     */
    drawLaserAmmoItem(renderer, halfWidth, halfHeight) {
        // シアン背景
        renderer.ctx.fillStyle = this.baseColor;
        renderer.ctx.fillRect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
        
        // 薄いシアンの内側
        renderer.ctx.fillStyle = this.accentColor;
        renderer.ctx.fillRect(-halfWidth + 3, -halfHeight + 3, halfWidth * 2 - 6, halfHeight * 2 - 6);
        
        // 白い「L」文字
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.font = 'bold 24px Arial';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'middle';
        renderer.ctx.fillText('L', 0, 0);
        
        // レーザーエフェクト
        const laserAlpha = 0.5 + Math.sin(this.sparkleTimer * 3) * 0.3;
        renderer.ctx.fillStyle = `rgba(0, 255, 255, ${laserAlpha})`;
        renderer.ctx.fillRect(-2, -halfHeight, 4, halfHeight * 2);
    }

    /**
     * 高速モードアイテム描画
     * @param {Object} renderer - レンダラー
     * @param {number} halfWidth - 半分の幅
     * @param {number} halfHeight - 半分の高さ
     */
    drawSpeedModeItem(renderer, halfWidth, halfHeight) {
        // ピンク背景
        renderer.ctx.fillStyle = this.baseColor;
        renderer.ctx.fillRect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
        
        // 薄いピンクの内側
        renderer.ctx.fillStyle = this.accentColor;
        renderer.ctx.fillRect(-halfWidth + 3, -halfHeight + 3, halfWidth * 2 - 6, halfHeight * 2 - 6);
        
        // 白い「S」文字
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.font = 'bold 24px Arial';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'middle';
        renderer.ctx.fillText('S', 0, 0);
        
        // スピードライン
        for (let i = 0; i < 3; i++) {
            const lineY = -10 + i * 10;
            const lineLength = 8 + Math.sin(this.sparkleTimer + i) * 4;
            
            renderer.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            renderer.ctx.lineWidth = 2;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(halfWidth + 2, lineY);
            renderer.ctx.lineTo(halfWidth + 2 + lineLength, lineY);
            renderer.ctx.stroke();
        }
    }

    /**
     * キラキラエフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawSparkleEffect(renderer) {
        const sparkleCount = 6;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + this.sparkleTimer;
            const distance = 25 + Math.sin(this.sparkleTimer + i) * 8;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = 2 + Math.sin(this.sparkleTimer * 2 + i) * 1;
            const alpha = 0.6 + Math.sin(this.sparkleTimer * 3 + i) * 0.4;
            
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            renderer.ctx.beginPath();
            renderer.ctx.arc(x, y, size, 0, Math.PI * 2);
            renderer.ctx.fill();
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
 * パワーアップファクトリークラス
 */
export class PowerUpFactory {
    /**
     * パワーアップ生成（敵撃破時）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {PowerUp|null} パワーアップオブジェクト
     */
    static createFromEnemyDeath(x, y) {
        // 30%の確率でパワーアップドロップ
        if (Math.random() > 0.3) {
            return null;
        }
        
        return this.createRandomPowerUp(x, y);
    }

    /**
     * ランダムパワーアップ生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {PowerUp} パワーアップオブジェクト
     */
    static createRandomPowerUp(x, y) {
        const type = this.getRandomPowerUpType();
        
        return new PowerUp({
            x: x - 18,
            y: y,
            type: type
        });
    }

    /**
     * ランダムパワーアップタイプ取得
     * @returns {string} パワーアップタイプ
     */
    static getRandomPowerUpType() {
        const nutritionTypes = ['carbohydrate', 'protein', 'fat', 'vitamin', 'mineral'];
        const randomIndex = Math.floor(Math.random() * nutritionTypes.length);
        return nutritionTypes[randomIndex]; // 各20%の確率
    }

    /**
     * 特定タイプのパワーアップ生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} type - パワーアップタイプ
     * @returns {PowerUp} パワーアップオブジェクト
     */
    static createSpecificPowerUp(x, y, type) {
        return new PowerUp({
            x: x - 18,
            y: y,
            type: type
        });
    }

    /**
     * ？ボックス破壊時のパワーアップ生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {PowerUp} パワーアップオブジェクト
     */
    static createFromQuestionBox(x, y) {
        const types = ['weapon', 'health', 'laser_ammo', 'speed_mode'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        return new PowerUp({
            x: x - 18,
            y: y,
            type: randomType
        });
    }

    /**
     * ボス撃破時の特別パワーアップ生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} パワーアップ配列
     */
    static createBossRewards(x, y) {
        const powerUps = [];
        
        // 武器アップグレード確定
        powerUps.push(new PowerUp({
            x: x - 40,
            y: y,
            type: 'weapon'
        }));
        
        // 体力回復確定
        powerUps.push(new PowerUp({
            x: x,
            y: y,
            type: 'health'
        }));
        
        // レーザー弾薬確定
        powerUps.push(new PowerUp({
            x: x + 40,
            y: y,
            type: 'laser_ammo'
        }));
        
        return powerUps;
    }
}