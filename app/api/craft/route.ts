import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GEAR_RECIPES, canCraft } from '@/lib/gameUtils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { playerWallet, gearKey } = await req.json();

    const recipe = GEAR_RECIPES[gearKey];
    if (!recipe) return NextResponse.json({ error: 'Unknown gear' }, { status: 400 });

    // ── Get player + resources ─────────────────────────
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('wallet_address', playerWallet.toLowerCase())
      .single();
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const { data: res } = await supabase
      .from('resources')
      .select('*')
      .eq('player_id', player.id)
      .single();
    if (!res) return NextResponse.json({ error: 'Resources not found' }, { status: 404 });

    // ── Check affordability ────────────────────────────
    if (!canCraft(gearKey, res)) {
      return NextResponse.json({ error: 'Insufficient resources' }, { status: 400 });
    }

    // ── Deduct resources (burn) ────────────────────────
    const updates: Record<string, number> = {};
    for (const [resource, cost] of Object.entries(recipe.cost)) {
      updates[resource] = (res[resource] ?? 0) - cost;
    }

    await supabase.from('resources').update(updates).eq('player_id', player.id);

    // ── Create gear item ───────────────────────────────
    const { data: gear } = await supabase
      .from('gear')
      .insert({
        owner_wallet: playerWallet.toLowerCase(),
        gear_type:    gearKey,
        durability:   100,
        is_nft:       false,
      })
      .select()
      .single();

    // ── Return updated resources ───────────────────────
    const { data: newRes } = await supabase
      .from('resources')
      .select('*')
      .eq('player_id', player.id)
      .single();

    return NextResponse.json({ gear, resources: newRes });
  } catch (err) {
    console.error('[craft]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
