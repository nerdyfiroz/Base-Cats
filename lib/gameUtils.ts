// ─── Constants ────────────────────────────────────────────────
export const RARITY_MULTIPLIER: Record<number, number> = {
  0: 1.0,   // Common
  1: 1.25,  // Uncommon
  2: 1.5,   // Rare
  3: 2.0,   // Epic
  4: 3.0,   // Legendary
};

export const RARITY_LABEL = ['Common','Uncommon','Rare','Epic','Legendary'];
export const RARITY_COLOR = ['#aaaaaa','#4fc3f7','#9c27b0','#ff9800','#ffd700'];

export const DISTRICTS = [
  { id: 'neon_alley',    name: 'Neon Alley',    drop: 'wire',  difficulty: 1, color: '#a389f4' },
  { id: 'rust_bazaar',   name: 'Rust Bazaar',   drop: 'scrap', difficulty: 1, color: '#ff7043' },
  { id: 'vapor_heights', name: 'Vapor Heights', drop: 'glow',  difficulty: 3, color: '#26c6da' },
  { id: 'data_nexus',    name: 'Data Nexus',    drop: 'chip',  difficulty: 2, color: '#42a5f5' },
  { id: 'shadow_docks',  name: 'Shadow Docks',  drop: 'fuel',  difficulty: 2, color: '#ec407a' },
  { id: 'the_vault',     name: 'The Vault',     drop: 'cred',  difficulty: 5, color: '#ffd700' },
];

export const HEIST_TIERS = [
  { tier: 1, staminaCost: 25, baseLoot: 40,  difficulty: 20 },
  { tier: 2, staminaCost: 30, baseLoot: 70,  difficulty: 40 },
  { tier: 3, staminaCost: 35, baseLoot: 110, difficulty: 60 },
  { tier: 4, staminaCost: 40, baseLoot: 160, difficulty: 80 },
  { tier: 5, staminaCost: 50, baseLoot: 250, difficulty: 95 },
];

export const GEAR_RECIPES: Record<string, {
  name: string; cost: Record<string, number>; stat: string; bonus: number; emoji: string;
}> = {
  iron_claws:    { name: 'Iron Claws',    cost: { scrap: 50, wire: 20 },             stat: 'combatPower', bonus: 10, emoji: '🗡️' },
  stealth_cloak: { name: 'Stealth Cloak', cost: { chip: 30, wire: 40, glow: 10 },    stat: 'stealth',     bonus: 20, emoji: '🌑' },
  hack_module:   { name: 'Hack Module',   cost: { chip: 60, fuel: 25 },              stat: 'hacking',     bonus: 15, emoji: '💻' },
  neon_armor:    { name: 'Neon Armor',    cost: { scrap: 100, chip: 50, cred: 5 },   stat: 'defense',     bonus: 25, emoji: '🛡️' },
  stam_injector: { name: 'Stam Injector', cost: { fuel: 80 },                        stat: 'stamina',     bonus: 30, emoji: '💉' },
};

// ─── Stat Interface ───────────────────────────────────────────
export interface CatStats {
  combatPower: number;
  stealth: number;
  hacking: number;
  stamina: number;
  rarity: number;
  level: number;
}

// ─── Heist Calculation ────────────────────────────────────────
export function calcHeistSuccess(cat: CatStats, tier: number, districtDiff: number): number {
  const rarityMult = RARITY_MULTIPLIER[cat.rarity] ?? 1;
  const relevantStat = (cat.stealth * 0.5 + cat.hacking * 0.5) * rarityMult;
  const tierDiff = HEIST_TIERS[tier - 1]?.difficulty ?? 50;
  const rawChance = relevantStat / (tierDiff + districtDiff * 5) * 100;
  return Math.min(95, Math.max(10, Math.round(rawChance)));
}

export function runHeist(cat: CatStats, tier: number, districtDiff: number): {
  outcome: 'full' | 'partial' | 'busted';
  lootMultiplier: number;
} {
  const chance = calcHeistSuccess(cat, tier, districtDiff);
  const roll = Math.random() * 100;
  if (roll < chance * 0.8)       return { outcome: 'full',    lootMultiplier: 1.0 };
  if (roll < chance)             return { outcome: 'partial', lootMultiplier: 0.5 };
  return                                { outcome: 'busted',  lootMultiplier: 0 };
}

export function calcLoot(tier: number, outcome: 'full' | 'partial' | 'busted'): number {
  const base = HEIST_TIERS[tier - 1]?.baseLoot ?? 40;
  const mult = outcome === 'full' ? 1 : outcome === 'partial' ? 0.5 : 0;
  const rng  = 0.8 + Math.random() * 0.4;
  return Math.round(base * mult * rng);
}

// ─── PvP Simulation ───────────────────────────────────────────
export interface BattleRound { attack: number; defense: number; damage: number; }

export function simulatePvP(
  attacker: CatStats,
  defender: CatStats
): { rounds: BattleRound[]; winner: 'attacker' | 'defender' } {
  const rounds: BattleRound[] = [];
  let attackerHP = 100 + attacker.combatPower;
  let defenderHP = 100 + defender.combatPower;

  for (let i = 0; i < 3; i++) {
    // Attacker hits
    const atkRoll  = (attacker.combatPower * RARITY_MULTIPLIER[attacker.rarity]) * (0.8 + Math.random() * 0.4);
    const defRoll  = (defender.stealth * 0.5) + (Math.random() * 20);
    const dmg      = Math.max(1, Math.round(atkRoll - defRoll));
    defenderHP -= dmg;
    rounds.push({ attack: Math.round(atkRoll), defense: Math.round(defRoll), damage: dmg });

    // Defender retaliates
    if (defenderHP > 0) {
      const dAtkRoll = (defender.combatPower * RARITY_MULTIPLIER[defender.rarity]) * (0.8 + Math.random() * 0.4);
      const dDefRoll = (attacker.stealth * 0.5) + (Math.random() * 20);
      const dDmg     = Math.max(1, Math.round(dAtkRoll - dDefRoll));
      attackerHP -= dDmg;
    }
  }
  return { rounds, winner: defenderHP <= 0 || attackerHP > defenderHP ? 'attacker' : 'defender' };
}

// ─── Stamina Regen ────────────────────────────────────────────
export function calcCurrentStamina(current: number, lastRegen: string): number {
  const now    = Date.now();
  const last   = new Date(lastRegen).getTime();
  const hoursPassed = (now - last) / 3_600_000;
  const regened = Math.floor(hoursPassed * 10);
  return Math.min(100, current + regened);
}

// ─── XP & Leveling ───────────────────────────────────────────
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function applyXP(currentXP: number, currentLevel: number, earnedXP: number) {
  let xp  = currentXP + earnedXP;
  let lvl = currentLevel;
  while (xp >= xpForLevel(lvl) && lvl < 50) {
    xp -= xpForLevel(lvl);
    lvl++;
  }
  return { xp, level: lvl };
}

// ─── Crafting Validation ──────────────────────────────────────
export function canCraft(
  gearKey: string,
  resources: Record<string, number>
): boolean {
  const recipe = GEAR_RECIPES[gearKey];
  if (!recipe) return false;
  return Object.entries(recipe.cost).every(([res, amt]) => (resources[res] ?? 0) >= amt);
}
