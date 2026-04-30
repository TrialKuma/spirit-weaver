function weightedRandom(items) {
    const totalWeight = (items || []).reduce(function (sum, item) {
        return sum + (Number(item.weight) || 1);
    }, 0);

    let threshold = Math.random() * totalWeight;

    for (let index = 0; index < items.length; index += 1) {
        threshold -= Number(items[index].weight) || 1;
        if (threshold <= 0) {
            return items[index];
        }
    }

    return items[0] || null;
}

class Enemy extends Character {
    constructor(data) {
        const config = data || {};
        super({
            name: config.name,
            hp: config.hp,
            maxHp: config.maxHp,
            baseAtk: config.baseAtk,
            def: config.def,
            speed: config.speed,
            classId: config.id || "enemy",
            portrait: config.portrait
        });

        this.subtitle = config.subtitle || "敌人";
        this.actionInterval = Number(config.actionInterval) || 6;
        this.actionTimer = this.actionInterval;
        this.enemySkills = Array.isArray(config.skills) ? config.skills : [];
        this.spriteFrames = Array.isArray(config.spriteFrames) ? config.spriteFrames : [];
        this.spriteFrameIndex = 0;
        this.spriteFrameTimer = 0;
        this.state = "idle";
        this.currentAction = null;
        this.telegraphTimer = null;
    }

    update(dt) {
        super.update(dt);
        this.updateSprite(dt);

        if (this.hp <= 0) {
            return;
        }

        if (this.state === "idle") {
            this.actionTimer -= dt;
            if (this.actionTimer <= 0) {
                this.selectAndTelegraph();
            }
            return;
        }

        if (this.state === "telegraphing" && this.telegraphTimer) {
            this.telegraphTimer.update(dt);
            if (this.telegraphTimer.finished) {
                this.executeAction();
            }
        }
    }

    updateSprite(dt) {
        if (this.spriteFrames.length < 2) {
            return;
        }

        this.spriteFrameTimer += dt;
        const cadence = this.state === "telegraphing" ? 0.08 : 0.14;

        if (this.spriteFrameTimer >= cadence) {
            this.spriteFrameTimer = 0;
            this.spriteFrameIndex = (this.spriteFrameIndex + 1) % this.spriteFrames.length;
            this.portrait = this.spriteFrames[this.spriteFrameIndex];
        }
    }

    selectAndTelegraph() {
        this.currentAction = weightedRandom(this.enemySkills);
        if (!this.currentAction) {
            this.actionTimer = this.actionInterval;
            return;
        }

        this.state = "telegraphing";
        this.telegraphTimer = new Timer(this.currentAction.telegraphTime || 0);

        GameEvents.emit("enemyTelegraph", {
            enemy: this,
            action: this.currentAction
        });
    }

    executeAction() {
        const action = this.currentAction;
        if (!action) {
            this.resetTurn();
            return;
        }

        if (action.type === "buff" && action.effect) {
            this.addBuff({
                id: "enemy_" + action.id + "_buff",
                name: action.name,
                type: "buff",
                stat: action.effect.stat,
                value: action.effect.value,
                duration: action.effect.duration
            });

            GameEvents.emit("enemyBuff", {
                enemy: this,
                action: action
            });
        }

        GameEvents.emit("enemyExecute", {
            enemy: this,
            action: action
        });

        GameEvents.emit("enemyTelegraphEnd", {
            enemy: this,
            action: action
        });

        this.resetTurn();
    }

    resetTurn() {
        this.state = "idle";
        this.currentAction = null;
        this.telegraphTimer = null;
        this.actionTimer = this.actionInterval;
    }

    getTelegraphProgress() {
        return this.telegraphTimer ? this.telegraphTimer.progress : 0;
    }

    getTelegraphRemaining() {
        return this.telegraphTimer ? this.telegraphTimer.remaining : 0;
    }
}
