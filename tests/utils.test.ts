import { describe, it, expect } from 'vitest';
import { short, solscanTx, cn } from '../lib/utils';

describe('utils', () => {
  it('short() trims and ellipsizes', () => {
    expect(short('ABCDEFGH', 2)).toBe('AB…GH');
    expect(short('', 2)).toBe('');
    expect(short('A', 1)).toBe('A');
  });
  it('solscanTx() formats a URL', () => {
    const url = solscanTx('abc123');
    expect(url.startsWith('https://solscan.io/tx/')).toBe(true);
    expect(url.includes('abc123')).toBe(true);
    expect(url.includes('cluster=mainnet')).toBe(true);
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
  it('solscanTx() preserves signature verbatim', () => {
    const sig = '3xYz!@#$%^&*()';
    expect(solscanTx(sig)).toBe(`https://solscan.io/tx/${sig}?cluster=mainnet`);
  });
});
