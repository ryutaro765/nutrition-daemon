import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * プレイヤークラス
 * ポポロン（重厚な鎧の戦士）の制御とアニメーション
 */
export class Player {
    constructor(x, y) {
        // 基本プロパティ
        this.x = x || GAME_CONFIG.PLAYER.INITIAL_X;
        this.y = y || GAME_CONFIG.PLAYER.INITIAL_Y;
        this.width = GAME_CONFIG.PLAYER.WIDTH;
        this.height = GAME_CONFIG.PLAYER.HEIGHT;
        this.speed = GAME_CONFIG.PLAYER.SPEED;
        
        // アニメーション関連
        this.walkFrame = 0;
        this.footOffset = 0;
        this.bodyOffset = 0;
        this.headOffset = 0;
        this.armOffset = 0;
        this.animationSpeed = 0.15;
        
        // 移動状態
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        this.facing = 'down'; // プレイヤーの向き
        
        // 射撃関連
        this.shootCooldown = 0;
        this.lastShootTime = 0;
        
        // 高速モード用残像
        this.trailPositions = [];
        this.maxTrailLength = 8;
        
        // 川判定用（川即死無効化により、判定のみ残す）
        this.isInRiver = false;
        this.previousPosition = { x: this.x, y: this.y };
        // this.initialSpawnProtection = 120; // 川即死無効化により不要
        
        // フレームカウント（デバッグ用）
        this.frameCount = 0;
    }

    /**
     * プレイヤー更新
     * @param {Object} inputManager - 入力管理オブジェクト
     * @param {Object} gameState - ゲーム状態オブジェクト
     * @param {Array} rivers - 川データ配列
     * @param {Array} bridges - 橋データ配列
     */
    update(inputManager, gameState, rivers, bridges) {
        // フレームカウント更新
        this.frameCount++;
        
        // 前の位置を保存
        this.previousPosition = { x: this.x, y: this.y };
        
        // 移動入力取得
        const movement = inputManager.getMovementInput();
        this.direction = movement;
        this.isMoving = movement.x !== 0 || movement.y !== 0;
        
        // 移動処理
        if (this.isMoving) {
            this.move(movement, gameState, rivers, bridges);
        }
        
        // アニメーション更新
        this.updateAnimation(gameState);
        
        // 射撃クールダウン更新
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // 高速モード残像更新
        this.updateSpeedTrail(gameState);
        
        // 川判定
        this.checkInRiver(rivers, bridges, gameState);
    }

    /**
     * 移動処理
     * @param {Object} movement - 移動方向
     * @param {Object} gameState - ゲーム状態
     * @param {Array} rivers - 川データ配列
     * @param {Array} bridges - 橋データ配列
     */
    move(movement, gameState, rivers, bridges) {
        // 高速モード時の速度調整
        const currentSpeed = gameState.isSpeedMode 
            ? this.speed * GAME_CONFIG.PLAYER.SPEED_MULTIPLIER_HIGH 
            : this.speed;
        
        // 新しい位置計算
        let newX = this.x + movement.x * currentSpeed;
        let newY = this.y + movement.y * currentSpeed;
        
        // 画面境界チェック（柱を考慮）
        const leftBound = 45; // 左柱の幅 + マージン
        const rightBound = GAME_CONFIG.CANVAS_WIDTH - 45; // 右柱の幅 + マージン
        const topBound = 0;
        const bottomBound = GAME_CONFIG.CANVAS_HEIGHT - this.height;
        
        newX = Math.max(leftBound, Math.min(rightBound - this.width, newX));
        newY = Math.max(topBound, Math.min(bottomBound, newY));
        
        // 川との衝突判定（移動可能かチェック）
        const wouldBeInRiver = this.checkWouldBeInRiver(newX, newY, rivers, bridges);
        
        if (!wouldBeInRiver) {
            this.x = newX;
            this.y = newY;
        } else {
            // 川に入ろうとした場合は移動を制限
            // X軸のみの移動を試行
            const onlyXMove = this.checkWouldBeInRiver(newX, this.y, rivers, bridges);
            if (!onlyXMove) {
                this.x = newX;
            } else {
                // Y軸のみの移動を試行
                const onlyYMove = this.checkWouldBeInRiver(this.x, newY, rivers, bridges);
                if (!onlyYMove) {
                    this.y = newY;
                }
            }
        }
        
        // 向きの更新
        this.updateFacing(movement);
    }

