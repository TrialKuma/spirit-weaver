"""
气宗 + 气息魂/连击魂 DPT模拟 v2
- 3:1速度比（玩家300, 敌人100）
- 无AV系数（所有技能行动后AV相同）
- 用CTB tick模拟真实行动顺序
- 连击魂AI改进：先攒疾风再花
"""

ATK = 10
ENEMY_DEF = 4
PLAYER_SPEED = 300
ENEMY_SPEED = 100

def calc_dmg(multiplier, def_val=ENEMY_DEF):
    return max(1, ATK * multiplier - def_val)

def calc_dmg_hits(multiplier, hits, def_val=ENEMY_DEF):
    per_hit = max(1, ATK * multiplier - def_val)
    return per_hit * hits

# ============================================================
# CTB模拟器
# ============================================================
class CTBSim:
    def __init__(self, units):
        # units: [{'name', 'speed', 'av'}]
        self.units = []
        for u in units:
            self.units.append({
                'name': u['name'],
                'speed': u.get('speed', 100),
                'av': 10000 / u.get('speed', 100),
                'base_speed': u.get('speed', 100),
            })

    def tick_to_next(self):
        min_av = min(u['av'] for u in self.units)
        for u in self.units:
            u['av'] -= min_av
        actors = [u for u in self.units if u['av'] <= 0]
        actors.sort(key=lambda u: -u['speed'])
        return actors[0], min_av

    def reset_av(self, unit):
        unit['av'] = 10000 / unit['speed']

    def advance_av(self, unit, pct):
        unit['av'] = max(0, unit['av'] - (10000 / unit['speed']) * pct)

    def set_speed(self, name, speed):
        for u in self.units:
            if u['name'] == name:
                u['speed'] = speed

# ============================================================
# 气宗裸
# ============================================================
def sim_naked(max_ticks=50000):
    ctb = CTBSim([
        {'name': 'player', 'speed': PLAYER_SPEED},
        {'name': 'enemy', 'speed': ENEMY_SPEED},
    ])

    qi = 10
    total_dmg = 0
    player_actions = 0
    enemy_actions = 0
    log = []

    ticks_elapsed = 0
    while ticks_elapsed < max_ticks:
        actor, dt = ctb.tick_to_next()
        ticks_elapsed += dt

        if actor['name'] == 'player':
            player_actions += 1
            if qi >= 6:
                skill, cost, mult = '崩山', 6, 3.5
            elif qi >= 2:
                skill, cost, mult = '迅击', 2, 2.0
            else:
                skill, cost, mult = '轻拳', 0, 1.0

            qi -= cost
            d = calc_dmg(mult)
            total_dmg += d
            log.append(f"  [{ticks_elapsed:5.0f}] 玩家#{player_actions:2d}: {qi+cost:2.0f}气→{skill}→{qi:.0f}气 | {d:.0f}伤害")
            qi = min(10, qi + 2)
            ctb.reset_av(actor)

        elif actor['name'] == 'enemy':
            enemy_actions += 1
            ctb.reset_av(actor)

    print(f"\n{'='*70}")
    print(f"气宗（无魂灵）- 玩家{player_actions}次行动, 敌人{enemy_actions}次行动")
    print(f"{'='*70}")
    for l in log[:30]:
        print(l)
    if len(log) > 30:
        print(f"  ... 省略{len(log)-30}行 ...")
    print(f"\n  总伤害: {total_dmg:.0f}  |  玩家DPT: {total_dmg/player_actions:.1f}  |  每敌人回合伤害: {total_dmg/enemy_actions:.1f}")
    return total_dmg, player_actions, enemy_actions

