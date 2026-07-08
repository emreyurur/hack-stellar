import { describe, it, expect } from 'vitest'
import { truncatePublicKey, formatCurrency } from './format'

describe('truncatePublicKey', () => {
  it('returns short keys unchanged', () => {
    expect(truncatePublicKey('GABC')).toBe('GABC')
  })

  it('truncates long Stellar public keys to head...tail format', () => {
    const key = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    const result = truncatePublicKey(key)
    // head(4) + '...' + tail(4)
    expect(result).toMatch(/^.{4}\.{3}.{4}$/)
    expect(result.startsWith('GBBD')).toBe(true)
    expect(result.endsWith(key.slice(-4))).toBe(true)
  })

  it('truncates to exactly 4 + "..." + 4 characters', () => {
    const key = 'GABC123456789DXYZ'
    const result = truncatePublicKey(key)
    expect(result.length).toBe(11) // 4 + 3 + 4
    expect(result).toContain('...')
    expect(result.startsWith('GABC')).toBe(true)
    expect(result.endsWith(key.slice(-4))).toBe(true)
  })
})

describe('formatCurrency', () => {
  it('formats positive numbers as USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(9.999)).toBe('$10.00')
  })
})
