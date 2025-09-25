import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * 衝突判定システム
 */
export class CollisionSystem {
    /**
     * 矩形同士の衝突判定
     * @param {Object} rect1 - 1つ目の矩形
     * @param {Object} rect2 - 2つ目の矩形
     * @returns {boolean} 衝突しているかどうか
     */
    static checkRectCollision(rect1, rect2) {
        return rect1.left < rect2.right &&
               rect1.right > rect2.left &&
               rect1.top < rect2.bottom &&
               rect1.bottom > rect2.top;
    }

    /**
     * プレイヤーと敵の衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemies - 敵配列
     * @returns {Object|null} 衝突した敵オブジェクト
     */
    static checkPlayerEnemyCollision(player, enemies) {
        const playerBounds = player.getBounds();
        
        for (const enemy of enemies) {
            if (enemy.shouldRemove) continue;
            
            const enemyBounds = enemy.getBounds();
            if (this.checkRectCollision(playerBounds, enemyBounds)) {
                return enemy;
            }
        }
        
        return null;
    }

    /**
     * プレイヤーとボスの衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} boss - ボスオブジェクト
     * @returns {boolean} 衝突しているかどうか
     */
    static checkPlayerBossCollision(player, boss) {
        if (!boss || boss.shouldRemove) return false;
        
        const playerBounds = player.getBounds();
        const bossBounds = boss.getBounds();
        
        return this.checkRectCollision(playerBounds, bossBounds);
    }

    /**
     * プレイヤーと敵弾の衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} enemyBullets - 敵弾配列
     * @returns {Array} 衝突した弾丸の配列
     */
    static checkPlayerEnemyBulletCollision(player, enemyBullets) {
        const hitBullets = [];
        const playerBounds = player.getBounds();
        
        for (const bullet of enemyBullets) {
            if (bullet.shouldRemove) continue;
            
            const bulletBounds = {
                left: bullet.x,
                right: bullet.x + bullet.width,
                top: bullet.y,
                bottom: bullet.y + bullet.height
            };
            
            if (this.checkRectCollision(playerBounds, bulletBounds)) {
                hitBullets.push(bullet);
            }
        }
        
        return hitBullets;
    }

    /**
     * プレイヤーとパワーアップの衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} powerUps - パワーアップ配列
     * @returns {Array} 取得したパワーアップの配列
     */
    static checkPlayerPowerUpCollision(player, powerUps) {
        const collectedPowerUps = [];
        const playerBounds = player.getBounds();
        
        for (const powerUp of powerUps) {
            if (powerUp.shouldRemove) continue;
            
            const powerUpBounds = powerUp.getBounds();
            if (this.checkRectCollision(playerBounds, powerUpBounds)) {
                collectedPowerUps.push(powerUp);
            }
        }
        
        return collectedPowerUps;
    }

    /**
     * 弾丸と敵の衝突判定
     * @param {Array} bullets - 弾丸配列
     * @param {Array} enemies - 敵配列
     * @returns {Array} 衝突情報の配列 [{bullet, enemy}, ...]
     */
    static checkBulletEnemyCollision(bullets, enemies) {
        const collisions = [];
        
        for (const bullet of bullets) {
            if (bullet.shouldRemove) continue;
            
            const bulletBounds = {
                left: bullet.x,
                right: bullet.x + bullet.width,
                top: bullet.y,
                bottom: bullet.y + bullet.height
            };
            
            for (const enemy of enemies) {
                if (enemy.shouldRemove) continue;
                
                const enemyBounds = enemy.getBounds();
                if (this.checkRectCollision(bulletBounds, enemyBounds)) {
                    collisions.push({ bullet, enemy });
                }
            }
        }
        
        return collisions;
    }

