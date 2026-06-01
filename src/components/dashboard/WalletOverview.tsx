import { trustlines } from '../../data/stellarMock'
import { formatCurrency } from '../../lib/format'

export function WalletOverview() {
  const dustCount = trustlines.filter((asset) => asset.dust).length
  const dustValue = trustlines
    .filter((asset) => asset.dust)
    .reduce((total, asset) => total + asset.usdValue, 0)

  return (
    <section className="rounded-lg border border-[#6B7B6B]/20 bg-white/45 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Wallet overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">Dust sweeper</h2>
        </div>
        <span className="rounded-md bg-[#C8A84B]/15 px-2.5 py-1 text-xs font-medium text-[#1A2E1A]">
          {dustCount} dust
        </span>
      </div>

      <div className="mt-5 rounded-md bg-[#1A2E1A] p-4 text-[#F5F0E8]">
        <p className="text-sm text-[#F5F0E8]/65">Batch opportunity</p>
        <p className="mt-1 text-3xl font-semibold">{formatCurrency(dustValue)}</p>
        <p className="mt-2 text-sm text-[#F5F0E8]/65">
          PathPaymentStrictReceive into USDC using native DEX pathfinding.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {trustlines.map((asset) => (
          <div
            className="rounded-md border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-3"
            key={`${asset.code}-${asset.issuer}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-[#1A2E1A]">{asset.code}</p>
                <p className="text-xs text-[#6B7B6B]">{asset.route}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{asset.balance.toLocaleString()}</p>
                <p className="text-xs text-[#6B7B6B]">{formatCurrency(asset.usdValue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

