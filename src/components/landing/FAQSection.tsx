import { useState } from 'react'

type FAQItem = {
  id: string
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What is Terminal8 and how does it generate yield on Stellar?',
    answer:
      'Terminal8 is an institutional-grade DeFi yield aggregator and vault platform built natively on the Stellar network. By strategically routing liquidity into prime lending protocols (such as Blend Protocol) and automated market makers, Terminal8 optimizes APY while maintaining rigorous institutional risk controls.',
  },
  {
    id: 'faq-2',
    question: 'Which assets are supported for deposit in Terminal8 vaults?',
    answer:
      'Terminal8 supports core Stellar ecosystem assets including XLM, USDC, EURC, PYUSD, and AQUA. Each vault operates autonomously with transparent on-chain strategies and real-time trust score analytics.',
  },
  {
    id: 'faq-3',
    question: 'How do institutional risk tiers work?',
    answer:
      'Every vault is assigned a risk classification (Conservative, Balanced, or Aggressive) based on smart contract audit verification, asset volatility, protocol utilization thresholds, and counterparty exposure metrics.',
  },
  {
    id: 'faq-4',
    question: 'Are my funds locked, or can I withdraw at any time?',
    answer:
      'Most prime vaults offer non-custodial, liquid positions allowing you to deposit or withdraw your capital at any time directly through your Freighter wallet without lockup periods or exit penalties.',
  },
  {
    id: 'faq-5',
    question: 'Do I need a Freighter wallet to use Terminal8?',
    answer:
      'Yes, Terminal8 seamlessly integrates with Freighter wallet on the Stellar network. Simply connect your wallet to access live vault APYs, deposit capital, and track your portfolio positions in real time.',
  },
]

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1')

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="faq" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2C12E]">
            Help & Knowledge
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#F0F0F0] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#9CA3AF]">
            Discover quick and comprehensive answers to common questions about Terminal8 vaults, security, and yield strategies.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqItems.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-[#F2C12E]/40 bg-[#14141E] shadow-[0_4px_24px_rgba(242,193,46,0.06)]'
                    : 'border-white/[0.08] bg-[#12121A] hover:border-white/[0.16]'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors"
                >
                  <span className="text-base font-semibold text-[#F0F0F0] sm:text-lg">
                    {item.question}
                  </span>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 border-[#F2C12E]/40 bg-[#F2C12E]/10 text-[#F2C12E]'
                        : 'border-white/[0.10] bg-white/[0.04] text-[#9CA3AF]'
                    }`}
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.06] px-6 py-5 text-sm leading-relaxed text-[#9CA3AF]">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
