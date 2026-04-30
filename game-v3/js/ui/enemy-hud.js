const EnemyHUD = {
    enemy: null,
    root: null,
    text: null,
    fill: null,
    initialized: false,

    init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        this.root = document.getElementById("enemy-telegraph");
        this.text = document.getElementById("enemy-telegraph-text");
        this.fill = document.getElementById("enemy-telegraph-fill");
    },

    bindBattle(enemy) {
        this.enemy = enemy;
        this.hide();
    },

    update() {
        if (!this.enemy || !this.root || !this.text || !this.fill) {
            return;
        }

        if (this.enemy.state !== "telegraphing" || !this.enemy.currentAction || !this.enemy.telegraphTimer) {
            this.hide();
            return;
        }

        const action = this.enemy.currentAction;
        this.root.classList.remove("hidden", "safe", "danger");
        if (action.type === "buff") {
            this.root.classList.add("safe");
        } else if ((action.damage && action.damage.multiplier >= 3) || action.id === "heavy_slam") {
            this.root.classList.add("danger");
        }

        this.text.textContent = action.callout + "  " + this.enemy.getTelegraphRemaining().toFixed(1) + "s";
        this.fill.style.width = this.enemy.getTelegraphProgress() * 100 + "%";
    },

    hide() {
        if (!this.root || !this.fill || !this.text) {
            return;
        }

        this.root.classList.add("hidden");
        this.fill.style.width = "0%";
        this.text.textContent = "";
    }
};
