import { describe, it, expect } from 'vitest';
import { short, solscanTx, cn } from '../lib/utils';

describe('utils', () => {
  it('short() trims and ellipsizes', () => {
    expect(short('ABCDEFGH', 2)).toBe('AB…GH');
    expect(short('', 2)).toBe('');
    // Single character strings still get ellipsis (expected behavior)
    expect(short('A', 1)).toBe('A…A');
  });

  it('solscanTx() formats a Helius explorer URL', () => {
    const url = solscanTx('abc123');
    // Now using Helius Orb explorer instead of Solscan
    expect(url.startsWith('https://orb.helius.dev/tx/')).toBe(true);
    expect(url.includes('abc123')).toBe(true);
    expect(url.includes('cluster=mainnet-beta')).toBe(true);
    expect(url.includes('advanced=true')).toBe(true);
    expect(url.includes('tab=logs')).toBe(true);
  });

  it('cn() merges classnames predictably', () => {
    const merged = cn('a', false && 'b', 'c');
    expect(merged).toContain('a');
    expect(merged).toContain('c');
    expect(merged.includes('b')).toBe(false);
  });

  it('short() handles long strings and custom n', () => {
    expect(short('0123456789abcdef', 3)).toBe('012…def');
  });

  it('solscanTx() preserves signature verbatim in URL', () => {
    const sig = '3xYz123ABC';
    const url = solscanTx(sig);
    expect(url).toBe(`https://orb.helius.dev/tx/${sig}?cluster=mainnet-beta&advanced=true&tab=logs`);
  });
});
