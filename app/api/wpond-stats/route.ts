import { NextResponse } from 'next/server';

const WPOND_MINT = '3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq';
const VAULT_ADDRESS = '4ngqDt821wV2CjxoZLCjcTAPZNt6ZqpswoqyQEztsU36';

interface TokenStats {
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holders: number;
}

export async function GET() {
  try {
    // Fetch market data from DexScreener API
    const dexResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${WPOND_MINT}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!dexResponse.ok) {
      throw new Error('Failed to fetch market data');
    }

    const dexData = await dexResponse.json();
    const pairs = dexData.pairs || [];

    // Get the most liquid pair
    const mainPair = pairs.length > 0
      ? pairs.reduce((prev: any, current: any) =>
          (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
        )
      : null;

    const stats: TokenStats = {
      marketCap: mainPair?.fdv || mainPair?.marketCap || 0,
      liquidity: mainPair?.liquidity?.usd || 0,
      volume24h: mainPair?.volume?.h24 || 0,
      priceChange24h: mainPair?.priceChange?.h24 || 0,
      holders: 0, // Would need Helius or similar for accurate holder count
    };

    return NextResponse.json({
      ...stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching wPOND stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market stats' },
      { status: 500 }
    );
  }
}
