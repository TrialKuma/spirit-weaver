function calculateDamageInfo(attacker, skillOrAction, target) {
    const source = skillOrAction || {};
    const atk = attacker && typeof attacker.getBuffedAtk === "function"
        ? attacker.getBuffedAtk()
        : Number(attacker && attacker.baseAtk) || 0;
    const multiplier = source.baseMultiplier || (source.damage && source.damage.multiplier) || 1.0;
    const critChance = typeof source.critChance === "number"
        ? source.critChance
        : (typeof attacker.critChance === "number" ? attacker.critChance : 0.1);
    const critMultiplier = typeof source.critMultiplier === "number"
        ? source.critMultiplier
        : (typeof attacker.critMultiplier === "number" ? attacker.critMultiplier : 1.5);
    const hasInjury = Boolean(target && typeof target.hasBuff === "function" && target.hasBuff("internal_injury"));
    const injuryMultiplier = hasInjury ? 1.3 : 1;
    const didCrit = Math.random() < critChance;

    let raw = atk * multiplier * injuryMultiplier;
    if (didCrit) {
        raw *= critMultiplier;
    }

    const bonusDef = target && typeof target.getBuffModifier === "function"
        ? target.getBuffModifier("def")
        : 0;
    const defense = (Number(target && target.def) || 0) + bonusDef;
    let finalAmount = Math.max(1, raw - defense);

    let guardReduction = 0;
    if (target && typeof target.isGuarding === "function" && target.isGuarding()) {
        guardReduction = typeof target.getGuardReduction === "function"
            ? target.getGuardReduction()
            : 0.5;
        finalAmount *= (1 - guardReduction);
    }

    return {
        amount: Math.max(1, Math.floor(finalAmount)),
        raw: raw,
        defense: defense,
        multiplier: multiplier,
        didCrit: didCrit,
        critMultiplier: didCrit ? critMultiplier : 1,
        guardReduction: guardReduction,
        injuryMultiplier: injuryMultiplier
    };
}

function calculateDamage(attacker, skillOrAction, target) {
    return calculateDamageInfo(attacker, skillOrAction, target).amount;
}
