import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runHeist, calcLoot, applyXP, HEIST_TIERS, DISTRICTS } from '@/lib/gameUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { catTokenId, district, tier, catStats } = await req.json();

    // ── Validate inputs ────────────────────────────────
    if (!catTokenId || !district || !tier || !catStats) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const districtData = DISTRICTS.find(d => d.id === district);
    if (!districtData) return NextResponse.json({ error: 'Invalid district' }, { status: 400 });

    const tierData = HEIST_TIERS[tier - 1];
    if (!tierData) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    // ── Fetch cat state ────────────────────────────────
    const { data: cat, error: catErr } = await supabase
      .from('cats')
      .select('*')
      .eq('token_id', catTokenId)
      .single();

    if (catErr || !cat) return NextResponse.json({ error: 'Cat not found' }, { status: 404 });

    // ── Stamina check ──────────────────────────────────
    const now = Date.now();
    const lastRegen = new Date(cat.stamina_last_regen).getTime();
    const regenedHours = (now - lastRegen) / 3_600_000;
    const currentStamina = Math.min(100, cat.stamina_current + Math.floor(regenedHours * 10));

    if (currentStamina < tierData.staminaCost) {
      return NextResponse.json({ error: 'Not enough stamina', stamina: currentStamina }, { status: 400 });
    }

    // ── Run heist logic ────────────────────────────────
    const { outcome, lootMultiplier } = runHeist(catStats, tier, districtData.difficulty);
    const loot = calcLoot(tier, outcome);

    // ── Update stamina + XP ────────────────────────────
    const newStamina = currentStamina - tierData.staminaCost;
    const xpEarned   = outcome === 'full' ? tier * 20 : outcome === 'partial' ? tier * 10 : tier * 2;
    const { xp: newXP, level: newLevel } = applyXP(cat.xp, cat.level, xpEarned);

    await supabase
      .from('cats')
      .update({
        stamina_current:   newStamina,
        stamina_last_regen: new Date().toISOString(),
        xp:                newXP,
        level:             newLevel,
      })
      .eq('token_id', catTokenId);

    // ── Update player resources ────────────────────────
    if (outcome !== 'busted' && loot > 0) {
      const resource = districtData.drop;
      const { data: res } = await supabase
        .from('resources')
        .select('*')
        .eq('player_id', cat.owner_wallet) // ideally join player
        .single();

      if (res) {
        await supabase
          .from('resources')
          .update({ [resource]: (res[resource] ?? 0) + loot })
          .eq('player_id', res.player_id);
      }
    }

    // ── Log heist ─────────────────────────────────────
    await supabase.from('heist_log').insert({
      cat_token_id:    catTokenId,
      player_wallet:   cat.owner_wallet,
      district_id:     district,
      tier,
      outcome,
      resources_earned: { [districtData.drop]: loot },
    });

    return NextResponse.json({ outcome, loot, resource: districtData.drop, xpEarned, levelUp: newLevel > cat.level });
  } catch (err) {
    console.error('[heist]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
