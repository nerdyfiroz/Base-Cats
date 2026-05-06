import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ─── Types ────────────────────────────────────────────────────
export interface Player {
  id: string;
  wallet_address: string;
  username: string | null;
  gang_id: string | null;
  pvp_rank: number;
  season_points: number;
  created_at: string;
}

export interface CatRecord {
  id: string;
  token_id: number;
  owner_wallet: string;
  level: number;
  xp: number;
  stamina_current: number;
  stamina_last_regen: string;
  active_ability_cooldown: string | null;
  gear_head: string | null;
  gear_body: string | null;
  gear_weapon: string | null;
}

export interface Resources {
  player_id: string;
  scrap: number;
  wire: number;
  chip: number;
  fuel: number;
  glow: number;
  cred: number;
}

export interface Gang {
  id: string;
  name: string;
  leader_wallet: string;
  emblem_url: string | null;
  bank_cred: number;
  pvp_wins: number;
  season_rank: number;
}

export interface GearItem {
  id: string;
  owner_wallet: string;
  gear_type: string;
  durability: number;
  equipped_to: number | null;
  is_nft: boolean;
}

// ─── DB Helpers ───────────────────────────────────────────────
export async function getPlayer(wallet: string): Promise<Player | null> {
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('wallet_address', wallet.toLowerCase())
    .single();
  return data;
}

export async function upsertPlayer(wallet: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .upsert({ wallet_address: wallet.toLowerCase() }, { onConflict: 'wallet_address' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getResources(playerId: string): Promise<Resources | null> {
  const { data } = await supabase
    .from('resources')
    .select('*')
    .eq('player_id', playerId)
    .single();
  return data;
}

export async function getCatsForWallet(wallet: string): Promise<CatRecord[]> {
  const { data } = await supabase
    .from('cats')
    .select('*')
    .eq('owner_wallet', wallet.toLowerCase())
    .order('level', { ascending: false });
  return data || [];
}

export async function getTopGangs(limit = 10): Promise<Gang[]> {
  const { data } = await supabase
    .from('gangs')
    .select('*')
    .order('season_rank', { ascending: true })
    .limit(limit);
  return data || [];
}

export async function getLeaderboard(seasonId: number) {
  const { data } = await supabase
    .from('season_leaderboard')
    .select('*, players(username, wallet_address)')
    .eq('season_id', seasonId)
    .order('score', { ascending: false })
    .limit(100);
  return data || [];
}
