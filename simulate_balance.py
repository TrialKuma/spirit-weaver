import random

# Configuration
ROUNDS = 30
BASE_ATK = 10
ENEMY_DEF = 3
INITIAL_SPEED = 300

class Simulation:
    def __init__(self):
        self.logs = []
        self.history = {} # { char_name: [ {dmg, speed}, ... ] }
        
    def log(self, turn, char_name, action, damage, resources):
        self.logs.append(f"T{turn} | {char_name}: {action} | Dmg: {damage:.1f} | {resources}")

    def record(self, char_name, dmg, speed, av_mod=1.0):
        if char_name not in self.history:
            self.history[char_name] = []
        self.history[char_name].append({'dmg': dmg, 'speed': speed, 'av_mod': av_mod})

# 1. Qi Master (方案 B: 迅击返还，轻击回1)
class QiMaster:
    def __init__(self):
        self.qi = 10
        self.internal_injury_turns = 0 
        self.total_damage = 0
        self.name = "QiMaster"
        self.speed = 300
        
    def run_turn(self, turn, sim):
        # Regen
        self.qi = min(10, self.qi + 2)
        
        # Debuff check
        dmg_mult = 1.0
        if self.internal_injury_turns > 0:
            dmg_mult = 1.30 # Adjusted to 1.30
            
        action = ""
        cost = 0
        gain_qi = 0
        hits = []
        apply_injury = False
        
        # Strategy
        # 1. Devastate (Priority)
        if self.qi >= 8:
            action = "Devastate"
            hits = [(5.0, "Heavy")] # Back to 5.0
            cost = 8
            apply_injury = True
            
        # 2. Rapid Strike (Greed if Injured)
        elif self.internal_injury_turns > 0 and self.qi >= 2:
            action = "Rapid Strike (Refund)"
            hits = [(2.0, "Special")]
            cost = 2
            gain_qi = 2 # Refund cost
            
        # 3. Light Strike (Build Qi)
        else:
            action = "Light Strike"
            hits = [(1.0, "Light")]
            cost = 0
            gain_qi = 1 # Hit Bonus
            
        # Execute
        self.qi -= cost
        self.qi = min(10, self.qi + gain_qi)
        
        turn_dmg = 0
        for mult, tag in hits:
            base_hit = max(1, (BASE_ATK * mult) - ENEMY_DEF)
            hit_dmg = base_hit * dmg_mult
            turn_dmg += hit_dmg
            
        self.total_damage += turn_dmg
        
        if apply_injury:
            self.internal_injury_turns = 2
        elif self.internal_injury_turns > 0:
            self.internal_injury_turns -= 1
            
        sim.log(turn, self.name, action, turn_dmg, f"Qi: {self.qi}, Inj: {self.internal_injury_turns}")
        sim.record(self.name, turn_dmg, self.speed)
        return turn_dmg