# ============================================================
# 气宗 + 气息魂
# ============================================================
def sim_breath(max_ticks=50000):
    ctb = CTBSim([
        {'name': 'player', 'speed': PLAYER_SPEED},
        {'name': 'enemy', 'speed': ENEMY_SPEED},
    ])

    qi = 10
    total_player = 0
    total_spirit = 0
    player_actions = 0
    enemy_actions = 0

    passive_counter = 0
    storm_counter = 0
    has_injury = False
    sequel_streak = 0
    log = []

    ticks_elapsed = 0
    while ticks_elapsed < max_ticks:
        actor, dt = ctb.tick_to_next()
        ticks_elapsed += dt

        if actor['name'] == 'player':
            player_actions += 1

            # 气息魂鼓励攒气爆发
            if qi >= 6:
                skill, cost, mult, stype = '崩山', 6, 3.5, 'ultimate'
            elif qi >= 2:
                skill, cost, mult, stype = '迅击', 2, 2.0, 'special'
            else:
                skill, cost, mult, stype = '轻拳', 0, 1.0, 'attack'

            qi -= cost
            d = calc_dmg(mult)
            injury_bonus = 0
            if has_injury and d > 0:
                injury_bonus = round(d * 0.2)
                d += injury_bonus
                has_injury = False
            total_player += d

            events = []

            # 续剑
            sequel_d = 0
            if stype == 'special':
                sequel_streak += 1
                if sequel_streak >= 3:
                    sequel_d = calc_dmg(1.6)  # 续剑·终
                    events.append(f"续剑·终({sequel_d:.0f})")
                    sequel_streak = 0
                else:
                    sequel_d = calc_dmg(0.8)
                    events.append(f"续剑({sequel_d:.0f})")
                total_spirit += sequel_d
            else:
                sequel_streak = 0

            # 累计计数
            if cost > 0:
                passive_counter += cost
                storm_counter += cost

                if passive_counter >= 6:
                    pd = calc_dmg(1.0)
                    total_spirit += pd
                    has_injury = True
                    passive_counter = 0
                    events.append(f"被动({pd:.0f})+内伤")

                if storm_counter >= 12:
                    sd = calc_dmg_hits(1.0, 3)
                    total_spirit += sd
                    storm_counter = 0
                    events.append(f"旋风斩({sd:.0f})")

            inj = f"(内伤+{injury_bonus})" if injury_bonus else ""
            ev = f" | {'，'.join(events)}" if events else ""
            log.append(f"  [{ticks_elapsed:5.0f}] 玩家#{player_actions:2d}: {skill}({cost}气) {d:.0f}{inj}{ev}")

            qi = min(10, qi + 2)
            ctb.reset_av(actor)

        elif actor['name'] == 'enemy':
            enemy_actions += 1
            ctb.reset_av(actor)

    total = total_player + total_spirit
    print(f"\n{'='*70}")
    print(f"气宗 + 气息魂 - 玩家{player_actions}次, 敌人{enemy_actions}次")
    print(f"{'='*70}")
    for l in log[:30]:
        print(l)
    if len(log) > 30:
        print(f"  ... 省略{len(log)-30}行 ...")
    print(f"\n  角色: {total_player:.0f}  魂灵: {total_spirit:.0f}  总: {total:.0f}")
    print(f"  玩家DPT: {total/player_actions:.1f}  |  每敌人回合: {total/enemy_actions:.1f}")
    print(f"  魂灵占比: {total_spirit/total*100:.1f}%")
    return total, player_actions, enemy_actions

