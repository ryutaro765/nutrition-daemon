import { GAME_CONFIG, WEAPON_NAMES } from '../config/gameConfig.js';
import { BulletFactory } from '../entities/Bullet.js';

/**
 * 武器システム
 */
export class WeaponSystem {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 9;
        this.shootCooldown = 0;
        this.laserAmmo = 0;
        this.maxLaserAmmo = 50;
        
        // 特殊攻撃
        this.specialAttackCooldown = 0;
        this.comboCount = 0;
        this.lastShootTime = 0;
        
        // 武器エフェクト
        this.weaponCharge = 0;
        this.chargeEffectTimer = 0;
        this.muzzleFlashTimer = 0;
        
        // レーザーモード
        this.laserModeActive = false;
        this.laserModeTimer = 0;
        
        // 連射カウンター
        this.rapidFireCounter = 0;
        this.rapidFireBonus = false;
    }

    /**
     * システム更新
     * @param {Object} input - 入力状態
     * @param {Object} gameState - ゲーム状態
     */
    update(input, gameState) {
        // GameStateとの同期チェック（同期ずれを検出）
        if (this.currentLevel !== gameState.weaponLevel) {
            console.log(`⚠️ WEAPON SYNC MISMATCH: WeaponSystem=${this.currentLevel}, GameState=${gameState.weaponLevel} - Force syncing!`);
            this.currentLevel = gameState.weaponLevel;
        }
        
        // クールダウン更新
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown--;
        }
        
        // マズルフラッシュタイマー更新
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer--;
        }
        
        // レーザーモード更新
        this.updateLaserMode();
        
        // チャージエフェクト更新
        this.updateChargeEffect(input);
        
        // 連射ボーナス更新
        this.updateRapidFireBonus(input);
        
        // コンボ更新
        this.updateCombo();
    }

    /**
     * レーザーモード更新
     */
    updateLaserMode() {
        if (this.laserModeActive) {
            this.laserModeTimer--;
            if (this.laserModeTimer <= 0) {
                this.laserModeActive = false;
            }
        }
    }

    /**
     * チャージエフェクト更新
     * @param {Object} input - 入力状態
     */
    updateChargeEffect(input) {
        if (input.isPressed('shoot') && this.shootCooldown <= 0) {
            this.chargeEffectTimer += 1;
            this.weaponCharge = Math.min(this.weaponCharge + 0.1, 1.0);
        } else {
            this.chargeEffectTimer = 0;
            this.weaponCharge = Math.max(this.weaponCharge - 0.05, 0);
        }
    }

    /**
     * 連射ボーナス更新
     * @param {Object} input - 入力状態
     */
    updateRapidFireBonus(input) {
        if (input.isPressed('shoot') && this.shootCooldown <= 0) {
            this.rapidFireCounter++;
            
            // 10回連続射撃で連射ボーナス
            if (this.rapidFireCounter >= 10) {
                this.rapidFireBonus = true;
            }
        } else if (!input.isPressed('shoot')) {
            this.rapidFireCounter = 0;
            this.rapidFireBonus = false;
        }
    }

    /**
     * コンボ更新
     */
    updateCombo() {
        const currentTime = Date.now();
        
        // 2秒以上射撃していない場合はコンボリセット
        if (currentTime - this.lastShootTime > 2000) {
            this.comboCount = 0;
        }
    }

    /**
     * 射撃処理
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} input - 入力状態
     * @param {Object} gameState - ゲーム状態
     * @returns {Array} 生成された弾丸配列
     */
    shoot(player, input, gameState) {
        const bullets = [];
        
        // デバッグログ（一時的にコメントアウト）
        // if (input.isPressed('shoot')) {
        //     console.log('🔫 Shoot button pressed, cooldown:', this.shootCooldown);
        // }
        
        if (!input.isPressed('shoot') || this.shootCooldown > 0) {
            return bullets;
        }
        
        // 通常射撃
        if (!this.laserModeActive) {
            bullets.push(...this.createNormalShot(player, gameState));
        } else {
            // レーザーモード射撃
            bullets.push(...this.createLaserShot(player, gameState));
        }
        
        // 特殊攻撃チェック
        if (input.isPressed('special') && this.specialAttackCooldown <= 0) {
            bullets.push(...this.createSpecialAttack(player, gameState));
            this.specialAttackCooldown = 180; // 3秒クールダウン
        }
        
        // 射撃後処理
        this.onShoot();
        
        return bullets;
    }

    /**
     * 通常射撃生成
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} gameState - ゲーム状態
     * @returns {Array} 弾丸配列
     */
    createNormalShot(player, gameState) {
        const weaponLevel = Math.min(this.currentLevel, this.maxLevel);
        // console.log('🎯 createNormalShot called, weaponLevel:', weaponLevel, 'currentLevel:', this.currentLevel);
        const bullets = BulletFactory.createPlayerBullets(weaponLevel, player.x + player.width / 2, player.y);
        // console.log('🎯 BulletFactory returned:', bullets.length, 'bullets');
        
        // 連射ボーナス適用
        if (this.rapidFireBonus && weaponLevel >= 5) {
            const bonusBullets = BulletFactory.createPlayerBullets(weaponLevel, player.x + player.width / 2, player.y);
            // ボーナス弾を少しずらして配置
            for (const bullet of bonusBullets) {
                bullet.x += (Math.random() - 0.5) * 10;
                bullet.y += 5;
                bullet.damage *= 0.7; // ダメージは少し減少
            }
            bullets.push(...bonusBullets);
        }
        
        return bullets;
    }

    /**
     * レーザー射撃生成
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} gameState - ゲーム状態
     * @returns {Array} 弾丸配列
     */
    createLaserShot(player, gameState) {
        if (this.laserAmmo <= 0) {
            this.laserModeActive = false;
            return [];
        }
        
        this.laserAmmo--;
        
        const bullets = BulletFactory.createPlayerBullets(1, player.x + player.width / 2, player.y); // レーザーは武器レベル1として生成
        
        // レーザー弾の強化
        for (const bullet of bullets) {
            bullet.damage *= 2;
            bullet.type = 'laser';
            bullet.color = '#00FFFF';
            bullet.width *= 1.5;
            bullet.height *= 2;
        }
        
        return bullets;
    }

    /**
     * 特殊攻撃生成
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} gameState - ゲーム状態
     * @returns {Array} 弾丸配列
     */
    createSpecialAttack(player, gameState) {
        const bullets = [];
        const centerX = player.x + player.width / 2;
        const centerY = player.y;
        
        switch (this.currentLevel) {
            case 1:
            case 2:
                // パワーショット
                bullets.push(...this.createPowerShot(centerX, centerY));
                break;
            case 3:
            case 4:
                // 3方向ショット
                bullets.push(...this.createTripleShot(centerX, centerY));
                break;
            case 5:
            case 6:
                // 5方向ショット
                bullets.push(...this.createPentaShot(centerX, centerY));
                break;
            case 7:
            case 8:
                // 円形弾幕
                bullets.push(...this.createCircularShot(centerX, centerY));
                break;
            case 9:
                // 究極攻撃
                bullets.push(...this.createUltimateShot(centerX, centerY));
                break;
        }
        
        return bullets;
    }

    /**
     * パワーショット生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} 弾丸配列
     */
    createPowerShot(x, y) {
        return [{
            x: x - 12,
            y: y - 10,
            vx: 0,
            vy: -8,
            width: 24,
            height: 40,
            damage: 50,
            color: '#FFD700',
            type: 'power_shot',
            piercing: true
        }];
    }

    /**
     * 3方向ショット生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} 弾丸配列
     */
    createTripleShot(x, y) {
        const bullets = [];
        
        for (let i = -1; i <= 1; i++) {
            const angle = i * 0.3;
            bullets.push({
                x: x - 8,
                y: y - 5,
                vx: Math.sin(angle) * 6,
                vy: -6 + Math.abs(i) * 1,
                width: 16,
                height: 20,
                damage: 30,
                color: '#FF6347',
                type: 'triple_shot'
            });
        }
        
        return bullets;
    }

    /**
     * 5方向ショット生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} 弾丸配列
     */
    createPentaShot(x, y) {
        const bullets = [];
        
        for (let i = -2; i <= 2; i++) {
            const angle = i * 0.4;
            bullets.push({
                x: x - 6,
                y: y - 5,
                vx: Math.sin(angle) * 5,
                vy: -5 - Math.abs(i) * 0.5,
                width: 12,
                height: 16,
                damage: 25,
                color: '#4169E1',
                type: 'penta_shot'
            });
        }
        
        return bullets;
    }

    /**
     * 円形弾幕生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} 弾丸配列
     */
    createCircularShot(x, y) {
        const bullets = [];
        const bulletCount = 12;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            bullets.push({
                x: x - 8,
                y: y - 8,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                width: 16,
                height: 16,
                damage: 20,
                color: '#9932CC',
                type: 'circular_shot'
            });
        }
        
        return bullets;
    }

    /**
     * 究極攻撃生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} 弾丸配列
     */
    createUltimateShot(x, y) {
        const bullets = [];
        
        // 中央の大弾
        bullets.push({
            x: x - 20,
            y: y - 15,
            vx: 0,
            vy: -10,
            width: 40,
            height: 60,
            damage: 100,
            color: '#FF1493',
            type: 'ultimate_center',
            piercing: true
        });
        
        // 周囲の弾幕
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const distance = 30;
            bullets.push({
                x: x + Math.cos(angle) * distance - 6,
                y: y + Math.sin(angle) * distance - 6,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3 - 2,
                width: 12,
                height: 12,
                damage: 30,
                color: '#FF69B4',
                type: 'ultimate_satellite'
            });
        }
        
        return bullets;
    }

    /**
     * 射撃後処理
     */
    onShoot() {
        this.lastShootTime = Date.now();
        this.comboCount++;
        this.muzzleFlashTimer = 5;
        
        // クールダウン設定
        let baseCooldown = 3; // 基本クールダウン（連射しやすく短縮）
        
        // 武器レベルに応じてクールダウン短縮
        if (this.currentLevel >= 5) {
            baseCooldown *= 0.8;
        }
        if (this.currentLevel >= 8) {
            baseCooldown *= 0.7;
        }
        
        // 連射ボーナス適用
        if (this.rapidFireBonus) {
            baseCooldown *= 0.6;
        }
        
        this.shootCooldown = Math.max(1, baseCooldown);
    }

    /**
     * 武器レベルアップ
     */
    upgradeWeapon() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            return true;
        }
        return false;
    }

    /**
     * レーザー弾薬追加
     * @param {number} amount - 追加量
     */
    addLaserAmmo(amount) {
        this.laserAmmo = Math.min(this.laserAmmo + amount, this.maxLaserAmmo);
    }

    /**
     * レーザーモード活性化
     * @param {number} duration - 持続時間（フレーム）
     */
    activateLaserMode(duration = 300) {
        this.laserModeActive = true;
        this.laserModeTimer = duration;
    }

    /**
     * 武器システムリセット
     */
    reset() {
        this.currentLevel = 1;
        this.shootCooldown = 0;
        this.laserAmmo = 0;
        this.specialAttackCooldown = 0;
        this.comboCount = 0;
        this.weaponCharge = 0;
        this.chargeEffectTimer = 0;
        this.muzzleFlashTimer = 0;
        this.laserModeActive = false;
        this.laserModeTimer = 0;
        this.rapidFireCounter = 0;
        this.rapidFireBonus = false;
    }

    /**
     * 武器状態取得
     * @returns {Object} 武器状態
     */
    getWeaponState() {
        return {
            level: this.currentLevel,
            maxLevel: this.maxLevel,
            laserAmmo: this.laserAmmo,
            maxLaserAmmo: this.maxLaserAmmo,
            isCharging: this.weaponCharge > 0,
            chargeLevel: this.weaponCharge,
            comboCount: this.comboCount,
            canShoot: this.shootCooldown <= 0,
            shootCooldown: this.shootCooldown,
            specialCooldown: this.specialAttackCooldown,
            laserModeActive: this.laserModeActive,
            laserModeTimer: this.laserModeTimer,
            rapidFireBonus: this.rapidFireBonus,
            muzzleFlash: this.muzzleFlashTimer > 0
        };
    }

    /**
     * 武器名取得
     * @returns {string} 現在の武器名
     */
    getCurrentWeaponName() {
        return WEAPON_NAMES[this.currentLevel] || WEAPON_NAMES[9];
    }

    /**
     * 武器描画（UI用）
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    drawWeaponUI(renderer, x, y) {
        const state = this.getWeaponState();
        
        // 武器レベル表示
        renderer.ctx.fillStyle = '#00FF00';
        renderer.ctx.font = '16px Arial';
        renderer.ctx.fillText(`Weapon: ${state.level}/${state.maxLevel}`, x, y);
        
        // レーザー弾薬表示
        if (state.laserAmmo > 0 || state.laserModeActive) {
            renderer.ctx.fillStyle = '#00FFFF';
            renderer.ctx.fillText(`Laser: ${state.laserAmmo}/${state.maxLaserAmmo}`, x, y + 20);
        }
        
        // チャージレベル表示
        if (state.isCharging) {
            const chargeWidth = 100 * state.chargeLevel;
            renderer.ctx.fillStyle = '#FFD700';
            renderer.ctx.fillRect(x, y + 40, chargeWidth, 4);
            renderer.ctx.strokeStyle = '#FFFFFF';
            renderer.ctx.strokeRect(x, y + 40, 100, 4);
        }
        
        // コンボ表示
        if (state.comboCount > 5) {
            renderer.ctx.fillStyle = '#FF6347';
            renderer.ctx.fillText(`Combo: ${state.comboCount}`, x, y + 60);
        }
        
        // 連射ボーナス表示
        if (state.rapidFireBonus) {
            renderer.ctx.fillStyle = '#FF1493';
            renderer.ctx.fillText('RAPID FIRE!', x, y + 80);
        }
    }
}