# 2. Mana Master (Corrected Burst Expectation)
class ManaMaster:
    def __init__(self):
        self.mana = 10
        self.ammo = 0
        self.stacks = 0 
        self.total_damage = 0
        self.name = "ManaMaster"
        self.speed = 300
        
    def run_turn(self, turn, sim):
        self.stacks = min(5, self.stacks)
        atk_bonus = 1.0 + (self.stacks * 0.05) # Nerfed from 0.06 to 0.05
        
        action = ""
        hits = []
        cost_mana = 0
        cost_ammo = 0
        gained_ammo = 0
        gained_stacks = 0
        consumed_stack = False
        av_mod = 1.0 # Default AV cost modifier
        
        # Strategy Selection
        # Strategy A: Burst Rush (Dump Ammo ASAP)
        # Strategy B: Sustainable Loop (Use Ex-Shoot to regenerate Mana, Burst only on overflow)
        
        STRATEGY = "Burst" # Change this to "Burst" or "Sustainable"
        
        if STRATEGY == "Burst":
            # Original Burst Logic
            if self.mana >= 6 and self.ammo < 3:
                cost_mana = 6
                gained_ammo = 3
                gained_stacks = 3 
                action = "Reload"
                consumed_stack = False
            elif self.ammo >= 3:
                # Ex-Burst: Single Hit High Damage (Mechanic Swap)
                # Cost: 3 Ammo
                hits = [6.25] # Test 625%
                cost_ammo = 3
                action = "Ex-Burst"
                consumed_stack = True
            elif self.ammo >= 1:
                 hits = [3.6] # Ex-Shoot (360% base)
                 cost_ammo = 1
                 action = "Ex-Shoot"
                 consumed_stack = True
            else:
                # Overload Burst: 160% Dmg, +20% AV Delay
                hits = [1.6]
                action = "Overload Burst"
                consumed_stack = True
                av_mod = 1.2
                
        elif STRATEGY == "Sustainable":
            # Sustainable Logic: Prioritize Ex-Shoot to regen Mana
            # 1. Reload if Mana is full enough (prevent overflow if we shoot more) OR empty
            if self.mana >= 6 and self.ammo < 3: 
                cost_mana = 6
                gained_ammo = 3
                gained_stacks = 3 
                action = "Reload"
                consumed_stack = False
                
            # 2. Burst ONLY if Ammo is full (Overflow protection)
            elif self.ammo >= 6: 
                hits = [6.25]
                cost_ammo = 3
                action = "Ex-Burst (Overflow)"
                consumed_stack = True
                
            # 3. Ex-Shoot (Main Driver)
            elif self.ammo >= 1:
                 hits = [3.6] # Ex-Shoot (360%)
                 cost_ammo = 1
                 action = "Ex-Shoot"
                 consumed_stack = True
                 
            # 4. Fallback (Should happen if we burst too much)
            else:
                # Overload Burst: 160% Dmg, Speed -20% for 1 turn (Simulate as next turn AV cost increase)
                hits = [1.6]
                action = "Overload Burst"
                consumed_stack = True
                # In this simple sim, we can approximate Speed Debuff by increasing AV cost of NEXT turn
                # Speed 300 -> 240 (0.8x)
                # AV Cost 33.33 -> 41.66 (1.25x)
                # So we simulate this by adding extra "time" to this action record?
                # Or better: make the simulation aware of Speed Debuff.
                # For simplicity, let's just say this action effectively costs 1.25x AV.
                av_mod = 1.25 
            
        self.mana -= cost_mana
        self.ammo -= cost_ammo
        self.ammo += gained_ammo
        self.stacks += gained_stacks
        
        turn_dmg = 0
        for mult in hits:
            val = BASE_ATK * atk_bonus * mult
            hit_dmg = max(1, val - ENEMY_DEF)
            turn_dmg += hit_dmg
            
        if consumed_stack and self.stacks > 0:
            self.stacks -= 1
            self.mana = min(10, self.mana + 3)
            
        self.total_damage += turn_dmg
        sim.log(turn, self.name, action, turn_dmg, f"Mana: {self.mana}, Ammo: {self.ammo}, Stacks: {self.stacks}")
        sim.record(self.name, turn_dmg, self.speed)
        return turn_dmg

# 3. Balance Master (Buff Logic)
class BalanceMaster:
    def __init__(self):
        self.balance = 0 
        self.flip_cd = 0
        self.total_damage = 0
        self.name = "BalanceMaster"
        self.post_flip_buff = False
        self.speed = 300
        
    def run_turn(self, turn, sim):
        if self.balance > 0: self.balance -= 1
        elif self.balance < 0: self.balance += 1
            
        if self.flip_cd > 0: self.flip_cd -= 1
            
        action = ""
        hits = []
        is_flip = False
        
        can_flip = (self.flip_cd == 0)
        
        if abs(self.balance) >= 3 and can_flip:
            self.balance = -self.balance 
            action = "Flip"
            # 250% + 60% * |Bal|
            base_mult = 2.5 + (0.6 * abs(self.balance))
            hits = [base_mult]
            self.flip_cd = 2 
            is_flip = True
        else:
            action = "Yin Strike"
            hits = [1.25] # Buffed from 1.2
            self.balance = max(-5, self.balance - 3)
            
        turn_dmg = 0
        
        atk_mod = 1.0
        if self.balance > 0: atk_mod = 1.0 + (self.balance * 0.10)
        
        def_mod = 1.0
        if self.balance < 0: def_mod = 1.0 - (abs(self.balance) * 0.10)
        
        # Buff: +100% Dmg
        buff_mult = 2.0 if self.post_flip_buff else 1.0
        if self.post_flip_buff: self.post_flip_buff = False
             
        for mult in hits:
            atk = BASE_ATK * atk_mod * buff_mult
            defense = ENEMY_DEF * def_mod
            val = max(1, (atk * mult) - defense)
            turn_dmg += val
            
        if is_flip:
             self.post_flip_buff = True
             
        self.total_damage += turn_dmg
        sim.log(turn, self.name, action, turn_dmg, f"Bal: {self.balance}, CD: {self.flip_cd}")
        sim.record(self.name, turn_dmg, self.speed)
        return turn_dmg

