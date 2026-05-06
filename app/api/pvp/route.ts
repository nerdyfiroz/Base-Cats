import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { simulatePvP } from '@/lib/gameUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── Client created inside handler — env vars are available at request time ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { attackerWallet, defenderWallet, attackerCatId, defenderCatId, attackerTraits, defenderTraits } = await req.json();

    // ── Anti-grief: max 3 attacks on same player per 24h ──
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await supabase
      .from('pvp_battles')
      .select('*', { count: 'exact', head: true })
      .eq('attacker_wallet', attackerWallet)
      .eq('defender_wallet', defenderWallet)
      .gte('created_at', oneDayAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Anti-grief: max 3 attacks on same player per day' }, { status: 429 });
    }

    // ── Simulate battle ────────────────────────────────
    const { rounds, winner } = simulatePvP(attackerTraits, defenderTraits);
    const attackerWon  = winner === 'attacker';
    const defenderWon  = !attackerWon;
    const winnerWallet = attackerWon ? attackerWallet : defenderWallet;

    // ── Rank changes ───────────────────────────────────
    const { data: aPlayer } = await supabase.from('players').select('pvp_rank').eq('wallet_address', attackerWallet).single();
    const { data: dPlayer } = await supabase.from('players').select('pvp_rank').eq('wallet_address', defenderWallet).single();

    const attackerRank = aPlayer?.pvp_rank ?? 1000;
    const defenderRank = dPlayer?.pvp_rank ?? 1000;
    const rankDiff     = Math.abs(attackerRank - defenderRank);
    const rankBonus    = rankDiff > 200 && defenderRank > attackerRank ? 15 : 0;

    const attackerDelta = attackerWon ? 20 + rankBonus : -15;
    const defenderDelta = attackerWon ? -10 : 20;

    await Promise.all([
      supabase.from('players').update({ pvp_rank: Math.max(0, attackerRank + attackerDelta) }).eq('wallet_address', attackerWallet),
      supabase.from('players').update({ pvp_rank: Math.max(0, defenderRank + defenderDelta) }).eq('wallet_address', defenderWallet),
    ]);

    // ── Resource reward (50 WIRE for winner) ───────────
    const { data: winnerRes } = await supabase
      .from('resources')
      .select('wire, player_id')
      .eq('player_id', winnerWallet)
      .single();
    if (winnerRes) {
      await supabase.from('resources').update({ wire: (winnerRes.wire ?? 0) + 50 }).eq('player_id', winnerRes.player_id);
    }

    // ── Gear durability penalty on loser ──────────────
    if (defenderWon) {
      await supabase.rpc('reduce_gear_durability', { cat_token_id: attackerCatId, amount: 10 });
    }

    // ── Log battle ─────────────────────────────────────
    await supabase.from('pvp_battles').insert({
      attacker_wallet:      attackerWallet,
      defender_wallet:      defenderWallet,
      attacker_cat_id:      attackerCatId,
      defender_cat_id:      defenderCatId,
      winner_wallet:        winnerWallet,
      rounds,
      rank_change_attacker: attackerDelta,
    });

    return NextResponse.json({
      winner: winnerWallet,
      rounds,
      attackerRankChange: attackerDelta,
      defenderRankChange: defenderDelta,
      reward: attackerWon ? { wire: 50 } : null,
    });
  } catch (err) {
    console.error('[pvp]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