    /**
     * 弾丸とボスの衝突判定
     * @param {Array} bullets - 弾丸配列
     * @param {Object} boss - ボスオブジェクト
     * @returns {Array} 衝突した弾丸の配列
     */
    static checkBulletBossCollision(bullets, boss) {
        // ボスの安全性チェック
        if (!boss || boss.shouldRemove || typeof boss.getBounds !== 'function') {
            console.warn('⚠️ checkBulletBossCollision: Invalid boss object');
            return [];
        }
        
        // 弾丸配列の安全性チェック
        if (!Array.isArray(bullets) || bullets.length === 0) {
            return [];
        }
        
        try {
            const hitBullets = [];
            const bossBounds = boss.getBounds();
            
            // ボス境界の検証
            if (!bossBounds || typeof bossBounds.left !== 'number' || 
                typeof bossBounds.right !== 'number' || typeof bossBounds.top !== 'number' || 
                typeof bossBounds.bottom !== 'number') {
                console.error('❌ Boss getBounds returned invalid bounds:', bossBounds);
                return [];
            }
            
            for (let i = 0; i < bullets.length; i++) {
                const bullet = bullets[i];
                
                // 弾丸の安全性チェック
                if (!bullet || bullet.shouldRemove) continue;
                
                // 弾丸プロパティの検証
                if (typeof bullet.x !== 'number' || typeof bullet.y !== 'number' || 
                    typeof bullet.width !== 'number' || typeof bullet.height !== 'number') {
                    console.error('❌ Invalid bullet properties at index', i, ':', {
                        x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height
                    });
                    continue;
                }
                
                // 弾丸境界の計算と検証
                const bulletBounds = {
                    left: bullet.x,
                    right: bullet.x + bullet.width,
                    top: bullet.y,
                    bottom: bullet.y + bullet.height
                };
                
                // 境界値の妥当性確認（NaN検出）
                if (isNaN(bulletBounds.left) || isNaN(bulletBounds.right) || 
                    isNaN(bulletBounds.top) || isNaN(bulletBounds.bottom)) {
                    console.error('❌ Bullet bounds contain NaN:', bulletBounds);
                    continue;
                }
                
                // 衝突判定
                if (this.checkRectCollision(bulletBounds, bossBounds)) {
                    hitBullets.push(bullet);
                }
            }
            
            return hitBullets;
            
        } catch (error) {
            console.error('❌ Error in checkBulletBossCollision:', error);
            console.error('Boss exists:', !!boss);
            console.error('Bullets count:', bullets ? bullets.length : 'null');
            return [];
        }
    }

