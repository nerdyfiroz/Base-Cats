'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resources } from '@/lib/supabase';
import { GEAR_RECIPES, canCraft } from '@/lib/gameUtils';
import { useGameStore } from '@/lib/gameStore';

interface Props {
  resources: Resources;
  onCraft: (gearKey: string) => Promise<void>;
}

export default function CraftingPanel({ resources, onCraft }: Props) {
  const { notify } = useGameStore();
  const [crafting, setCrafting] = useState<string | null>(null);
  const res = resources as unknown as Record<string, number>;

  const handleCraft = async (key: string) => {
    if (!canCraft(key, res)) { notify('Not enough resources!', 'error'); return; }
    setCrafting(key);
    await onCraft(key);
    setCrafting(null);
    notify(`${GEAR_RECIPES[key].name} crafted!`, 'success');
  };

  return (
    <div className="crafting-panel">
      <div className="panel-title">🔧 WORKSHOP</div>
      <div className="craft-grid">
        {Object.entries(GEAR_RECIPES).map(([key, recipe]) => {
          const affordable = canCraft(key, res);
          return (
            <motion.div
              key={key}
              className={`craft-card ${affordable ? '' : 'craft-card--locked'}`}
              whileHover={affordable ? { y: -4 } : {}}
            >
              <div className="craft-emoji">{recipe.emoji}</div>
              <div className="craft-name">{recipe.name}</div>
              <div className="craft-bonus">+{recipe.bonus}% {recipe.stat}</div>
              <div className="craft-cost">
                {Object.entries(recipe.cost).map(([r, amt]) => (
                  <span key={r} className={res[r] >= amt ? 'cost-ok' : 'cost-lack'}>
                    {amt} {r.toUpperCase()}
                  </span>
                ))}
              </div>
              <button
                className="btn-neon-sm"
                disabled={!affordable || crafting === key}
                onClick={() => handleCraft(key)}
              >
                {crafting === key ? '⚙️ Crafting…' : 'CRAFT'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