    /**
     * 向きの更新
     * @param {Object} movement - 移動方向
     */
    updateFacing(movement) {
        if (movement.y > 0) this.facing = 'down';
        else if (movement.y < 0) this.facing = 'up';
        else if (movement.x > 0) this.facing = 'right';
        else if (movement.x < 0) this.facing = 'left';
    }

    /**
     * アニメーション更新
     * @param {Object} gameState - ゲーム状態
     */
    updateAnimation(gameState) {
        const animSpeed = gameState.isSpeedMode ? this.animationSpeed * 2 : this.animationSpeed;
        
        if (this.isMoving) {
            this.walkFrame += animSpeed;
            
            // 足の動き（左右交互）
            this.footOffset = Math.sin(this.walkFrame) * 3;
            
            // 体の上下動（歩行感を演出）
            this.bodyOffset = Math.abs(Math.sin(this.walkFrame * 0.5)) * 1.5;
            
            // 頭の微動（左右に少し揺れる）
            this.headOffset = Math.sin(this.walkFrame * 0.7) * 0.8;
            
            // 腕の振り（足と逆位相）
            this.armOffset = Math.sin(this.walkFrame + Math.PI) * 2;
        } else {
            // 静止時は動きを減衰
            this.footOffset *= 0.9;
            this.bodyOffset *= 0.9;
            this.headOffset *= 0.9;
            this.armOffset *= 0.9;
            
            // 完全に止まったらリセット
            if (Math.abs(this.footOffset) < 0.1) {
                this.footOffset = 0;
                this.bodyOffset = 0;
                this.headOffset = 0;
                this.armOffset = 0;
            }
        }
    }

    /**
     * 高速モード残像更新
     * @param {Object} gameState - ゲーム状態
     */
    updateSpeedTrail(gameState) {
        if (gameState.isSpeedMode && this.isMoving) {
            // 残像位置を記録
            this.trailPositions.unshift({ x: this.x, y: this.y });
            
            // 残像の長さを制限
            if (this.trailPositions.length > this.maxTrailLength) {
                this.trailPositions.pop();
            }
        } else {
            // 高速モード終了時は残像をクリア
            this.trailPositions = [];
        }
    }

    /**
     * 川判定チェック（移動前の位置チェック）
     * @param {number} x - チェックするX座標
     * @param {number} y - チェックするY座標
     * @param {Object} backgroundSystem - 背景システム
     * @returns {boolean} 川にいるかどうか
     */
    checkWouldBeInRiver(x, y, rivers, bridges) {
        if (!rivers || rivers.length === 0) return false;
        
        // プレイヤーの境界ボックス
        const playerLeft = x;
        const playerRight = x + this.width;
        const playerTop = y;
        const playerBottom = y + this.height;
        
        // 川タイルとの衝突判定
        for (const river of rivers) {
            if (playerLeft < river.x + river.width &&
                playerRight > river.x &&
                playerTop < river.y + river.height &&
                playerBottom > river.y) {
                
                // 橋の上にいるかチェック
                if (this.isOnBridge(x, y, bridges)) {
                    return false; // 橋の上なので川ではない
                }
                
                return true; // 川にいる
            }
        }
        
        return false;
    }

