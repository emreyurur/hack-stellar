import { unstakeEvents, yieldPositions } from '../../data/stellarMock'

export function YieldAndTimeline() {
  return (
    <section className="rounded-lg border border-[#6B7B6B]/20 bg-white/45 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Soroban positions</p>
      <h2 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">Yield calendar</h2>

      <div className="mt-5 space-y-3">
        {yieldPositions.map((position) => (
          <div className="rounded-md border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-3" key={position.sorobanContract}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[#1A2E1A]">{position.protocol}</p>
                <p className="text-xs text-[#6B7B6B]">{position.staked}</p>
              </div>
              <p className="text-sm font-semibold text-[#4ade80]">{position.apy.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {unstakeEvents.map((event) => (
          <div className="flex gap-3" key={`${event.date}-${event.title}`}>
            <div className="w-14 shrink-0 rounded-md border border-[#6B7B6B]/15 py-2 text-center text-xs font-medium text-[#1A2E1A]">
              {event.date}
            </div>
            <div>
              <p className="text-sm font-medium text-[#1A2E1A]">{event.title}</p>
              <p className="text-xs text-[#6B7B6B]">{event.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