# ============================================================
# 气宗 + 连击魂
# ============================================================
def sim_combo(max_ticks=50000):
    spirit_base_speed = 150  # 魂灵基础速度

    ctb = CTBSim([
        {'name': 'player', 'speed': PLAYER_SPEED},
        {'name': 'spirit', 'speed': spirit_base_speed},
        {'name': 'enemy', 'speed': ENEMY_SPEED},
    ])

    qi = 10
    gale = 0
    total_player = 0
    total_spirit = 0
    player_actions = 0
    spirit_actions = 0
    enemy_actions = 0

    cross_count = 0
    last_attacker = None
    log = []

    def add_gale(n, source=""):
        nonlocal gale
        old = gale
        gale = min(10, gale + n)
        ctb.set_speed('player', PLAYER_SPEED + gale * 10)
        # 乘风：魂灵也受疾风加成（假设每层+5）
        ctb.set_speed('spirit', spirit_base_speed + gale * 5)

    def spend_gale(n):
        nonlocal gale
        gale = max(0, gale - n)
        ctb.set_speed('player', PLAYER_SPEED + gale * 10)
        ctb.set_speed('spirit', spirit_base_speed + gale * 5)

    def update_cross(who):
        nonlocal cross_count, last_attacker
        if last_attacker and last_attacker != who:
            cross_count += 1
        last_attacker = who

    ticks_elapsed = 0
    while ticks_elapsed < max_ticks:
        actor, dt = ctb.tick_to_next()
        ticks_elapsed += dt

        if actor['name'] == 'player':
            player_actions += 1

            # 连击魂策略：偏向高频出手，保持疾风
            # 有追加技能(连拳)时轻拳更优，但这里先用基础技能
            if qi >= 2:
                skill, cost, mult, stype = '迅击', 2, 2.0, 'special'
            else:
                skill, cost, mult, stype = '轻拳', 0, 1.0, 'attack'

            qi -= cost
            d = calc_dmg(mult)
            total_player += d

            add_gale(1)
            update_cross('player')

            events = []

            # 交错之斩检查
            if cross_count >= 3:
                cd = calc_dmg_hits(1.5, 2)
                total_spirit += cd
                cross_count = 0
                add_gale(0)  # 强化3才+3层，基础不加
                events.append(f"交错之斩({cd:.0f})")

            ev = f" | {'，'.join(events)}" if events else ""
            log.append(f"  [{ticks_elapsed:5.0f}] 玩家#{player_actions:2d}: {skill}({cost}气) {d:.0f} | 疾风{gale}层(+{gale*10}速){ev}")

            qi = min(10, qi + 2)
            ctb.reset_av(actor)

        elif actor['name'] == 'spirit':
            spirit_actions += 1
            events = []

            if gale >= 7:
                # 攒够了用飞驰步
                spend_gale(5)
                sd = calc_dmg(1.0)
                total_spirit += sd
                events.append(f"飞驰步({sd:.0f})")
                update_cross('spirit')

                # 玩家立即再行动
                ctb.advance_av(ctb.units[0], 1.0)
                events.append("→玩家立即行动")

            elif gale >= 3:
                # 斩风
                spend_gale(2)
                sd = calc_dmg_hits(0.7, 2)
                total_spirit += sd
                events.append(f"斩风({sd:.0f})")
                update_cross('spirit')
            else:
                events.append("蓄力（疾风不足）")

            # 交错之斩检查
            if cross_count >= 3:
                cd = calc_dmg_hits(1.5, 2)
                total_spirit += cd
                cross_count = 0
                events.append(f"交错之斩({cd:.0f})")

            log.append(f"  [{ticks_elapsed:5.0f}] 魂灵#{spirit_actions:2d}: {'，'.join(events)} | 疾风{gale}层")
            ctb.reset_av(actor)

        elif actor['name'] == 'enemy':
            enemy_actions += 1
            ctb.reset_av(actor)

    total = total_player + total_spirit
    print(f"\n{'='*70}")
    print(f"气宗 + 连击魂 - 玩家{player_actions}次, 魂灵{spirit_actions}次, 敌人{enemy_actions}次")
    print(f"{'='*70}")
    for l in log[:40]:
        print(l)
    if len(log) > 40:
        print(f"  ... 省略{len(log)-40}行 ...")
    print(f"\n  角色: {total_player:.0f}  魂灵: {total_spirit:.0f}  总: {total:.0f}")
    print(f"  玩家DPT: {total/player_actions:.1f}  |  每敌人回合: {total/enemy_actions:.1f}")
    print(f"  魂灵占比: {total_spirit/total*100:.1f}%")
    print(f"  玩家行动频率: {player_actions/enemy_actions:.1f}x敌人")
    return total, player_actions, enemy_actions

# ============================================================
if __name__ == '__main__':
    TICKS = 50000

    print(f"参数: ATK={ATK}, 敌DEF={ENEMY_DEF}, 玩家速度={PLAYER_SPEED}, 敌速度={ENEMY_SPEED}")
    print(f"速度比: {PLAYER_SPEED/ENEMY_SPEED:.1f}:1")
    print(f"模拟时长: {TICKS} ticks")

    n_dmg, n_pa, n_ea = sim_naked(TICKS)
    b_dmg, b_pa, b_ea = sim_breath(TICKS)
    c_dmg, c_pa, c_ea = sim_combo(TICKS)

    print(f"\n{'='*70}")
    print(f"对比总结")
    print(f"{'='*70}")
    print(f"  {'':12s} {'总伤害':>8s} {'玩家DPT':>8s} {'每敌回合':>8s} {'魂灵占比':>8s} {'vs裸':>8s}")
    print(f"  {'无魂灵':12s} {n_dmg:8.0f} {n_dmg/n_pa:8.1f} {n_dmg/n_ea:8.1f} {'—':>8s} {'—':>8s}")
    print(f"  {'气息魂':12s} {b_dmg:8.0f} {b_dmg/b_pa:8.1f} {b_dmg/b_ea:8.1f} {(b_dmg-n_dmg)/b_dmg*100:7.0f}% {(b_dmg-n_dmg)/n_dmg*100:+7.0f}%")
    print(f"  {'连击魂':12s} {c_dmg:8.0f} {c_dmg/c_pa:8.1f} {c_dmg/c_ea:8.1f} {(c_dmg-n_dmg)/c_dmg*100:7.0f}% {(c_dmg-n_dmg)/n_dmg*100:+7.0f}%")
    print(f"\n  注: 连击魂的疾风加速会提高玩家行动次数，影响每敌回合伤害")