    /**
     * プレイヤーと川の衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} rivers - 川エリアの配列
     * @returns {boolean} 川に触れているかどうか
     */
    static checkPlayerRiverCollision(player, rivers) {
        if (!rivers || rivers.length === 0) return false;
        
        const playerBounds = player.getBounds();
        
        for (const river of rivers) {
            const riverBounds = {
                left: river.x,
                right: river.x + river.width,
                top: river.y,
                bottom: river.y + river.height
            };
            
            if (this.checkRectCollision(playerBounds, riverBounds)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * プレイヤーと橋の衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} bridges - 橋エリアの配列
     * @returns {boolean} 橋の上にいるかどうか
     */
    static checkPlayerBridgeCollision(player, bridges) {
        if (!bridges || bridges.length === 0) return false;
        
        const playerBounds = player.getBounds();
        
        for (const bridge of bridges) {
            const bridgeBounds = {
                left: bridge.x,
                right: bridge.x + bridge.width,
                top: bridge.y,
                bottom: bridge.y + bridge.height
            };
            
            if (this.checkRectCollision(playerBounds, bridgeBounds)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 画面境界との衝突判定
     * @param {Object} entity - エンティティオブジェクト
     * @returns {Object} 境界衝突情報 {left, right, top, bottom}
     */
    static checkBoundaryCollision(entity) {
        const bounds = entity.getBounds();
        
        return {
            left: bounds.left < 0,
            right: bounds.right > GAME_CONFIG.CANVAS_WIDTH,
            top: bounds.top < 0,
            bottom: bounds.bottom > GAME_CONFIG.CANVAS_HEIGHT
        };
    }

    /**
     * 弾丸と？ボックスの衝突判定
     * @param {Array} bullets - 弾丸配列
     * @param {Array} questionBoxes - ？ボックス配列
     * @returns {Array} 衝突情報の配列 [{bullet, questionBox}, ...]
     */
    static checkBulletQuestionBoxCollision(bullets, questionBoxes) {
        const collisions = [];
        
        for (const bullet of bullets) {
            if (bullet.shouldRemove) continue;
            
            const bulletBounds = {
                left: bullet.x,
                right: bullet.x + bullet.width,
                top: bullet.y,
                bottom: bullet.y + bullet.height
            };
            
            for (const questionBox of questionBoxes) {
                if (questionBox.shouldRemove) continue;
                
                const questionBoxBounds = {
                    left: questionBox.x,
                    right: questionBox.x + questionBox.width,
                    top: questionBox.y,
                    bottom: questionBox.y + questionBox.height
                };
                
                if (this.checkRectCollision(bulletBounds, questionBoxBounds)) {
                    collisions.push({ bullet, questionBox });
                }
            }
        }
        
        return collisions;
    }

    /**
     * 円形の衝突判定
     * @param {Object} circle1 - 1つ目の円 {x, y, radius}
     * @param {Object} circle2 - 2つ目の円 {x, y, radius}
     * @returns {boolean} 衝突しているかどうか
     */
    static checkCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (circle1.radius + circle2.radius);
    }

    /**
     * 複合衝突判定（全体処理）
     * @param {Object} gameState - ゲーム状態
     * @param {Object} entities - 全エンティティ
     * @returns {Object} 衝突結果
     */
    static processAllCollisions(gameState, entities) {
        const results = {
            playerHit: false,
            hitEnemies: [],
            hitBoss: null,
            collectedPowerUps: [],
            brokenQuestionBoxes: [],
            playerOnBridge: false,
            playerInRiver: false
        };

        if (!entities.player || gameState.gameOver) {
            return results;
        }

        // プレイヤーと敵の衝突
        const hitEnemy = this.checkPlayerEnemyCollision(entities.player, entities.enemies);
        if (hitEnemy) {
            results.playerHit = true;
            results.hitEnemies.push(hitEnemy);
        }

        // プレイヤーとボスの衝突
        if (entities.boss && this.checkPlayerBossCollision(entities.player, entities.boss)) {
            results.playerHit = true;
            results.hitBoss = entities.boss;
        }

        // プレイヤーと敵弾の衝突
        const hitBullets = this.checkPlayerEnemyBulletCollision(entities.player, entities.enemyBullets);
        if (hitBullets.length > 0) {
            results.playerHit = true;
        }

        // プレイヤーとパワーアップの衝突
        results.collectedPowerUps = this.checkPlayerPowerUpCollision(entities.player, entities.powerUps);

        // 弾丸と敵の衝突
        const bulletEnemyCollisions = this.checkBulletEnemyCollision(entities.bullets, entities.enemies);
        for (const collision of bulletEnemyCollisions) {
            results.hitEnemies.push(collision.enemy);
        }

        // 弾丸とボスの衝突（安全性チェック付き）
        if (entities.boss && !entities.boss.shouldRemove && Array.isArray(entities.bullets)) {
            const bulletBossHits = this.checkBulletBossCollision(entities.bullets, entities.boss);
            if (bulletBossHits.length > 0) {
                results.hitBoss = entities.boss;
            }
        }

        // 弾丸と？ボックスの衝突
        const questionBoxCollisions = this.checkBulletQuestionBoxCollision(entities.bullets, entities.questionBoxes);
        results.brokenQuestionBoxes = questionBoxCollisions.map(c => c.questionBox);

        // プレイヤーと地形の衝突
        if (entities.bridges) {
            results.playerOnBridge = this.checkPlayerBridgeCollision(entities.player, entities.bridges);
        }
        
        if (entities.rivers) {
            results.playerInRiver = this.checkPlayerRiverCollision(entities.player, entities.rivers);
        }

        return results;
    }
}