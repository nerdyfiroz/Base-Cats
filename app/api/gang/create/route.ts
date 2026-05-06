import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { leaderWallet, name } = await req.json();
    if (!leaderWallet || !name?.trim()) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Check if name taken
    const { data: existing } = await supabase.from('gangs').select('id').eq('name', name.trim()).single();
    if (existing) return NextResponse.json({ error: 'Gang name already taken' }, { status: 409 });

    // Check player isn't already in a gang
    const { data: player } = await supabase
      .from('players').select('id, gang_id').eq('wallet_address', leaderWallet.toLowerCase()).single();
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    if (player.gang_id) return NextResponse.json({ error: 'Already in a gang' }, { status: 400 });

    // Create gang
    const { data: gang } = await supabase.from('gangs').insert({
      name: name.trim(),
      leader_wallet: leaderWallet.toLowerCase(),
      bank_cred: 0,
      pvp_wins: 0,
      season_rank: 999,
    }).select().single();

    // Join player to gang
    await supabase.from('players').update({ gang_id: gang.id }).eq('id', player.id);

    // Init territories (all uncontrolled at start)
    return NextResponse.json({ gang });
  } catch (err) {
    console.error('[gang/create]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
