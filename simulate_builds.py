"""
气宗 build路线 DPT模拟
在baseline基础上加入角色锤子+魂灵锤子的组合
"""

ATK_BASE = 10
ENEMY_DEF = 4
PLAYER_SPEED = 300
ENEMY_SPEED = 100
ENEMY_TURNS = 15  # 按敌人回合数限制，普通战~5-10，精英~15，Boss~25

def calc_dmg(atk, mult, def_val=ENEMY_DEF):
    return max(1, atk * mult - def_val)

class CTB:
    def __init__(self, units):
        self.units = [{'name': u['name'], 'speed': u['speed'], 'av': 10000/u['speed']} for u in units]
    def next(self):
        m = min(u['av'] for u in self.units)
        for u in self.units:
            u['av'] -= m
        a = sorted([u for u in self.units if u['av'] <= 0], key=lambda u: -u['speed'])[0]
        return a, m
    def reset(self, u):
        u['av'] = 10000 / u['speed']
    def advance(self, u, pct):
        u['av'] = max(0, u['av'] - (10000/u['speed']) * pct)
    def set_speed(self, name, spd):
        for u in self.units:
            if u['name'] == name:
                u['speed'] = spd

def run_build(name, config):
    """通用模拟引擎"""
    units = [{'name': 'player', 'speed': PLAYER_SPEED}, {'name': 'enemy', 'speed': ENEMY_SPEED}]
    if config.get('spirit_speed'):
        units.append({'name': 'spirit', 'speed': config['spirit_speed']})

    ctb = CTB(units)
    atk = ATK_BASE
    qi = 10
    gale = 0
    total_p, total_s = 0, 0
    p_act, e_act, s_act = 0, 0, 0

    # 气息魂状态
    passive_ctr = 0
    storm_ctr = 0
    injury = False
    injury_stacks = 0  # 内爆用
    sequel_streak = 0
    atk_bonus = 0  # 回流叠加

    # 连击魂状态
    cross_count = 0
    last_who = None

    has = config.get  # shorthand

    while e_act < ENEMY_TURNS:
        actor, dt = ctb.next()

        if actor['name'] == 'player':
            p_act += 1
            cur_atk = atk + atk_bonus

            # === 选技能策略 ===
            if has('spirit_type') == 'breath':
                # 气息魂策略：崩山优先
                if qi >= 8 and has('崩山极'):
                    skill, cost, mult, hits, stype = '崩山·极', 8, 5.5 + (qi-8)*1.0, 1, 'ultimate'
                elif qi >= 6 and has('拳舞'):
                    skill, cost, mult, hits, stype = '拳舞', 6, 1.55, 4, 'ultimate'
                elif qi >= 6:
                    skill, cost, mult, hits, stype = '崩山', 6, 3.5, 1, 'ultimate'
                elif qi >= 2:
                    skill, cost, mult, hits, stype = '迅击', 2, 2.0, 1, 'special'
                elif has('集气掌'):
                    skill, cost, mult, hits, stype = '集气掌', 0, 1.0, 1, 'attack'
                else:
                    skill, cost, mult, hits, stype = '轻拳', 0, 1.0, 1, 'attack'
            else:
                # 连击魂策略：高频出手
                if has('迅连击') and qi >= 4:
                    skill, cost, mult, hits, stype = '迅连击', 4, 1.5, 3, 'special'
                elif qi >= 2:
                    skill, cost, mult, hits, stype = '迅击', 2, 2.0, 1, 'special'
                elif has('集气掌'):
                    skill, cost, mult, hits, stype = '集气掌', 0, 1.0, 1, 'attack'
                else:
                    skill, cost, mult, hits, stype = '轻拳', 0, 1.0, 1, 'attack'

            qi -= cost
            if hits > 1:
                d = sum(calc_dmg(cur_atk, mult) for _ in range(hits))
            else:
                d = calc_dmg(cur_atk, mult)

            # 内伤易伤
            if injury and d > 0:
                injury_pct = 0.6 if has('重伤') else 0.2
                d = int(d * (1 + injury_pct))
                if not has('内爆'):
                    injury = False
                # 内爆：按回合叠层，不是按受击消耗
                # 简化：这里injury在被动触发时设置

            total_p += d

            # 追加：连拳
            extra_gale = 0
            if has('连拳') and stype == 'attack':
                cd = calc_dmg(cur_atk, 0.8)
                total_p += cd
                extra_gale += 1  # 连拳也算行动+1疾风

            # 集气掌回气
            if skill == '集气掌':
                qi = min(10, qi + 1)

            # === 气息魂逻辑 ===
            if has('spirit_type') == 'breath' and cost > 0:
                passive_ctr += cost
                storm_ctr += cost

                if passive_ctr >= 6:
                    pd = calc_dmg(cur_atk, 1.0)
                    total_s += pd
                    passive_ctr = 0

                    # 回流：魂灵攻击命中已有内伤的目标时+1ATK（先检查再挂新内伤）
                    if has('回流') and injury:
                        atk_bonus += 1

                    if has('内爆'):
                        injury_stacks = min(3, injury_stacks + 1)
                        injury = True
                        if injury_stacks >= 3:
                            boom = calc_dmg(cur_atk, 3.0)
                            total_s += boom
                            injury_stacks = 0
                            injury = False
                    else:
                        injury = True

                if storm_ctr >= 12:
                    sd = sum(calc_dmg(cur_atk, 1.0) for _ in range(3))
                    total_s += sd
                    storm_ctr = 0
                    # 旋风斩也是魂灵攻击，触发回流
                    if has('回流') and injury:
                        atk_bonus += 1

                # 续剑
                if stype == 'special':
                    sequel_streak += 1
                    if sequel_streak >= 3:
                        sd = calc_dmg(cur_atk, 1.6)
                        sequel_streak = 0
                    else:
                        sd = calc_dmg(cur_atk, 0.8)
                    total_s += sd
                    # 续剑也是魂灵攻击，触发回流
                    if has('回流') and injury:
                        atk_bonus += 1
                else:
                    sequel_streak = 0

            # === 连击魂逻辑 ===
            if has('spirit_type') == 'combo':
                gale = min(10, gale + 1 + extra_gale)

                # 裂刃：每3层疾风每段+15%倍率额外伤害
                if has('裂刃') and gale >= 3:
                    blades = gale // 3
                    blade_d = sum(calc_dmg(cur_atk, 0.15 * blades) for _ in range(hits))
                    total_s += blade_d

                ctb.set_speed('player', PLAYER_SPEED + gale * 10)
                ctb.set_speed('spirit', config.get('spirit_speed', 150) + gale * 5)

                if last_who == 'spirit':
                    cross_count += 1
                last_who = 'player'

                if cross_count >= 3:
                    total_s += sum(calc_dmg(cur_atk, 1.5) for _ in range(2))
                    cross_count = 0

            qi = min(10, qi + 2)
            ctb.reset(actor)

        elif actor['name'] == 'spirit':
            s_act += 1
            cur_atk = atk + atk_bonus

            if gale >= 7 and has('飞驰步强化3'):
                # 飞驰步+强化3
                gale -= 5
                total_s += calc_dmg(cur_atk, 1.0)
                ctb.advance(ctb.units[0], 1.0)  # 玩家立即行动
                if last_who == 'player':
                    cross_count += 1
                last_who = 'spirit'
            elif gale >= 3:
                gale -= 2
                total_s += sum(calc_dmg(cur_atk, 0.7) for _ in range(2))
                if last_who == 'player':
                    cross_count += 1
                last_who = 'spirit'

            ctb.set_speed('player', PLAYER_SPEED + gale * 10)
            ctb.set_speed('spirit', config.get('spirit_speed', 150) + gale * 5)

            if cross_count >= 3:
                total_s += sum(calc_dmg(cur_atk, 1.5) for _ in range(2))
                cross_count = 0

            ctb.reset(actor)

        elif actor['name'] == 'enemy':
            e_act += 1
            ctb.reset(actor)


    total = total_p + total_s
    per_enemy = total / max(1, e_act)
    spirit_pct = total_s / max(1, total) * 100
    freq = p_act / max(1, e_act)

    if config.get('_verbose'):
        print(f"\n{'='*70}")
        print(f"{name} - 详细过程")
        print(f"{'='*70}")
        for l in config['_log']:
            print(l)

    return {
        'name': name, 'total': total, 'player': total_p, 'spirit': total_s,
        'p_act': p_act, 'e_act': e_act, 's_act': s_act,
        'per_enemy': per_enemy, 'spirit_pct': spirit_pct, 'freq': freq,
        'atk_bonus': atk_bonus,
    }

