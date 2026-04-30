const QI_SKILLS = [
    {
        id: "light_strike",
        name: "轻击",
        type: "attack",
        castTime: 0.4,
        recoveryTime: 0.4,
        cost: { qi: 0 },
        baseMultiplier: 1.0,
        hits: 1,
        tags: ["Light", "Attack", "Melee"],
        desc: "快速出拳，无消耗。",
        icon: "拳",
        color: "#7fe9ff"
    },
    {
        id: "rapid_strike",
        name: "迅击",
        type: "special",
        castTime: 0.7,
        recoveryTime: 0.5,
        cost: { qi: 2 },
        baseMultiplier: 2.0,
        hits: 1,
        tags: ["Special", "Melee"],
        desc: "消耗 2 气，造成 200% 伤害。内伤目标返还 2 气。",
        onHit: "refundQiOnInjury",
        icon: "迅",
        color: "#ffd166"
    },
    {
        id: "devastate",
        name: "崩山",
        type: "ultimate",
        castTime: 1.5,
        recoveryTime: 1.0,
        cost: { qi: 8 },
        baseMultiplier: 5.0,
        hits: 1,
        tags: ["Heavy", "Ultimate", "Melee"],
        desc: "消耗 8 气，造成 500% 伤害并施加内伤。",
        icon: "崩",
        color: "#ff8f5a"
    },
    {
        id: "stance",
        name: "架势",
        type: "defense",
        castTime: 0.15,
        recoveryTime: 0.25,
        cost: { qi: 0 },
        baseMultiplier: 0,
        hits: 0,
        tags: ["Defense"],
        desc: "格挡 0.8 秒，减伤 50%。",
        effect: {
            type: "guard",
            duration: 0.8,
            damageReduction: 0.5
        },
        icon: "守",
        color: "#85ffd1"
    }
];
