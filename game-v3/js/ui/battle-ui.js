const BattleUI = {
    player: null,
    enemy: null,
    initialized: false,
    resourceCells: [],
    elements: {},

    init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        this.cacheElements();
        SkillBar.init();
        EnemyHUD.init();
        this.bindStaticEvents();
        this.showStartOverlay();
    },

    cacheElements() {
        this.elements = {
            battleStatus: document.getElementById("battle-status-text"),
            skillBandStatus: document.getElementById("skill-band-status"),
            playerClassLabel: document.getElementById("player-class-label"),
            playerHpBar: document.getElementById("player-hp-bar"),
            playerHpText: document.getElementById("player-hp-text"),
            playerResourceText: document.getElementById("player-resource-text"),
            playerResource: document.getElementById("player-resource"),
            playerPortrait: document.getElementById("player-portrait"),
            playerBuffs: document.getElementById("player-buffs"),
            playerStateBadge: document.getElementById("player-state-badge"),
            enemyHpBar: document.getElementById("enemy-hp-bar"),
            enemyHpText: document.getElementById("enemy-hp-text"),
            enemyPortrait: document.getElementById("enemy-portrait"),
            enemyBuffs: document.getElementById("enemy-buffs"),
            enemyStateBadge: document.getElementById("enemy-state-badge"),
            enemyName: document.getElementById("enemy-name-text"),
            enemySubtitle: document.getElementById("enemy-subtitle-text"),
            logPanel: document.getElementById("log-panel"),
            logToggle: document.getElementById("log-toggle"),
            logToggleIcon: document.getElementById("log-toggle-icon"),
            startOverlay: document.getElementById("start-overlay"),
            resultOverlay: document.getElementById("result-overlay"),
            resultKicker: document.getElementById("result-kicker"),
            resultTitle: document.getElementById("result-title"),
            resultSummary: document.getElementById("result-summary")
        };
    },

    bindStaticEvents() {
        const self = this;

        if (this.elements.logToggle) {
            this.elements.logToggle.addEventListener("click", function () {
                self.elements.logPanel.classList.toggle("collapsed");
                self.elements.logToggleIcon.textContent = self.elements.logPanel.classList.contains("collapsed") ? "▸" : "▾";
            });
        }

        GameEvents.on("battleStart", function (payload) {
            self.clearLog();
            self.addLog(payload.player.name + " 已踏入战场。", "player");
            self.addLog(payload.enemy.name + " 现身，战斗开始。", "enemy");
        });

        GameEvents.on("battleEnd", function (payload) {
            const won = payload.result === "win";
            self.showResultOverlay(
                won ? "胜利" : "败北",
                won ? "恶鬼倒下了。这个循环已经跑顺。": "节奏断了。再来一轮，把防御和爆发窗口对齐。"
            );
            self.addLog(won ? "战斗胜利。" : "战斗失败。", won ? "buff" : "warning");
        });

        GameEvents.on("battleLog", function (payload) {
            self.addLog(payload.message, payload.tone);
        });

        GameEvents.on("skillCastStart", function (payload) {
            self.setSkillStatus(payload.skill.name + " 施法中");
            self.elements.playerPortrait.classList.add("casting");
            self.elements.playerStateBadge.textContent = "施法 · " + payload.skill.name;
            self.addLog(payload.owner.name + " 施放 " + payload.skill.name + "。", "player");

            if (payload.skill.type === "ultimate") {
                ParticleSystem.showSkillCutIn({
                    side: "left",
                    icon: payload.skill.icon,
                    skillName: payload.skill.name,
                    color: payload.skill.color,
                    subtitle: "高耗爆发窗口"
                });
            }
        });

        GameEvents.on("skillRecoveryStart", function (payload) {
            self.setSkillStatus(payload.skill.name + " 恢复中");
            self.elements.playerStateBadge.textContent = "恢复 · " + payload.skill.name;
        });

        GameEvents.on("skillCycleComplete", function () {
            self.setSkillStatus("不在施法中时可立即出招");
            self.elements.playerPortrait.classList.remove("casting");
            self.elements.playerStateBadge.textContent = "待命";
        });

        GameEvents.on("skillHit", function (payload) {
            const center = self.getElementCenter(self.elements.enemyPortrait);
            const skillTypeMap = {
                attack: "light",
                special: "special",
                ultimate: "heavy"
            };
            const slashType = skillTypeMap[payload.skill.type] || "light";
            ParticleSystem.createSlash(center.x, center.y, slashType, payload.skill.color);
            ParticleSystem.createImpact(center.x, center.y, payload.skill.type === "ultimate" ? "ultimate" : "light", payload.skill.color);
            ParticleSystem.showDamageNumber(
                center.x,
                center.y - 10,
                payload.damageInfo.amount,
                payload.damageInfo.didCrit ? "#ffd166" : "#ff8f5a",
                payload.damageInfo.didCrit ? "暴击" : null,
                { fontSize: payload.damageInfo.didCrit ? 34 : 28 }
            );
            if (payload.damageInfo.didCrit) {
                ParticleSystem.flashScreen("rgba(255, 209, 102, 0.18)", 180);
            }
            if (payload.skill.type === "ultimate") {
                ParticleSystem.shakeScreen(10, 320);
            }
            self.triggerHitFlash(self.elements.enemyPortrait, "enemy-telegraphing");
            self.addLog(payload.skill.name + " 命中，造成 " + payload.damageInfo.amount + " 点伤害。", "player");
        });

        GameEvents.on("playerHit", function (payload) {
            const center = self.getElementCenter(self.elements.playerPortrait);
            ParticleSystem.createSlash(center.x, center.y, "enemy");
            ParticleSystem.createImpact(center.x, center.y, payload.action.id === "heavy_slam" ? "heavy" : "enemy");
            ParticleSystem.showDamageNumber(center.x, center.y - 10, payload.damageInfo.amount, "#ff6b9d");
            ParticleSystem.shakeScreen(payload.action.id === "heavy_slam" ? 14 : 8, payload.action.id === "heavy_slam" ? 360 : 240);
            ParticleSystem.flashScreen("rgba(255, 91, 91, 0.12)", 140);
            self.triggerHitFlash(self.elements.playerPortrait, "casting");
            self.addLog(payload.attacker.name + " 的 " + payload.action.name + " 命中你，造成 " + payload.damageInfo.amount + " 点伤害。", "enemy");
        });

        GameEvents.on("enemyTelegraph", function (payload) {
            self.elements.enemyStateBadge.textContent = "喊招 · " + payload.action.name;
            self.elements.enemyPortrait.classList.add("enemy-telegraphing");
            self.addLog(payload.enemy.name + "：" + payload.action.callout, payload.action.type === "buff" ? "buff" : "warning");
        });

        GameEvents.on("enemyTelegraphEnd", function () {
            self.elements.enemyStateBadge.textContent = "待机";
            self.elements.enemyPortrait.classList.remove("enemy-telegraphing");
        });

        GameEvents.on("enemyBuff", function (payload) {
            const center = self.getElementCenter(self.elements.enemyPortrait);
            ParticleSystem.createImpact(center.x, center.y, "buff");
            self.addLog(payload.enemy.name + " 获得 " + payload.action.name + "。", "buff");
        });

        GameEvents.on("buffAdded", function (payload) {
            if (payload.buff.id === "internal_injury") {
                self.addLog(payload.target.name + " 陷入内伤，受到伤害提高。", "warning");
                const center = self.getElementCenter(payload.target === self.enemy ? self.elements.enemyPortrait : self.elements.playerPortrait);
                ParticleSystem.createParticles(center.x, center.y, 12, "#c084fc");
            }

            if (payload.buff.id === "guard_stance") {
                self.addLog("架势展开，下一击将被格挡。", "buff");
                const center = self.getElementCenter(self.elements.playerPortrait);
                ParticleSystem.createParticles(center.x, center.y, 10, "#85ffd1");
            }
        });
    },

    bindBattle(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        SkillBar.bindBattle(player, enemy);
        EnemyHUD.bindBattle(enemy);

        if (this.elements.playerPortrait) {
            this.elements.playerPortrait.src = player.portrait;
            this.elements.playerPortrait.classList.remove("casting", "enemy-telegraphing", "hit");
        }

        if (this.elements.enemyPortrait) {
            this.elements.enemyPortrait.src = enemy.portrait;
            this.elements.enemyPortrait.classList.remove("casting", "enemy-telegraphing", "hit");
        }

        this.elements.enemyName.textContent = enemy.name;
        this.elements.enemySubtitle.textContent = enemy.subtitle || "敌人";
        if (this.elements.playerClassLabel) {
            this.elements.playerClassLabel.textContent = player.name;
        }
        this.elements.playerStateBadge.textContent = "待命";
        this.elements.enemyStateBadge.textContent = "待机";
        this.renderResourceCells();
        this.update(0);
    },

    renderResourceCells() {
        if (!this.elements.playerResource || !this.player) {
            return;
        }

        this.elements.playerResource.innerHTML = "";
        this.resourceCells = [];

        const qi = this.player.resources.qi;
        for (let index = 0; index < qi.max; index += 1) {
            const cell = document.createElement("div");
            cell.className = "resource-cell";

            const fill = document.createElement("div");
            fill.className = "resource-cell-fill";
            cell.appendChild(fill);

            this.elements.playerResource.appendChild(cell);
            this.resourceCells.push(fill);
        }
    },

    update() {
        if (!this.player || !this.enemy) {
            return;
        }

        this.updateBars();
        this.updateResources();
        this.updateBuffs();
        this.updatePortraits();
        SkillBar.update();
        EnemyHUD.update();
    },

    updateBars() {
        const playerHpRatio = this.player.hp / this.player.maxHp;
        const enemyHpRatio = this.enemy.hp / this.enemy.maxHp;

        this.elements.playerHpBar.style.width = playerHpRatio * 100 + "%";
        this.elements.playerHpText.textContent = Math.ceil(this.player.hp) + " / " + this.player.maxHp;

        this.elements.enemyHpBar.style.width = enemyHpRatio * 100 + "%";
        this.elements.enemyHpText.textContent = Math.ceil(this.enemy.hp) + " / " + this.enemy.maxHp;
    },

    updateResources() {
        const qi = this.player.resources.qi;
        this.elements.playerResourceText.textContent = qi.val.toFixed(1) + " / " + qi.max;

        this.resourceCells.forEach(function (fill, index) {
            const value = Math.max(0, Math.min(1, qi.val - index));
            fill.style.transform = "scaleX(" + value + ")";
        });
    },

    updateBuffs() {
        this.renderBuffRow(this.elements.playerBuffs, this.player.buffManager.buffs);
        this.renderBuffRow(this.elements.enemyBuffs, this.enemy.buffManager.buffs);
    },

    renderBuffRow(container, buffs) {
        if (!container) {
            return;
        }

        container.innerHTML = "";
        buffs.forEach(function (buff) {
            const chip = document.createElement("div");
            chip.className = "buff-chip " + buff.type;
            const remaining = Number.isFinite(buff.remaining) ? buff.remaining.toFixed(1) + "s" : "";
            chip.textContent = buff.name + (remaining ? " " + remaining : "");
            container.appendChild(chip);
        });
    },

    updatePortraits() {
        if (this.elements.enemyPortrait && this.elements.enemyPortrait.getAttribute("src") !== this.enemy.portrait) {
            this.elements.enemyPortrait.src = this.enemy.portrait;
        }
    },

    addLog(message, tone) {
        if (!this.elements.logPanel || !message) {
            return;
        }

        const entry = document.createElement("div");
        entry.className = "log-entry" + (tone ? " " + tone : "");
        entry.textContent = message;
        this.elements.logPanel.prepend(entry);

        while (this.elements.logPanel.children.length > 18) {
            this.elements.logPanel.removeChild(this.elements.logPanel.lastChild);
        }
    },

    clearLog() {
        if (this.elements.logPanel) {
            this.elements.logPanel.innerHTML = "";
        }
    },

    setStatusText(text) {
        if (this.elements.battleStatus) {
            this.elements.battleStatus.textContent = text;
        }
    },

    setSkillStatus(text) {
        if (this.elements.skillBandStatus) {
            this.elements.skillBandStatus.textContent = text;
        }
    },

    showStartOverlay() {
        this.elements.startOverlay.classList.add("visible");
        this.elements.startOverlay.classList.remove("hidden");
    },

    hideStartOverlay() {
        this.elements.startOverlay.classList.remove("visible");
        this.elements.startOverlay.classList.add("hidden");
    },

    showResultOverlay(title, summary) {
        this.elements.resultTitle.textContent = title;
        this.elements.resultSummary.textContent = summary;
        this.elements.resultKicker.textContent = "战斗结束";
        this.elements.resultOverlay.classList.add("visible");
        this.elements.resultOverlay.classList.remove("hidden");
    },

    hideResultOverlay() {
        this.elements.resultOverlay.classList.remove("visible");
        this.elements.resultOverlay.classList.add("hidden");
    },

    triggerHitFlash(element, preservedClass) {
        if (!element) {
            return;
        }

        const keepClass = preservedClass || "";
        const hadPreservedClass = keepClass ? element.classList.contains(keepClass) : false;
        element.classList.remove("hit");
        void element.offsetWidth;
        element.classList.add("hit");
        setTimeout(function () {
            element.classList.remove("hit");
            if (keepClass && hadPreservedClass && !element.classList.contains(keepClass)) {
                element.classList.add(keepClass);
            }
        }, 280);
    },

    getElementCenter(element) {
        const stage = document.getElementById("battle-stage");
        const stageRect = stage
            ? stage.getBoundingClientRect()
            : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

        if (!element) {
            return {
                x: stageRect.width / 2,
                y: stageRect.height / 2
            };
        }

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - stageRect.left,
            y: rect.top + rect.height / 2 - stageRect.top
        };
    }
};
