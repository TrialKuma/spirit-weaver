const DEMON_FRAME_ROOT = "../game-v2/assets/art/enemies/demon_frames";
const DEMON_FRAMES = Array.from({ length: 12 }, function (_, index) {
    const frameNumber = String(index).padStart(2, "0");
    return DEMON_FRAME_ROOT + "/frame_" + frameNumber + ".png";
});

const TEST_ENEMY = {
    id: "demon",
    name: "恶鬼",
    hp: 200,
    maxHp: 200,
    baseAtk: 12,
    def: 3,
    speed: 80,
    actionInterval: 6.0,
    portrait: DEMON_FRAMES[0],
    spriteFrames: DEMON_FRAMES,
    subtitle: "重型近战 / 喊招压迫",
    skills: [
        {
            id: "slash",
            name: "斩击",
            telegraphTime: 1.2,
            damage: { multiplier: 1.5 },
            type: "melee",
            callout: "斩击！",
            weight: 3
        },
        {
            id: "heavy_slam",
            name: "重砸",
            telegraphTime: 2.0,
            damage: { multiplier: 3.0 },
            type: "melee",
            callout: "重砸！！",
            weight: 1
        },
        {
            id: "guard",
            name: "防御姿态",
            telegraphTime: 0.8,
            damage: null,
            type: "buff",
            effect: { stat: "def", value: 5, duration: 4.0 },
            callout: "防御！",
            weight: 1
        }
    ]
};
