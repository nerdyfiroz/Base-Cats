import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const wallet = walletAddress.toLowerCase();

    // Upsert player
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .upsert({ wallet_address: wallet }, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (playerErr) throw playerErr;

    // Get resources (should be created by trigger, but we fetch to be sure)
    let { data: res } = await supabase
      .from('resources')
      .select('*')
      .eq('player_id', player.id)
      .single();

    if (!res) {
      // Fallback in case trigger failed
      const { data: newRes } = await supabase
        .from('resources')
        .upsert(
          { player_id: player.id, scrap: 0, wire: 0, chip: 0, fuel: 0, glow: 0, cred: 0 },
          { onConflict: 'player_id' }
        )
        .select()
        .single();
      res = newRes;
    }

    return NextResponse.json({ player, resources: res });
  } catch (err) {
    console.error('[player/sync]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
