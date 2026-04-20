"""
重伤+回流 详细计算过程
"""
ATK_BASE = 10
ENEMY_DEF = 4
PLAYER_SPEED = 300
ENEMY_SPEED = 100
ENEMY_TURNS = 15

def calc_dmg(atk, mult):
    return max(1, atk * mult - ENEMY_DEF)

class CTB:
    def __init__(self, units):
        self.units = [{'name': u['name'], 'speed': u['speed'], 'av': 10000/u['speed']} for u in units]
    def next(self):
        m = min(u['av'] for u in self.units)
        for u in self.units:
            u['av'] -= m
        a = sorted([u for u in self.units if u['av'] <= 0], key=lambda u: -u['speed'])[0]
        return a
    def reset(self, u):
        u['av'] = 10000 / u['speed']

ctb = CTB([
    {'name': 'player', 'speed': PLAYER_SPEED},
    {'name': 'enemy', 'speed': ENEMY_SPEED},
])

qi = 10
atk_bonus = 0
passive_ctr = 0
storm_ctr = 0
injury = False
sequel_streak = 0
p_act = 0
e_act = 0
total_p = 0
total_s = 0
reflux_triggers = 0

print(f"气息魂·重伤+回流 详细过程 (敌{ENEMY_TURNS}回合)")
print(f"ATK={ATK_BASE}, DEF={ENEMY_DEF}, 速度比={PLAYER_SPEED}:{ENEMY_SPEED}")
print(f"被动: 累计消耗≥6→魂灵攻击100%+挂内伤(重伤60%)")
print(f"回流: 魂灵攻击命中已有内伤的目标→玩家ATK+1")
print("-" * 80)

while e_act < ENEMY_TURNS:
    actor = ctb.next()

    if actor['name'] == 'enemy':
        e_act += 1
        ctb.reset(actor)
        print(f"  --- 敌人回合 {e_act} ---")
        continue

    p_act += 1
    cur_atk = ATK_BASE + atk_bonus

    # 选技能
    if qi >= 6:
        skill, cost, mult, stype = '崩山', 6, 3.5, 'ultimate'
    elif qi >= 2:
        skill, cost, mult, stype = '迅击', 2, 2.0, 'special'
    else:
        skill, cost, mult, stype = '轻拳', 0, 1.0, 'attack'

    qi -= cost
    d = calc_dmg(cur_atk, mult)

    # 玩家攻击消耗内伤
    inj_note = ""
    if injury and d > 0:
        bonus = int(d * 0.6)  # 重伤60%
        d += bonus
        injury = False
        inj_note = f" (重伤+{bonus}, 内伤消耗)"

    total_p += d

    spirit_notes = []

    # 续剑（魂灵攻击）
    if stype == 'special':
        sequel_streak += 1
        if sequel_streak >= 3:
            sd = calc_dmg(cur_atk, 1.6)
            sequel_streak = 0
            sname = "续剑·终"
        else:
            sd = calc_dmg(cur_atk, 0.8)
            sname = "续剑"
        total_s += sd

        # 续剑是魂灵攻击，检查回流
        if injury:
            atk_bonus += 1
            reflux_triggers += 1
            spirit_notes.append(f"{sname}({sd:.0f}) + 回流触发(ATK→{ATK_BASE+atk_bonus})")
        else:
            spirit_notes.append(f"{sname}({sd:.0f})")
    else:
        sequel_streak = 0

    # 累计消耗
    if cost > 0:
        passive_ctr += cost
        storm_ctr += cost

        # 被动触发
        if passive_ctr >= 6:
            # 先检查回流（目标是否已有内伤）
            if injury:
                atk_bonus += 1
                reflux_triggers += 1
                spirit_notes.append(f"回流触发(目标有内伤, ATK→{ATK_BASE+atk_bonus})")

            pd = calc_dmg(cur_atk, 1.0)
            total_s += pd
            passive_ctr = 0
            injury = True  # 挂新内伤
            spirit_notes.append(f"被动攻击({pd:.0f}) + 挂内伤")

        # 旋风斩
        if storm_ctr >= 12:
            # 旋风斩也是魂灵攻击，检查回流
            if injury:
                atk_bonus += 1
                reflux_triggers += 1
                spirit_notes.append(f"回流触发(旋风斩命中内伤, ATK→{ATK_BASE+atk_bonus})")

            sd = sum(calc_dmg(cur_atk, 1.0) for _ in range(3))
            total_s += sd
            storm_ctr = 0
            spirit_notes.append(f"旋风斩({sd:.0f})")

    qi_after = min(10, qi + 2)
    spirit_str = " | " + ", ".join(spirit_notes) if spirit_notes else ""
    print(f"  P#{p_act:2d} ATK={cur_atk:2d}: {skill}({cost}气) →{d:.0f}{inj_note} | 气{qi}→{qi_after} | 被动计{passive_ctr} 旋风计{storm_ctr}{spirit_str}")
    qi = qi_after

    ctb.reset(actor)

total = total_p + total_s
print(f"\n{'='*80}")
print(f"总结: {p_act}次玩家行动, {e_act}次敌人行动")
print(f"角色伤害: {total_p:.0f}  魂灵伤害: {total_s:.0f}  总: {total:.0f}")
print(f"每敌回合: {total/e_act:.1f}")
print(f"回流触发次数: {reflux_triggers}  最终ATK加成: +{atk_bonus}")
