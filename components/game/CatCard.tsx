'use client';
import { CatRecord } from '@/lib/supabase';
import { RARITY_LABEL, RARITY_COLOR, calcCurrentStamina, xpForLevel } from '@/lib/gameUtils';

interface Props {
  cat: CatRecord;
  traits?: { combatPower: number; stealth: number; hacking: number; rarity: number };
  isActive?: boolean;
  onClick?: () => void;
}

export default function CatCard({ cat, traits, isActive, onClick }: Props) {
  const stamina  = calcCurrentStamina(cat.stamina_current, cat.stamina_last_regen);
  const xpNeeded = xpForLevel(cat.level);
  const xpPct    = Math.min(100, Math.round((cat.xp / xpNeeded) * 100));
  const rarity   = traits?.rarity ?? 0;
  const color    = RARITY_COLOR[rarity];
  const label    = RARITY_LABEL[rarity];

  return (
    <div
      onClick={onClick}
      className={`cat-card ${isActive ? 'cat-card--active' : ''}`}
      style={{ '--rarity-color': color } as React.CSSProperties}
    >
      <div className="cat-card-rarity-badge" style={{ background: color }}>
        {label}
      </div>

      <div className="cat-card-img-wrap">
        <img
          src={`/NFTs/cat_nft_${String(cat.token_id).padStart(3,'0')}.png`}
          alt={`Cat #${cat.token_id}`}
          onError={e => { e.currentTarget.src = `https://placehold.co/200x200/1a1030/a389f4?text=CAT+%23${cat.token_id}`; }}
        />
        <div className="cat-card-level-badge">Lv{cat.level}</div>
      </div>

      <div className="cat-card-body">
        <div className="cat-card-id">#{String(cat.token_id).padStart(3,'0')}</div>

        {/* Stats row */}
        {traits && (
          <div className="cat-card-stats">
            <StatPill icon="⚔️" val={traits.combatPower} label="ATK" />
            <StatPill icon="👁️" val={traits.stealth}     label="STL" />
            <StatPill icon="💻" val={traits.hacking}     label="HCK" />
          </div>
        )}

        {/* Stamina bar */}
        <div className="cat-bar-row">
          <span className="cat-bar-label">⚡ {stamina}/100</span>
          <div className="cat-bar-track">
            <div className="cat-bar-fill cat-bar-stam" style={{ width: `${stamina}%` }} />
          </div>
        </div>

        {/* XP bar */}
        <div className="cat-bar-row">
          <span className="cat-bar-label">XP {xpPct}%</span>
          <div className="cat-bar-track">
            <div className="cat-bar-fill cat-bar-xp" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, val, label }: { icon: string; val: number; label: string }) {
  return (
    <div className="stat-pill">
      <span>{icon}</span>
      <span className="stat-pill-val">{val}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}
