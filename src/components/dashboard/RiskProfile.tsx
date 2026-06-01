import { useState } from 'react'
import type { RiskProfile as RiskProfileType } from '../../types/stellar'

const profiles: RiskProfileType[] = ['Conservative', 'Moderate', 'Aggressive']

export function RiskProfile() {
  const [selected, setSelected] = useState<RiskProfileType>('Moderate')
  const conservative = selected === 'Conservative'
  const moderate = selected === 'Moderate'
  const fixed = conservative ? 80 : moderate ? 50 : 25
  const variable = 100 - fixed

  return (
    <section className="rounded-xl border border-[#6B7B6B]/20 bg-white/45 p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Risk profile</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">Auto-invest matrix</h2>

      <div className="mt-5 grid gap-2">
        {profiles.map((profile) => (
          <button
            aria-pressed={selected === profile}
            className={`rounded-md border p-3 text-left transition ${
              selected === profile
                ? 'border-[#C8A84B]/80 bg-[#C8A84B]/15'
                : 'border-[#6B7B6B]/15 bg-[#F5F0E8]/55 hover:border-[#C8A84B]/50'
            }`}
            key={profile}
            onClick={() => setSelected(profile)}
            type="button"
          >
            <span className="font-medium text-[#1A2E1A]">{profile}</span>
            <span className="mt-1 block text-xs text-[#6B7B6B]">
              {profile === 'Conservative'
                ? 'More USDC lending, lower volatility.'
                : profile === 'Moderate'
                  ? '50% Fixed Yield and 50% Liquidity Pool.'
                  : 'Higher variable pool exposure.'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-[#1A2E1A]">{selected} allocation</span>
          <span className="text-[#6B7B6B]">Soroban rebalance</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-[#6B7B6B]/15">
          <div className="bg-[#C8A84B]" style={{ width: `${fixed}%` }} />
          <div className="bg-[#4ade80]" style={{ width: `${variable}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Allocation label="Fixed Yield" value={`${fixed}% USDC Lending`} />
          <Allocation label="Liquidity Pool" value={`${variable}% Variable`} />
        </div>
      </div>
    </section>
  )
}

function Allocation({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className="font-medium text-[#1A2E1A]">{value}</p>
    </div>
  )
}
