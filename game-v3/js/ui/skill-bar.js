const SkillBar = {
    container: null,
    player: null,
    enemy: null,
    initialized: false,

    init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        this.container = document.getElementById("skill-bar");
        this.bindInput();
    },

    bindBattle(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        this.render();
    },

    bindInput() {
        document.addEventListener("keydown", function (event) {
            if (event.repeat) {
                return;
            }

            if (!BattleManager || BattleManager.state !== "fighting") {
                return;
            }

            const key = event.key;
            if (!/^[1-4]$/.test(key)) {
                return;
            }

            SkillBar.activateSkill(Number(key) - 1);
        });
    },

    activateSkill(index) {
        if (!this.player || !this.enemy || BattleManager.state !== "fighting") {
            return;
        }

        const used = SkillSystem.tryUseSkill(index, this.player, this.enemy);
        if (!used) {
            return;
        }

        this.update();
    },

    render() {
        if (!this.container || !this.player) {
            return;
        }

        this.container.innerHTML = "";

        this.player.skills.forEach(function (skill, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "skill-button";
            button.dataset.skillIndex = String(index);

            const progress = document.createElement("div");
            progress.className = "skill-progress";
            progress.innerHTML = '<div class="skill-progress-fill"></div>';

            const hotkey = document.createElement("span");
            hotkey.className = "skill-hotkey";
            hotkey.textContent = String(index + 1);

            const body = document.createElement("div");
            body.className = "skill-body";

            const meta = document.createElement("div");
            meta.className = "skill-meta";

            const icon = document.createElement("span");
            icon.className = "skill-type-icon";
            icon.textContent = skill.icon || "技";

            const name = document.createElement("span");
            name.className = "skill-name";
            name.textContent = skill.name;

            meta.appendChild(icon);
            meta.appendChild(name);

            const desc = document.createElement("div");
            desc.className = "skill-desc";
            desc.textContent = skill.desc;

            body.appendChild(meta);
            body.appendChild(desc);

            const side = document.createElement("div");
            side.className = "skill-side";

            const cost = document.createElement("div");
            cost.className = "skill-cost";
            cost.textContent = SkillBar.formatCost(skill.cost);

            const timing = document.createElement("div");
            timing.className = "skill-timing";
            timing.textContent = skill.castTime.toFixed(2) + "s / " + skill.recoveryTime.toFixed(2) + "s";

            side.appendChild(cost);
            side.appendChild(timing);

            button.appendChild(hotkey);
            button.appendChild(body);
            button.appendChild(side);
            button.appendChild(progress);

            button.addEventListener("click", function () {
                SkillBar.activateSkill(index);
            });

            SkillBar.container.appendChild(button);
        });

        this.update();
    },

    update() {
        if (!this.container || !this.player) {
            return;
        }

        const state = SkillSystem.getState();
        const buttons = this.container.querySelectorAll(".skill-button");

        buttons.forEach(function (button) {
            const index = Number(button.dataset.skillIndex);
            const skill = SkillBar.player.skills[index];
            const progressFill = button.querySelector(".skill-progress-fill");
            button.classList.remove("available", "casting", "recovering", "insufficient", "locked");

            let progress = 0;
            let status = "available";

            if (BattleManager.state !== "fighting") {
                status = "locked";
            } else if (state.state !== "idle") {
                if (state.skillIndex === index) {
                    status = state.state;
                    progress = state.state === "recovering" ? 1 - state.progress : state.progress;
                } else {
                    status = "locked";
                }
            } else if (!SkillBar.player.canAfford(skill.cost)) {
                status = "insufficient";
            }

            button.classList.add(status === "idle" ? "available" : status);
            if (status === "available") {
                button.classList.add("available");
            }

            if (progressFill) {
                progressFill.style.width = Math.max(0, Math.min(progress, 1)) * 100 + "%";
            }

            button.disabled = status === "locked";
        });
    },

    formatCost(cost) {
        const price = cost || {};
        const keys = Object.keys(price);
        if (keys.length === 0) {
            return "免费";
        }
        return keys.map(function (resourceKey) {
            return price[resourceKey] + " " + resourceKey;
        }).join(" / ");
    }
};
