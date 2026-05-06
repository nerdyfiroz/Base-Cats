'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatRecord } from '@/lib/supabase';
import { simulatePvP, RARITY_LABEL } from '@/lib/gameUtils';
import { useGameStore } from '@/lib/gameStore';

interface Enemy {
  tokenId: number;
  username: string;
  rank: number;
  traits: { combatPower: number; stealth: number; hacking: number; rarity: number; stamina: number; level: number };
}

// Mock enemies — replace with API call
const MOCK_ENEMIES: Enemy[] = [
  { tokenId: 42,  username: 'ShadowPaws',  rank: 1240, traits: { combatPower: 78, stealth: 65, hacking: 55, rarity: 2, stamina: 80, level: 22 }},
  { tokenId: 117, username: 'NeonScratch', rank: 980,  traits: { combatPower: 55, stealth: 80, hacking: 70, rarity: 1, stamina: 90, level: 18 }},
  { tokenId: 7,   username: 'GlitchClaw',  rank: 1580, traits: { combatPower: 95, stealth: 40, hacking: 88, rarity: 3, stamina: 60, level: 35 }},
];

interface Props {
  myCat: CatRecord;
  myTraits: { combatPower: number; stealth: number; hacking: number; rarity: number; stamina: number; level: number };
  onBattleEnd: (won: boolean, rankChange: number) => void;
}

export default function PvPArena({ myCat, myTraits, onBattleEnd }: Props) {
  const { notify } = useGameStore();
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
  const [phase, setPhase] = useState<'select'|'fighting'|'result'>('select');
  const [battleResult, setBattleResult] = useState<ReturnType<typeof simulatePvP> | null>(null);

  const startBattle = async (enemy: Enemy) => {
    setSelectedEnemy(enemy);
    setPhase('fighting');
    await new Promise(r => setTimeout(r, 2000));

    const result = simulatePvP(myTraits, enemy.traits);
    setBattleResult(result);
    setPhase('result');

    const won = result.winner === 'attacker';
    const rankChange = won ? (enemy.rank > 1000 ? 35 : 20) : -15;
    onBattleEnd(won, rankChange);
    notify(won ? '🏆 Victory! Rank +' + rankChange : '💀 Defeated! Rank ' + rankChange, won ? 'success' : 'error');
  };

  const reset = () => { setPhase('select'); setSelectedEnemy(null); setBattleResult(null); };

  return (
    <div className="pvp-arena">
      <div className="panel-title">⚔️ PVP ARENA</div>

      <AnimatePresence mode="wait">
        {/* Enemy selection */}
        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pvp-my-cat">
              <span>Your Cat: #{String(myCat.token_id).padStart(3,'0')} | ATK {myTraits.combatPower} | STL {myTraits.stealth}</span>
            </div>
            <div className="section-sub mt-2">Choose your opponent</div>
            {MOCK_ENEMIES.map(enemy => (
              <motion.div key={enemy.tokenId} className="enemy-row" whileHover={{ x: 6 }}>
                <div className="enemy-avatar">🐱</div>
                <div className="enemy-info">
                  <div className="enemy-name">{enemy.username}</div>
                  <div className="enemy-stats">ATK {enemy.traits.combatPower} | STL {enemy.traits.stealth} | {RARITY_LABEL[enemy.traits.rarity]}</div>
                </div>
                <div className="enemy-rank">#{enemy.rank}</div>
                <button className="btn-neon-sm" onClick={() => startBattle(enemy)}>FIGHT</button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Fighting */}
        {phase === 'fighting' && selectedEnemy && (
          <motion.div key="fighting" className="pvp-fighting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="pvp-vs-row">
              <div className="pvp-fighter">
                <div className="pvp-cat-icon">😼</div>
                <div>#{String(myCat.token_id).padStart(3,'0')}</div>
              </div>
              <motion.div
                className="pvp-vs-text"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >VS</motion.div>
              <div className="pvp-fighter">
                <div className="pvp-cat-icon">😾</div>
                <div>{selectedEnemy.username}</div>
              </div>
            </div>
            <div className="pvp-fighting-label">⚡ Battle in progress…</div>
            <div className="pvp-sparks">✨💥⚡💥✨</div>
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && battleResult && selectedEnemy && (
          <motion.div key="result" className="pvp-result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={`pvp-outcome ${battleResult.winner === 'attacker' ? 'win' : 'loss'}`}>
              {battleResult.winner === 'attacker' ? '🏆 VICTORY!' : '💀 DEFEATED'}
            </div>
            <div className="pvp-rounds">
              {battleResult.rounds.map((r, i) => (
                <div key={i} className="pvp-round-row">
                  <span>Round {i+1}</span>
                  <span>ATK {r.attack} vs DEF {r.defense}</span>
                  <span className="pvp-dmg">💥 {r.damage} DMG</span>
                </div>
              ))}
            </div>
            <button className="btn-neon mt-4" onClick={reset}>⚔️ FIGHT AGAIN</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
