'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatRecord } from '@/lib/supabase';
import { DISTRICTS, HEIST_TIERS, calcHeistSuccess, calcCurrentStamina } from '@/lib/gameUtils';
import { useGameStore } from '@/lib/gameStore';

interface Props {
  cat: CatRecord;
  traits: { combatPower: number; stealth: number; hacking: number; rarity: number };
  onClose: () => void;
  onSuccess: (district: string, tier: number, loot: number, resource: string) => void;
}

type Phase = 'select' | 'confirm' | 'running' | 'result';

export default function HeistModal({ cat, traits, onClose, onSuccess }: Props) {
  const { notify } = useGameStore();
  const [phase, setPhase] = useState<Phase>('select');
  const [selDistrict, setSelDistrict] = useState(DISTRICTS[0]);
  const [selTier, setSelTier] = useState(1);
  const [result, setResult] = useState<{ outcome: 'full'|'partial'|'busted'; loot: number } | null>(null);

  const stamina   = calcCurrentStamina(cat.stamina_current, cat.stamina_last_regen);
  const tierData  = HEIST_TIERS[selTier - 1];
  const catStats  = { ...traits, stamina, level: cat.level };
  const chance    = calcHeistSuccess(catStats, selTier, selDistrict.difficulty);
  const canAfford = stamina >= tierData.staminaCost;

  const executeHeist = async () => {
    if (!canAfford) { notify('Not enough stamina!', 'error'); return; }
    setPhase('running');

    try {
      const res = await fetch('/api/heist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catTokenId:  cat.token_id,
          district:    selDistrict.id,
          tier:        selTier,
          catStats,
        }),
      });
      const data = await res.json();
      setResult(data);
      setPhase('result');
      if (data.outcome !== 'busted') {
        onSuccess(selDistrict.id, selTier, data.loot, selDistrict.drop);
      }
    } catch {
      notify('Heist failed — network error', 'error');
      setPhase('select');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="heist-modal"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hm-header">
          <div className="hm-title">🎯 NEON HEIST</div>
          <button className="hm-close" onClick={onClose}>✕</button>
        </div>

        {/* Phase: select */}
        {(phase === 'select' || phase === 'confirm') && (
          <>
            {/* District selection */}
            <div className="hm-section-label">Select District</div>
            <div className="hm-district-grid">
              {DISTRICTS.map(d => (
                <button
                  key={d.id}
                  className={`hm-district-btn ${selDistrict.id === d.id ? 'selected' : ''}`}
                  style={{ '--d-color': d.color } as React.CSSProperties}
                  onClick={() => setSelDistrict(d)}
                >
                  <div className="hm-d-name">{d.name}</div>
                  <div className="hm-d-drop">drops {d.drop.toUpperCase()}</div>
                  <div className="hm-d-diff">{'★'.repeat(d.difficulty)}</div>
                </button>
              ))}
            </div>

            {/* Tier selection */}
            <div className="hm-section-label">Heist Tier</div>
            <div className="hm-tier-row">
              {HEIST_TIERS.map(t => (
                <button
                  key={t.tier}
                  className={`hm-tier-btn ${selTier === t.tier ? 'selected' : ''}`}
                  onClick={() => setSelTier(t.tier)}
                >
                  T{t.tier}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="hm-stat-grid">
              <div className="hm-stat"><span>🎲 Success Chance</span><strong className={chance >= 70 ? 'text-green' : chance >= 40 ? 'text-yellow' : 'text-red'}>{chance}%</strong></div>
              <div className="hm-stat"><span>📦 Est. Loot</span><strong>{Math.round(tierData.baseLoot * 0.8)}–{tierData.baseLoot} {selDistrict.drop.toUpperCase()}</strong></div>
              <div className="hm-stat"><span>⚡ Stamina Cost</span><strong className={canAfford ? '' : 'text-red'}>{tierData.staminaCost} ({stamina} avail)</strong></div>
            </div>

            <button
              className="btn-neon w-full mt-4"
              disabled={!canAfford}
              onClick={executeHeist}
            >
              {canAfford ? '🚀 EXECUTE HEIST' : '❌ NOT ENOUGH STAMINA'}
            </button>
          </>
        )}

        {/* Phase: running */}
        {phase === 'running' && (
          <div className="hm-running">
            <div className="hm-spinner">🐱</div>
            <p>Your cat is executing the heist…</p>
            <div className="hm-progress-bar">
              <motion.div
                className="hm-progress-fill"
                animate={{ width: '100%' }}
                initial={{ width: '0%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && result && (
          <div className="hm-result">
            <div className={`hm-result-icon ${result.outcome}`}>
              {result.outcome === 'full' ? '🏆' : result.outcome === 'partial' ? '📦' : '🚨'}
            </div>
            <div className="hm-result-title">
              {result.outcome === 'full' ? 'FULL SCORE!' : result.outcome === 'partial' ? 'PARTIAL LOOT' : 'BUSTED!'}
            </div>
            {result.outcome !== 'busted' && (
              <div className="hm-result-loot">
                +{result.loot} {selDistrict.drop.toUpperCase()}
              </div>
            )}
            {result.outcome === 'busted' && (
              <p className="hm-result-desc">Guards caught your cat. Gear durability reduced.</p>
            )}
            <div className="hm-result-actions">
              <button className="btn-neon" onClick={() => setPhase('select')}>Try Again</button>
              <button className="btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