    /**
     * 橋の上にいるかチェック（改良版）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Array} bridges - 橋データ配列
     * @returns {boolean} 橋の上にいるか
     */
    isOnBridge(x, y, bridges) {
        if (!bridges || bridges.length === 0) return false;
        
        const playerLeft = x;
        const playerRight = x + this.width;
        const playerTop = y;
        const playerBottom = y + this.height;
        
        for (const bridge of bridges) {
            // 橋の可視性チェック
            if (!bridge.isVisible) continue;
            
            // 橋の境界
            const bridgeLeft = bridge.x;
            const bridgeRight = bridge.x + bridge.width;
            const bridgeTop = bridge.y;
            const bridgeBottom = bridge.y + bridge.height;
            
            // 重複判定（プレイヤーが橋と重なっているか）
            if (playerLeft < bridgeRight &&
                playerRight > bridgeLeft &&
                playerTop < bridgeBottom &&
                playerBottom > bridgeTop) {
                
                // デバッグ：橋との衝突を検出
                if (this.frameCount % 60 === 0) { // 1秒に1回ログ
                    console.log(`🌉 Player on bridge: player(${x},${y}), bridge(${bridge.x},${bridge.y})`);
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * 川判定の更新（修正版）
     * @param {Array} rivers - 川データ配列
     * @param {Array} bridges - 橋データ配列
     * @param {Object} gameState - ゲーム状態
     */
    checkInRiver(rivers, bridges, gameState) {
        // 初期スポーン保護の更新（川即死無効化により不要）
        // if (this.initialSpawnProtection > 0) {
        //     this.initialSpawnProtection--;
        //     if (this.frameCount % 60 === 0) {
        //         console.log(`🛡️ Spawn protection: ${this.initialSpawnProtection} frames left`);
        //     }
        //     return;
        // }
        
        const wasInRiver = this.isInRiver;
        const isOnBridge = this.isOnBridge(this.x, this.y, bridges);
        const isInRiverArea = this.checkWouldBeInRiver(this.x, this.y, rivers, bridges);
        
        // 橋の上にいる場合は川判定を無効化
        this.isInRiver = isInRiverArea && !isOnBridge;
        
        // デバッグ情報（定期的にログ）
        if (this.frameCount && this.frameCount % 120 === 0) { // 2秒に1回
            console.log(`🌊 River Status: inRiverArea=${isInRiverArea}, onBridge=${isOnBridge}, finalInRiver=${this.isInRiver}`);
        }
        
        // 川に落ちた瞬間の処理（無効化 - ゲームバランス調整のため）
        if (!wasInRiver && this.isInRiver) {
            console.log('🌊 Player entered river (no damage - instant death disabled for game balance)');
            // gameState.takeDamage(999); // 川即死を無効化
        }
        
        // ゲーム状態に川判定を設定（存在する場合のみ）
        if (gameState.setInRiver) {
            gameState.setInRiver(this.isInRiver);
        }
    }

    /**
     * 描画処理
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    draw(renderer, gameState) {
        // デバッグログ（コメントアウト）
        // console.log('🎮 Player draw called at:', this.x, this.y);
        
        // 高速モード残像描画
        if (gameState.isSpeedMode && this.trailPositions.length > 0) {
            this.drawSpeedTrail(renderer);
        }
        
        // メインボディ描画
        this.drawMainBody(renderer, gameState);
        
        // 高速モード時のエフェクト
        if (gameState.isSpeedMode) {
            this.drawSpeedEffects(renderer);
        }
    }

    /**
     * メインボディ描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawMainBody(renderer, gameState) {
        // PNG画像を使用（256pxを約86pxに: 0.336倍）
        const spriteKey = 'popolon_png';
        
        // アニメーション位置調整
        const drawX = this.x + this.headOffset;
        const drawY = this.y - this.bodyOffset;
        
        // スピードモード時は赤い光のオーラエフェクト（キャラの外側）
        if (gameState.isSpeedMode) {
            const ctx = renderer.ctx;
            ctx.save();
            
            // 外側の赤いグロー（パルス効果）
            const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.2;
            const glowSize = 50 * pulseScale;
            
            const gradient = ctx.createRadialGradient(
                drawX + 43, drawY + 43, 0,
                drawX + 43, drawY + 43, glowSize
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX - 30, drawY - 30, 146, 146);
            
            // 残像エフェクト（3つの軌跡）
            for (let i = 1; i <= 3; i++) {
                const alpha = 0.2 - (i * 0.05);
                ctx.globalAlpha = alpha;
                renderer.drawSprite(spriteKey, drawX + (i * 3), drawY, 0.336);
            }
            
            ctx.restore();
        }
        
        // PNGスプライト描画（メイン）
        renderer.drawSprite(spriteKey, drawX, drawY, 0.336);
    }

    /**
     * 鎧の詳細描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     * @param {number} drawX - 描画X座標
     * @param {number} drawY - 描画Y座標
     */
    drawArmorDetails(renderer, gameState, drawX, drawY) {
        const armorColor = gameState.isSpeedMode ? '#FF0000' : '#4169E1';
        
        // 左腕
        const leftArmX = drawX - 2 + this.armOffset;
        const leftArmY = drawY + 8;
        renderer.drawRect(leftArmX, leftArmY, 4, 12, armorColor);
        
        // 右腕
        const rightArmX = drawX + this.width - 2 - this.armOffset;
        const rightArmY = drawY + 8;
        renderer.drawRect(rightArmX, rightArmY, 4, 12, armorColor);
        
        // 左足
        const leftFootX = drawX + 8 + this.footOffset;
        const leftFootY = drawY + this.height - 4;
        renderer.drawRect(leftFootX, leftFootY, 6, 8, armorColor);
        
        // 右足
        const rightFootX = drawX + this.width - 14 - this.footOffset;
        const rightFootY = drawY + this.height - 4;
        renderer.drawRect(rightFootX, rightFootY, 6, 8, armorColor);
    }

    /**
     * 高速モード残像描画
     * @param {Object} renderer - レンダラー
     */
    drawSpeedTrail(renderer) {
        for (let i = 0; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const alpha = (i + 1) / this.trailPositions.length * 0.5;
            
            // 透明度を設定して残像を描画
            renderer.ctx.globalAlpha = alpha;
            renderer.drawSprite('popolon_speed', pos.x, pos.y, 2.25);
        }
        renderer.ctx.globalAlpha = 1.0;
    }

    /**
     * 高速モードエフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawSpeedEffects(renderer) {
        // スピードライン描画
        const lineCount = 8;
        for (let i = 0; i < lineCount; i++) {
            const lineX = this.x - 20 + Math.random() * (this.width + 40);
            const lineY = this.y + Math.random() * this.height;
            const lineLength = 10 + Math.random() * 20;
            
            renderer.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            renderer.ctx.lineWidth = 2;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(lineX, lineY);
            renderer.ctx.lineTo(lineX - lineLength, lineY);
            renderer.ctx.stroke();
        }
        
        // 光のオーラ
        renderer.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        renderer.ctx.beginPath();
        renderer.ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width * 0.8, 
            0, 
            Math.PI * 2
        );
        renderer.ctx.fill();
    }

    /**
     * 射撃可能かチェック
     * @param {Object} gameState - ゲーム状態
     * @returns {boolean} 射撃可能か
     */
    canShoot(gameState) {
        return this.shootCooldown <= 0 && gameState.shootCooldown <= 0;
    }

    /**
     * 射撃実行
     * @param {Object} gameState - ゲーム状態
     */
    shoot(gameState) {
        if (this.canShoot(gameState)) {
            this.shootCooldown = 10; // 射撃間隔
            gameState.shootCooldown = 5;
            this.lastShootTime = Date.now();
        }
    }

    /**
     * 射撃位置取得
     * @returns {Object} 射撃位置 {x, y}
     */
    getShootPosition() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * 境界ボックス取得
     * @returns {Object} 境界ボックス {left, right, top, bottom}
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
     * 位置リセット
     */
    reset() {
        this.x = GAME_CONFIG.PLAYER.INITIAL_X;
        this.y = GAME_CONFIG.PLAYER.INITIAL_Y;
        this.walkFrame = 0;
        this.footOffset = 0;
        this.bodyOffset = 0;
        this.headOffset = 0;
        this.armOffset = 0;
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        this.shootCooldown = 0;
        this.trailPositions = [];
        this.isInRiver = false;
    }

    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            isMoving: this.isMoving,
            facing: this.facing,
            isInRiver: this.isInRiver,
            shootCooldown: this.shootCooldown,
            trailLength: this.trailPositions.length,
            animation: {
                walkFrame: this.walkFrame,
                footOffset: this.footOffset,
                bodyOffset: this.bodyOffset,
                headOffset: this.headOffset,
                armOffset: this.armOffset
            }
        };
    }
}