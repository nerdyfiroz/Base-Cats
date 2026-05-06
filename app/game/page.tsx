'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACTS } from '@/lib/wagmi';

import { useGameStore } from '@/lib/gameStore';
import { getPlayer, upsertPlayer, getResources, getCatsForWallet, getTopGangs, supabase } from '@/lib/supabase';
import { calcCurrentStamina, DISTRICTS } from '@/lib/gameUtils';

import ResourceBar     from '@/components/game/ResourceBar';
import CatCard         from '@/components/game/CatCard';
import HeistModal      from '@/components/game/HeistModal';
import CraftingPanel   from '@/components/game/CraftingPanel';
import GangHQ          from '@/components/game/GangHQ';
import PvPArena        from '@/components/game/PvPArena';

// Dynamic import for Phaser (client-side only)
const GameMap = dynamic(() => import('@/components/game/GameMap'), { ssr: false });

type Tab = 'map' | 'heist' | 'craft' | 'pvp' | 'gang';

// Minimal ERC-721 ABI — only balanceOf needed for the gate check
const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '',     type: 'uint256' }],
  },
] as const;

// Mock traits (replace with on-chain tokenURI / trait reads)
const MOCK_TRAITS = { combatPower: 72, stealth: 58, hacking: 85, rarity: 2, stamina: 100, level: 12 };

