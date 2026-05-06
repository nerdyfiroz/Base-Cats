'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gang } from '@/lib/supabase';
import { useGameStore } from '@/lib/gameStore';

interface Props {
  gang: Gang | null;
  topGangs: Gang[];
  playerWallet: string;
  onCreateGang: (name: string) => Promise<void>;
  onRaid: () => void;
}

const WAR_STATUS = { active: true, enemy: 'GLITCH CLAWS', timeLeft: '2d 14h', territoryHP: 620 };
const TERRITORIES = ['Neon Alley','Shadow Docks'];

export default function GangHQ({ gang, topGangs, playerWallet, onCreateGang, onRaid }: Props) {
  const { notify } = useGameStore();
  const [tab, setTab] = useState<'hq'|'war'|'leaderboard'>('hq');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) { notify('Enter a gang name', 'error'); return; }
    setCreating(true);
    await onCreateGang(newName.trim());
    setCreating(false);
  };

  return (
    <div className="gang-hq">
      <div className="panel-title">🐾 GANG HQ</div>

      {/* Tab bar */}
      <div className="tab-bar">
        {(['hq','war','leaderboard'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'hq' ? '🏠 HQ' : t === 'war' ? '⚔️ WAR' : '🏆 RANKS'}
          </button>
        ))}
      </div>

      {/* HQ tab */}
      {tab === 'hq' && (
        gang ? (
          <div className="gang-info">
            <div className="gang-name">{gang.name}</div>
            <div className="gang-meta">
              <span>👑 {gang.leader_wallet.slice(0,6)}…</span>
              <span>💎 {gang.bank_cred} CRED</span>
              <span>⚔️ {gang.pvp_wins} Wins</span>
            </div>
            <div className="gang-territories">
              <div className="section-sub">Territories Held: {TERRITORIES.length}/6</div>
              <div className="territory-list">
                {TERRITORIES.map(t => (
                  <div key={t} className="territory-tag">📍 {t}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="gang-create">
            <p className="gang-create-hint">You are not in a gang. Create one or get invited.</p>
            <input
              className="neon-input"
              placeholder="Gang Name (e.g. Neon Vipers)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={30}
            />
            <button className="btn-neon mt-2" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : '⚡ CREATE GANG'}
            </button>
          </div>
        )
      )}

      {/* War tab */}
      {tab === 'war' && (
        <div className="gang-war-panel">
          {WAR_STATUS.active ? (
            <>
              <div className="war-status-badge">⚔️ WAR ACTIVE</div>
              <div className="war-meta">
                <span>vs <strong>{WAR_STATUS.enemy}</strong></span>
                <span>⏱ {WAR_STATUS.timeLeft} left</span>
              </div>
              <div className="war-hp-section">
                <div className="section-sub">Enemy Territory HP</div>
                <div className="war-hp-track">
                  <motion.div
                    className="war-hp-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${WAR_STATUS.territoryHP / 10}%` }}
                    transition={{ duration: 1.2, type: 'spring' }}
                  />
                </div>
                <div className="war-hp-val">{WAR_STATUS.territoryHP} / 1000</div>
              </div>
              <div className="war-actions">
                <button className="btn-neon" onClick={onRaid}>🗡️ RAID ENEMY</button>
                <button className="btn-ghost">🛡️ DEFEND</button>
              </div>
            </>
          ) : (
            <div className="war-inactive">
              <p>🕊️ Armistice — no war active</p>
              <p className="text-secondary">Next war window opens Monday 00:00 UTC</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <div className="leaderboard-list">
          {topGangs.map((g, i) => (
            <div key={g.id} className={`lb-row ${g.leader_wallet === playerWallet ? 'lb-row--mine' : ''}`}>
              <span className="lb-rank">#{i + 1}</span>
              <span className="lb-name">{g.name}</span>
              <span className="lb-score">{g.pvp_wins} W</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
