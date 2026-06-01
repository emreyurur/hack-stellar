export function truncatePublicKey(publicKey: string) {
  if (publicKey.length <= 12) {
    return publicKey
  }

  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

