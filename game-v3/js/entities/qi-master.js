class QiMaster extends Character {
    constructor() {
        super({
            name: "气宗",
            hp: 100,
            maxHp: 100,
            baseAtk: 10,
            def: 5,
            speed: 100,
            classId: "qi",
            portrait: "../game-v2/assets/art/portraits/portrait_qi_street_v3.png"
        });

        this.resources = {
            qi: { val: 10, max: 10, regenPerSec: 1.0 }
        };
        this.skills = QI_SKILLS;
    }

    onSkillHit(skill, target) {
        const qiCost = skill && skill.cost ? Number(skill.cost.qi) || 0 : 0;

        if (qiCost >= 6 && target) {
            target.addBuff({
                id: "internal_injury",
                name: "内伤",
                type: "debuff",
                stat: "injury",
                value: 0.3,
                duration: 4.0
            });
        }

        if (skill && skill.id === "rapid_strike" && target && target.hasBuff("internal_injury")) {
            this.gainResource("qi", 2);
            GameEvents.emit("battleLog", {
                message: "迅击命中内伤目标，返还 2 气。",
                tone: "buff"
            });
        }
    }
}