# ============================================================
# Build配置
# ============================================================
builds = [
    ("裸·无魂灵", {'spirit_type': None}),

    # --- 气息魂 builds ---
    ("气息魂·基础（无锤）", {'spirit_type': 'breath'}),

    ("气息魂·内爆", {'spirit_type': 'breath', '内爆': True}),

    ("气息魂·重伤+回流", {'spirit_type': 'breath', '重伤': True, '回流': True}),

    ("气息魂·重伤+回流+集气掌", {'spirit_type': 'breath', '重伤': True, '回流': True, '集气掌': True}),

    ("气息魂·内爆+拳舞", {'spirit_type': 'breath', '内爆': True, '拳舞': True}),

    ("气息魂·重伤+回流+崩山极", {'spirit_type': 'breath', '重伤': True, '回流': True, '崩山极': True}),

    # --- 连击魂 builds ---
    ("连击魂·基础（无锤）", {'spirit_type': 'combo', 'spirit_speed': 150}),

    ("连击魂·裂刃", {'spirit_type': 'combo', 'spirit_speed': 150, '裂刃': True}),

    ("连击魂·裂刃+连拳", {'spirit_type': 'combo', 'spirit_speed': 150, '裂刃': True, '连拳': True}),

    ("连击魂·裂刃+迅连击", {'spirit_type': 'combo', 'spirit_speed': 150, '裂刃': True, '迅连击': True}),

    ("连击魂·飞驰步强化3", {'spirit_type': 'combo', 'spirit_speed': 150, '飞驰步强化3': True}),

    ("连击魂·裂刃+连拳+飞驰步3", {'spirit_type': 'combo', 'spirit_speed': 150,
      '裂刃': True, '连拳': True, '飞驰步强化3': True}),
]

if __name__ == '__main__':
    print(f"参数: ATK={ATK_BASE}, DEF={ENEMY_DEF}, 玩家速度={PLAYER_SPEED}, 敌速度={ENEMY_SPEED}, 敌{ENEMY_TURNS}回合")
    print()

    results = []
    for bname, bconf in builds:
        r = run_build(bname, bconf)
        results.append(r)

    base = results[0]['per_enemy']

    print(f"{'Build':<30s} {'每敌回合':>8s} {'魂灵%':>6s} {'行动频率':>8s} {'vs裸':>8s} {'备注'}")
    print("-" * 90)
    for r in results:
        vs = f"+{(r['per_enemy']-base)/base*100:.0f}%" if r['per_enemy'] != base else "—"
        note = ""
        if r['atk_bonus'] > 0:
            note = f"回流叠ATK+{r['atk_bonus']}"
        if r['freq'] > 3.2:
            note += f" 行动{r['freq']:.1f}x"
        print(f"  {r['name']:<28s} {r['per_enemy']:8.1f} {r['spirit_pct']:5.1f}% {r['freq']:7.1f}x  {vs:>7s}  {note}")