# 4. Combo Master (Buffed: Penetration)
class ComboMaster:
    def __init__(self):
        self.combo = 0
        self.gale = 0
        self.total_damage = 0
        self.name = "ComboMaster"
        self.speed = 300
        self.total_av_spent = 0
        
    def run_turn(self, turn, sim):
        current_speed = 300 + (self.gale * 10)
        self.speed = current_speed
        av_cost = 10000 / current_speed
        self.total_av_spent += av_cost
        
        atk_bonus = 1.0
        if self.gale >= 10: atk_bonus = 1.2
            
        # Penetration Buff: 5% per Gale stack
        def_penetration = self.gale * 0.05
        current_def = ENEMY_DEF * (1.0 - def_penetration)
        
        action = ""
        hits = []
        cost_combo = 0
        gained_combo = 0
        
        if self.combo >= 6:
            # Finisher: 150% + 50% * Combo
            # At 6 combo: 150 + 300 = 450%
            mult = 1.5 + (0.5 * self.combo)
            hits = [mult] 
            cost_combo = 6 
            action = f"Finisher ({self.combo})"
            self.combo -= 6
        else:
            # Combo Strike: Probability Chain
            # P = 60%, Max 5 hits
            # Base Dmg per hit: Test 80% (needs tuning)
            
            chain_hits = 1
            for _ in range(4): # Try 4 more times for max 5
                if random.random() < 0.6:
                    chain_hits += 1
                else:
                    break
            
            hits = [0.5] * chain_hits # Trying 50% per hit
            action = f"Combo Strike ({chain_hits} hits)"
            gained_combo = chain_hits
            
        turn_dmg = 0
        for mult in hits:
            val = BASE_ATK * atk_bonus * mult
            d = max(1, val - current_def)
            turn_dmg += d
            
        self.gale = min(10, self.gale + 1)
        self.combo = min(10, self.combo + gained_combo)
        
        self.total_damage += turn_dmg
        sim.log(turn, self.name, action, turn_dmg, f"Combo: {self.combo}, Gale: {self.gale}, Spd: {self.speed}")
        sim.record(self.name, turn_dmg, self.speed)
        return turn_dmg

# Simulation Loop
sim = Simulation()
chars = [QiMaster(), ManaMaster(), BalanceMaster(), ComboMaster()]

print("Running Simulation for 30 Actions...")
for turn in range(1, ROUNDS + 1):
    for char in chars:
        dmg = char.run_turn(turn, sim)

# Output Analysis
print("\n--- Phase Analysis (Avg DPS %) ---")
print(f"{'Class':<15} | {'1-10':<10} | {'11-20':<10} | {'21-30':<10} | {'Overall':<10}")
print("-" * 65)

phases = [(0, 10), (10, 20), (20, 30)]

for char_name, history in sim.history.items():
    row = [f"{char_name:<15}"]
    
    total_dmg_all = 0
    total_av_all = 0
    
    for start, end in phases:
        phase_data = history[start:end]
        if not phase_data:
            row.append(f"{'N/A':<10}")
            continue
            
        p_dmg = sum(d['dmg'] for d in phase_data)
        
        # Calculate Time (AV) spent in this phase
        # AV = 10000 / Speed
        p_av = sum(10000 / d['speed'] for d in phase_data)
        
        # DPS = Total Damage / Total AV
        # Normalize to Standard Turn (AV = 10000/300 = 33.33)
        # Normalized DPS = (Dmg / AV) * (10000/300)
        #                = Dmg / AV * 33.33
        
        # Or simply: Avg Dmg per Standard Turn
        
        if p_av > 0:
            dps_norm = (p_dmg / p_av) * (10000 / 300)
            dps_pct = (dps_norm / BASE_ATK) * 100
            row.append(f"{dps_pct:<10.1f}")
        else:
            row.append(f"{0:<10.1f}")
            
        total_dmg_all += p_dmg
        total_av_all += p_av
        
    # Overall
    if total_av_all > 0:
        overall_dps = (total_dmg_all / total_av_all) * (10000 / 300)
        overall_pct = (overall_dps / BASE_ATK) * 100
        row.append(f"{overall_pct:<10.1f}")
    
    print(" | ".join(row))
