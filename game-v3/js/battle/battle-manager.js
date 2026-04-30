const BattleManager = {
    state: "idle",
    player: null,
    enemy: null,
    initialized: false,
    _boundUpdate: null,
    _boundEnemyExecute: null,

    init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        this._boundUpdate = this.update.bind(this);
        this._boundEnemyExecute = this.onEnemyExecute.bind(this);

        GameEvents.on("enemyExecute", this._boundEnemyExecute);

        const startButton = document.getElementById("start-button");
        const retryButton = document.getElementById("retry-button");
        const restartHudButton = document.getElementById("restart-battle-button");

        if (startButton) {
            startButton.addEventListener("click", this.startBattle.bind(this, "qi", TEST_ENEMY));
        }

        if (retryButton) {
            retryButton.addEventListener("click", this.restartBattle.bind(this));
        }

        if (restartHudButton) {
            restartHudButton.addEventListener("click", this.restartBattle.bind(this));
        }
    },

    createPlayer(playerClass) {
        if (playerClass === "qi") {
            return new QiMaster();
        }
        return new QiMaster();
    },

    startBattle(playerClass, enemyData) {
        this.cleanup();

        this.player = this.createPlayer(playerClass);
        this.enemy = new Enemy(enemyData);
        this.state = "fighting";

        SkillSystem.reset();
        BattleUI.bindBattle(this.player, this.enemy);
        BattleUI.hideStartOverlay();
        BattleUI.hideResultOverlay();
        BattleUI.setStatusText("战斗中");
        BattleUI.setSkillStatus("不在施法中时可立即出招");

        GameLoop.removeUpdate(this._boundUpdate);
        GameLoop.addUpdate(this._boundUpdate);
        GameLoop.start();

        GameEvents.emit("battleStart", {
            player: this.player,
            enemy: this.enemy
        });

        BattleUI.update(0);
    },

    restartBattle() {
        this.startBattle("qi", TEST_ENEMY);
    },

    cleanup() {
        GameLoop.stop();
        GameLoop.removeUpdate(this._boundUpdate);
        SkillSystem.reset();
        this.state = "idle";
        this.player = null;
        this.enemy = null;
    },

    update(dt) {
        if (this.state !== "fighting" || !this.player || !this.enemy) {
            return;
        }

        this.player.update(dt);
        this.enemy.update(dt);
        SkillSystem.update(dt);
        BattleUI.update(dt);

        if (this.enemy.hp <= 0) {
            this.win();
            return;
        }

        if (this.player.hp <= 0) {
            this.lose();
        }
    },

    onEnemyExecute(payload) {
        if (this.state !== "fighting" || !payload || payload.enemy !== this.enemy) {
            return;
        }

        const action = payload.action;
        if (!action || !action.damage) {
            return;
        }

        const damageInfo = calculateDamageInfo(this.enemy, action, this.player);
        const actualDamage = this.player.takeDamage(damageInfo.amount);
        damageInfo.amount = actualDamage;

        GameEvents.emit("playerHit", {
            attacker: this.enemy,
            target: this.player,
            action: action,
            damageInfo: damageInfo
        });

        if (this.player.hp <= 0) {
            this.lose();
        }
    },

    win() {
        if (this.state !== "fighting") {
            return;
        }

        this.state = "win";
        GameLoop.pause();
        BattleUI.setStatusText("胜利");
        GameEvents.emit("battleEnd", {
            result: "win",
            player: this.player,
            enemy: this.enemy
        });
    },

    lose() {
        if (this.state !== "fighting") {
            return;
        }

        this.state = "lose";
        GameLoop.pause();
        BattleUI.setStatusText("败北");
        GameEvents.emit("battleEnd", {
            result: "lose",
            player: this.player,
            enemy: this.enemy
        });
    }
};
