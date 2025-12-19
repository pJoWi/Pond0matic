import { NextResponse } from 'next/server';

const WPOND_MINT = '3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq';
const DEXSCREENER_PAIR = 'HdM9481g5mXApUUsMSMxwVcRVcTde7nqLjGsgqMMf4P2'; // wPOND/SOL Raydium pair

export async function GET() {
  try {
    // Try DexScreener first (more reliable)
    try {
      const dexResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/solana/${DEXSCREENER_PAIR}`,
        {
          next: { revalidate: 30 }, // Cache for 30 seconds
        }
      );

      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        const pairData = dexData.pair;

        if (pairData?.priceUsd) {
          return NextResponse.json({
            price: parseFloat(pairData.priceUsd),
            priceChange24h: parseFloat(pairData.priceChange?.h24 || '0'),
            volume24h: parseFloat(pairData.volume?.h24 || '0'),
            timestamp: Date.now(),
            source: 'dexscreener',
          });
        }
      }
    } catch (dexError) {
      console.warn('DexScreener failed, trying Jupiter:', dexError);
    }

    // Fallback to Jupiter Price API v2
    const headers: HeadersInit = {};
    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (jupiterApiKey) {
      headers['x-api-key'] = jupiterApiKey;
    }

    const jupResponse = await fetch(
      `https://api.jup.ag/price/v2?ids=${WPOND_MINT}`,
      {
        headers,
        next: { revalidate: 30 },
      }
    );

    if (!jupResponse.ok) {
      throw new Error('Both price sources failed');
    }

    const jupData = await jupResponse.json();
    const priceData = jupData.data?.[WPOND_MINT];

    if (!priceData) {
      return NextResponse.json(
        { error: 'Price data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      price: priceData.price || 0,
      priceChange24h: 0,
      volume24h: 0,
      timestamp: Date.now(),
      source: 'jupiter',
    });
  } catch (error) {
    console.error('Error fetching wPOND price:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price data',
        price: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
