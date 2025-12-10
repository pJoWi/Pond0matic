import { NextResponse } from 'next/server';

// PNDC Token on Ethereum
const PNDC_CONTRACT = '0x423f4e6138e475d85cf7ea071ac92097ed631eea';

export async function GET() {
  try {
    // Fetch from DexScreener (supports Ethereum tokens)
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${PNDC_CONTRACT}`,
      {
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error('DexScreener API request failed');
    }

    const data = await response.json();

    // DexScreener returns an array of pairs for the token
    // We'll use the first pair with highest liquidity
    const pairs = data.pairs || [];

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: 'No trading pairs found' },
        { status: 404 }
      );
    }

    // Sort by liquidity (USD) and take the most liquid pair
    const mainPair = pairs.sort((a: any, b: any) => {
      const liqA = parseFloat(a.liquidity?.usd || '0');
      const liqB = parseFloat(b.liquidity?.usd || '0');
      return liqB - liqA;
    })[0];

    return NextResponse.json({
      price: parseFloat(mainPair.priceUsd || '0'),
      priceChange24h: parseFloat(mainPair.priceChange?.h24 || '0'),
      marketCap: parseFloat(mainPair.fdv || '0'), // Fully Diluted Valuation
      volume24h: parseFloat(mainPair.volume?.h24 || '0'),
      liquidity: parseFloat(mainPair.liquidity?.usd || '0'),
      pairAddress: mainPair.pairAddress,
      dexId: mainPair.dexId,
      timestamp: Date.now(),
      source: 'dexscreener',
    });
  } catch (error) {
    console.error('Error fetching PNDC stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PNDC token data',
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
