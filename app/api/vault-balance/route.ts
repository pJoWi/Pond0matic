import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const VAULT_ADDRESS = '4ngqDt821wV2CjxoZLCjcTAPZNt6ZqpswoqyQEztsU36';
const DEFAULT_RPC = process.env.NEXT_PUBLIC_DEFAULT_RPC || 'https://api.mainnet-beta.solana.com';

export async function GET() {
  try {
    const connection = new Connection(DEFAULT_RPC, 'confirmed');
    const vaultPubkey = new PublicKey(VAULT_ADDRESS);

    // Get SOL balance
    const balance = await connection.getBalance(vaultPubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    return NextResponse.json({
      address: VAULT_ADDRESS,
      balance: solBalance,
      balanceLamports: balance,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching vault balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vault balance',
        address: VAULT_ADDRESS,
        balance: 0,
        balanceLamports: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
