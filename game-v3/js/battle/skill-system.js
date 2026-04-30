const SkillSystem = {
    state: "idle",
    currentSkill: null,
    currentSkillIndex: -1,
    owner: null,
    target: null,
    timer: null,
    phaseDuration: 0,

    tryUseSkill(skillIndex, owner, target) {
        if (this.state !== "idle" || !owner || !target || !Array.isArray(owner.skills)) {
            return false;
        }

        const skill = owner.skills[skillIndex];
        if (!skill || !owner.canAfford(skill.cost)) {
            return false;
        }

        owner.spendResource(skill.cost);
        this.state = "casting";
        this.currentSkill = skill;
        this.currentSkillIndex = skillIndex;
        this.owner = owner;
        this.target = target;
        this.phaseDuration = this.getScaledDuration(skill.castTime || 0, owner);
        this.timer = new Timer(this.phaseDuration);

        if (skill.effect && skill.effect.type === "guard") {
            owner.addBuff({
                id: "guard_stance",
                name: "架势",
                type: "buff",
                stat: "guard",
                value: skill.effect.damageReduction,
                duration: skill.effect.duration
            });
        }

        GameEvents.emit("skillCastStart", {
            owner: owner,
            target: target,
            skill: skill,
            skillIndex: skillIndex
        });

        return true;
    },

    update(dt) {
        if (this.state === "idle" || !this.timer) {
            return;
        }

        this.timer.update(dt);

        if (!this.timer.finished) {
            return;
        }

        if (this.state === "casting") {
            this.resolveCurrentSkill();
            this.state = "recovering";
            this.phaseDuration = this.currentSkill ? this.getScaledDuration(this.currentSkill.recoveryTime || 0, this.owner) : 0;
            this.timer = new Timer(this.phaseDuration);
            GameEvents.emit("skillRecoveryStart", {
                owner: this.owner,
                target: this.target,
                skill: this.currentSkill,
                skillIndex: this.currentSkillIndex
            });
            return;
        }

        this.finishCycle();
    },

    resolveCurrentSkill() {
        if (!this.currentSkill || !this.owner || !this.target) {
            return;
        }

        if (this.currentSkill.baseMultiplier > 0) {
            const damageInfo = calculateDamageInfo(this.owner, this.currentSkill, this.target);
            const actualDamage = this.target.takeDamage(damageInfo.amount);
            damageInfo.amount = actualDamage;

            GameEvents.emit("skillHit", {
                attacker: this.owner,
                target: this.target,
                skill: this.currentSkill,
                skillIndex: this.currentSkillIndex,
                damageInfo: damageInfo
            });

            if (typeof this.owner.onSkillHit === "function") {
                this.owner.onSkillHit(this.currentSkill, this.target, damageInfo);
            }
        } else {
            GameEvents.emit("skillResolved", {
                attacker: this.owner,
                target: this.target,
                skill: this.currentSkill,
                skillIndex: this.currentSkillIndex
            });
        }
    },

    finishCycle() {
        const payload = {
            owner: this.owner,
            target: this.target,
            skill: this.currentSkill,
            skillIndex: this.currentSkillIndex
        };

        this.state = "idle";
        this.currentSkill = null;
        this.currentSkillIndex = -1;
        this.owner = null;
        this.target = null;
        this.timer = null;
        this.phaseDuration = 0;

        GameEvents.emit("skillCycleComplete", payload);
    },

    reset() {
        this.state = "idle";
        this.currentSkill = null;
        this.currentSkillIndex = -1;
        this.owner = null;
        this.target = null;
        this.timer = null;
        this.phaseDuration = 0;
    },

    getState() {
        return {
            state: this.state,
            skill: this.currentSkill,
            skillIndex: this.currentSkillIndex,
            progress: this.timer ? this.timer.progress : 0,
            remaining: this.timer ? this.timer.remaining : 0,
            phaseDuration: this.phaseDuration
        };
    },

    getScaledDuration(duration, owner) {
        const animScale = owner && typeof owner.getAnimScale === "function"
            ? owner.getAnimScale()
            : 1;
        return Math.max(0, duration * animScale);
    }
};