export default function GameDashboard() {
  const { address, isConnected } = useAccount();
  const { player, cats, resources, activeCat, notification,
          setPlayer, setCats, setResources, setActiveCat, notify } = useGameStore();

  // ── On-chain NFT gate: must hold ≥1 Base Cat to play ────────
  const { data: nftBalance, isLoading: nftLoading } = useReadContract({
    address:      CONTRACTS.BaseCatzNFT as `0x${string}`,
    abi:          ERC721_ABI,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  const hasNFT = nftBalance !== undefined && BigInt(nftBalance) > BigInt(0);

  const [tab, setTab] = useState<Tab>('map');
  const [heistOpen, setHeistOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [topGangs, setTopGangs] = useState<Awaited<ReturnType<typeof getTopGangs>>>([]);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap player data on wallet connect ──────────────
  useEffect(() => {
    if (!address) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        // Sync player and resources via API (bypasses RLS limits)
        const res = await fetch('/api/player/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address })
        });
        
        if (!res.ok) throw new Error('Failed to sync player data');
        const data = await res.json();
        
        setPlayer(data.player);
        setResources(data.resources);

        // Fetch remaining public read data
        const [catList, gangs] = await Promise.all([
          getCatsForWallet(address),
          getTopGangs(10),
        ]);

        setCats(catList);
        setTopGangs(gangs);
      } catch (err) {
        console.error('Failed to load game data:', err);
        notify('Failed to load game data. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  // ── Heist result handler ──────────────────────────────────
  const handleHeistSuccess = async (district: string, tier: number, loot: number, resource: string) => {
    if (!resources || !player) return;
    const updated = { ...resources, [resource]: (resources as any)[resource] + loot };
    setResources(updated as any);
    await supabase.from('resources').update({ [resource]: (updated as any)[resource] }).eq('player_id', player.id);
    notify(`+${loot} ${resource.toUpperCase()} collected!`, 'success');
    setHeistOpen(false);
  };

  // ── Craft handler ─────────────────────────────────────────
  const handleCraft = async (gearKey: string) => {
    if (!resources || !player) return;
    const res = await fetch('/api/craft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerWallet: address, gearKey }),
    });
    const data = await res.json();
    if (data.resources) setResources(data.resources);
  };

  // ── District map click → open heist overlay ─────────────
  const handleDistrictClick = (districtId: string) => {
    setSelectedDistrict(districtId);
    setHeistOpen(true);
    // Stay on map tab so the overlay animates over the map
  };

  // ── PvP battle end ────────────────────────────────────────
  const handleBattleEnd = async (won: boolean, rankChange: number) => {
    if (!player) return;
    const newRank = Math.max(0, player.pvp_rank + rankChange);
    setPlayer({ ...player, pvp_rank: newRank });
    await supabase.from('players').update({ pvp_rank: newRank }).eq('id', player.id);
  };

  // ── Guards (order matters) ───────────────────────────────
  if (!isConnected) return <ConnectScreen />;
  if (nftLoading)   return <LoadingScreen label="Checking NFT ownership…" />;
  if (!hasNFT)      return <NoNFTScreen address={address!} />;
  if (loading)      return <LoadingScreen label="Loading the city…" />;

  const myTraitsForCat = { ...MOCK_TRAITS, level: activeCat?.level ?? 1 };

  return (
    <div className="game-shell">
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="game-topbar">
        <div className="game-brand">🐱 BASE CATZ</div>
        {resources && <ResourceBar resources={resources} />}
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>

      {/* ── Notification toast ──────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`toast toast--${notification.type}`}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="game-layout">
        {/* ── Left sidebar: Cat roster ─────────────────── */}
        <aside className="game-sidebar">
          <div className="sidebar-title">MY CATS</div>
          <div className="cat-roster">
            {cats.length === 0 && (
              <div className="no-cats">
                <div style={{ fontSize: 48 }}>🐱</div>
                <p>No cats detected in this wallet.</p>
                <p>Mint a Base Cat to play!</p>
              </div>
            )}
            {cats.map(cat => (
              <CatCard
                key={cat.id}
                cat={cat}
                traits={MOCK_TRAITS}
                isActive={activeCat?.id === cat.id}
                onClick={() => setActiveCat(cat)}
              />
            ))}
          </div>

          {/* Quick actions */}
          {activeCat && (
            <div className="quick-actions">
              <div className="sidebar-title">QUICK ACTION</div>
              <button className="btn-neon w-full" onClick={() => setHeistOpen(true)}>
                🎯 SEND ON HEIST
              </button>
              <button className="btn-ghost w-full mt-2" onClick={() => setTab('pvp')}>
                ⚔️ PVP BATTLE
              </button>
            </div>
          )}
        </aside>

        {/* ── Main area ────────────────────────────────── */}
        <main className="game-main">
          {/* Tab navigation */}
          <nav className="game-tabs">
            {([
              { id: 'map',   label: '🗺️ Map' },
              { id: 'heist', label: '🎯 Heist' },
              { id: 'craft', label: '🔧 Craft' },
              { id: 'pvp',   label: '⚔️ PvP' },
              { id: 'gang',  label: '🐾 Gang' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button
                key={t.id}
                className={`game-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="tab-content"
            >
              {tab === 'map' && (
                <div>
                  <GameMap
                    onDistrictClick={handleDistrictClick}
                    controlledDistricts={['neon_alley', 'shadow_docks']}
                  />
                  <div className="district-legend">
                    {DISTRICTS.map(d => (
                      <button
                        key={d.id}
                        className="legend-pill"
                        style={{ borderColor: d.color, color: d.color }}
                        onClick={() => handleDistrictClick(d.id)}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'heist' && (
                <div className="heist-tab-placeholder">
                  {activeCat ? (
                    <>
                      <div style={{ fontSize: 48, textAlign: 'center' }}>🎯</div>
                      <p style={{ textAlign: 'center', color: '#a389f4', marginTop: 12 }}>
                        Select a district from the <strong>Map</strong> tab or use<br />
                        <strong>SEND ON HEIST</strong> from the sidebar.
                      </p>
                      <button
                        className="btn-neon"
                        style={{ margin: '16px auto', display: 'block' }}
                        onClick={() => setHeistOpen(true)}
                      >
                        🚀 OPEN HEIST
                      </button>
                    </>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>
                      Select a cat from the sidebar to begin a heist.
                    </p>
                  )}
                </div>
              )}

              {tab === 'craft' && resources && (
                <CraftingPanel resources={resources} onCraft={handleCraft} />
              )}

              {tab === 'pvp' && activeCat && (
                <PvPArena
                  myCat={activeCat}
                  myTraits={myTraitsForCat}
                  onBattleEnd={handleBattleEnd}
                />
              )}

              {tab === 'gang' && (
                <GangHQ
                  gang={null}
                  topGangs={topGangs}
                  playerWallet={address ?? ''}
                  onCreateGang={async (name) => {
                    const res = await fetch('/api/gang/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ leaderWallet: address, name }),
                    });
                    const data = await res.json();
                    if (data.gang) { notify(`Gang "${name}" created!`, 'success'); }
                    else notify(data.error || 'Failed to create gang', 'error');
                  }}
                  onRaid={() => notify('Raid launched! 🗡️', 'success')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Right panel: Season stats ─────────────────── */}
        <aside className="game-sidebar-right">
          <SeasonPanel pvpRank={player?.pvp_rank ?? 1000} seasonPoints={player?.season_points ?? 0} />
        </aside>
      </div>

      {/* Heist modal overlay (from tab or map click) */}
      <AnimatePresence>
        {heistOpen && activeCat && (
          <HeistModal
            cat={activeCat}
            traits={MOCK_TRAITS}
            onClose={() => setHeistOpen(false)}
            onSuccess={handleHeistSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectScreen() {
  return (
    <div className="connect-screen">
      <div className="connect-card">
        <div style={{ fontSize: 80 }}>🐱</div>
        <h1 className="connect-title">BASE CATZ<br/><span>NEON HEIST</span></h1>
        <p className="connect-sub">Connect your wallet to enter the city.</p>
        <ConnectButton label="🔗 CONNECT WALLET" />
      </div>
    </div>
  );
}

function LoadingScreen({ label = 'Loading the city…' }: { label?: string }) {
  return (
    <div className="connect-screen">
      <div className="connect-card">
        <motion.div style={{ fontSize: 80 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>⚡</motion.div>
        <p className="connect-sub">{label}</p>
      </div>
    </div>
  );
}

function NoNFTScreen({ address }: { address: string }) {
  const contractUrl = `https://basescan.org/token/0x790996aaE2A4AEF87612139CFe8e7eae97c8E5C1`;
  const marketUrl   = `https://opensea.io/assets/base/0x790996aaE2A4AEF87612139CFe8e7eae97c8E5C1`;
  return (
    <div className="connect-screen">
      <div className="connect-card" style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 72 }}>🚫🐱</div>
        <h1 className="connect-title" style={{ fontSize: 28 }}>NO BASE CAT<br/><span>DETECTED</span></h1>
        <p className="connect-sub">
          Your wallet <code className="wallet-code">{address.slice(0,6)}…{address.slice(-4)}</code> doesn’t hold a Base Catz NFT.
        </p>
        <p className="connect-sub" style={{ fontSize: 13, marginTop: -8 }}>
          You need at least <strong style={{ color: 'var(--neon-purple)' }}>1 Base Cat</strong> to enter Neon Heist.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon"
            style={{ textDecoration: 'none', justifyContent: 'center' }}
          >
            🛒 GET A BASE CAT ON OPENSEA
          </a>
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ textDecoration: 'none', justifyContent: 'center', fontSize: 11 }}
          >
            📄 View Contract on Basescan
          </a>
        </div>
        <ConnectButton label="🔄 Switch Wallet" />
      </div>
    </div>
  );
}

function SeasonPanel({ pvpRank, seasonPoints }: { pvpRank: number; seasonPoints: number }) {
  const timeLeft = '47d 12h';
  return (
    <div className="season-panel">
      <div className="panel-title">🏆 SEASON 1</div>
      <div className="season-timer">⏱ {timeLeft} left</div>
      <div className="season-stat"><span>PvP Rank</span><strong>#{pvpRank}</strong></div>
      <div className="season-stat"><span>Season Points</span><strong>{seasonPoints}</strong></div>
      <div className="season-progress">
        <div className="section-sub">Battle Pass</div>
        <div className="bp-track">
          <div className="bp-fill" style={{ width: `${Math.min(100, (seasonPoints / 500) * 100)}%` }} />
        </div>
        <div className="bp-lv">Lv {Math.floor(seasonPoints / 50) + 1}</div>
      </div>
      <div className="season-rewards">
        <div className="section-sub">Next Reward</div>
        <div className="reward-preview">🔩 500 SCRAP</div>
      </div>
    </div>
  );
}
