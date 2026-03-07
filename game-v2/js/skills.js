// ==================== 技能与强化基础模块 ====================

class SkillModifier {
    constructor({ type, value, source = null, tags = null, skillId = null } = {}) {
        this.type = type; // 'mult' | 'add'
        this.value = value;
        this.source = source;
        this.tags = tags;
        this.skillId = skillId;
    }

    appliesTo(skill) {
        if (this.skillId && this.skillId !== skill.id) return false;
        if (this.tags && skill.tags) {
            return this.tags.some(tag => skill.tags.includes(tag));
        }
        return true;
    }
}

function applyDamageModifiers(baseDamage, modifiers = []) {
    let damage = baseDamage;
    modifiers.forEach(mod => {
        if (mod.type === 'mult') {
            damage *= mod.value;
        } else if (mod.type === 'add') {
            damage += mod.value;
        }
    });
    return damage;
}

function createSkill(config = {}) {
    const skill = {
        modifiers: [],
        calculatedDamage: undefined,
        ...config
    };

    if (!Array.isArray(skill.tags)) {
        skill.tags = [];
    }
    const typeTagMap = {
        attack: 'Attack',
        special: 'Special',
        Ultimate: 'Ultimate'
    };
    if (skill.type && typeTagMap[skill.type] && !skill.tags.includes(typeTagMap[skill.type])) {
        skill.tags.push(typeTagMap[skill.type]);
    }

    skill.addModifier = (modifier) => {
        if (modifier) skill.modifiers.push(modifier);
    };

    skill.clearCalculatedDamage = () => {
        skill.calculatedDamage = undefined;
    };

    skill.getBaseDamage = (owner) => {
        if (skill.calculatedDamage !== undefined) return skill.calculatedDamage;
        if (skill.useRawDamage || skill.baseMultiplier === undefined) {
            return skill.damage || 0;
        }
        if (owner && skill.baseMultiplier !== undefined) {
            const atk = owner.getBuffedAtk ? owner.getBuffedAtk() : owner.baseAtk;
            return atk * skill.baseMultiplier;
        }
        return skill.damage || 0;
    };

    skill.getDamage = (owner, context = {}) => {
        const baseDamage = skill.getBaseDamage(owner);
        const ownerMods = owner && owner.getDamageModifiers ? owner.getDamageModifiers(skill, context) : [];
        const skillMods = skill.modifiers.filter(mod => mod.appliesTo(skill));
        return applyDamageModifiers(baseDamage, [...ownerMods, ...skillMods]);
    };

    return skill;
}
