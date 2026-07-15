import { useState, type ReactNode } from 'react'
import type { RiskProfile } from '../../types/stellar'

type QuizOption = {
  label: string
  description: string
  score: number
}

type QuizQuestion = {
  id: string
  question: string
  options: QuizOption[]
}

const questions: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'What is your DeFi experience level?',
    options: [
      { label: 'New to DeFi', description: "I'm just getting started", score: 0 },
      { label: 'Some experience', description: "I've used a few protocols before", score: 1 },
      { label: 'Experienced', description: 'I actively use DeFi across multiple chains', score: 2 },
    ],
  },
  {
    id: 'volatility',
    question: 'How much volatility can you handle?',
    options: [
      { label: 'Minimal', description: 'I prioritize protecting my capital', score: 0 },
      { label: 'Moderate', description: 'Some swings are fine for better returns', score: 1 },
      { label: 'High', description: 'I embrace risk for maximum yield', score: 2 },
    ],
  },
  {
    id: 'horizon',
    question: 'What is your investment horizon?',
    options: [
      { label: 'Short-term', description: 'Less than 3 months', score: 0 },
      { label: 'Medium-term', description: '3 to 12 months', score: 1 },
      { label: 'Long-term', description: 'More than a year', score: 2 },
    ],
  },
]

function scoreToProfile(total: number): RiskProfile {
  if (total <= 2) return 'Conservative'
  if (total <= 4) return 'Moderate'
  return 'Aggressive'
}

const profileMeta: Record<
  RiskProfile,
  { description: string; color: string; dotColor: string; icon: ReactNode }
> = {
  Conservative: {
    description: 'Stable lending pools with predictable yields and lower exposure.',
    color: 'text-[#16A34A]',
    dotColor: 'bg-[#16A34A]',
    icon: (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#16A34A]/30 bg-[#16A34A]/15 text-[#16A34A]">
        <svg className="size-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    ),
  },
  Moderate: {
    description: 'A balanced mix of lending and LP positions for solid risk-adjusted returns.',
    color: 'text-[#F2C12E]',
    dotColor: 'bg-[#F2C12E]',
    icon: (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#F2C12E]/30 bg-[#F2C12E]/15 text-[#F2C12E]">
        <svg className="size-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>
    ),
  },
  Aggressive: {
    description: 'High-yield LP and rewards. Higher APY comes with more market exposure.',
    color: 'text-[#F97316]',
    dotColor: 'bg-[#F97316]',
    icon: (
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#F97316]/30 bg-[#F97316]/15 text-[#F97316]">
        <svg className="size-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    ),
  },
}

export function RiskQuiz({
  onComplete,
  onSkip,
}: {
  onComplete: (profile: RiskProfile) => void
  onSkip: () => void
}) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<RiskProfile | null>(null)

  const currentQuestion = questions[step]
  const totalSteps = questions.length

  const handleContinue = () => {
    if (selected === null) return

    const nextAnswers = [...answers, selected]

    if (step < totalSteps - 1) {
      setAnswers(nextAnswers)
      setSelected(null)
      setStep(step + 1)
    } else {
      const total = nextAnswers.reduce((sum, s) => sum + s, 0)
      setResult(scoreToProfile(total))
    }
  }

  if (result) {
    const meta = profileMeta[result]
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D12]/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.12] bg-[#14141E] shadow-2xl">
          <div className="p-8 text-center">
            <div>{meta.icon}</div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">Your risk profile</p>
            <h2 className={`mt-2 text-4xl font-bold ${meta.color}`}>{result}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">{meta.description}</p>
          </div>
          <div className="border-t border-white/[0.08] p-6">
            <button
              className="w-full rounded-xl bg-[#F2C12E] py-3.5 text-sm font-semibold text-[#0D0D12] transition duration-150 hover:bg-[#F2C12E]/90"
              onClick={() => onComplete(result)}
              type="button"
            >
              View personalized opportunities →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D12]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.12] bg-[#14141E] shadow-2xl">
        <div className="p-6 pb-0">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">
              Risk assessment · {step + 1}/{totalSteps}
            </p>
            <button
              className="text-xs text-[#9CA3AF] underline underline-offset-4 transition hover:text-[#F0F0F0]"
              onClick={onSkip}
              type="button"
            >
              Skip
            </button>
          </div>

          <div className="mb-5 flex gap-1.5">
            {questions.map((_, i) => (
              <div
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-[#F2C12E]' : 'bg-white/[0.12]'
                }`}
                key={i}
              />
            ))}
          </div>

          <h2 className="text-xl font-semibold leading-snug text-[#F0F0F0]">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="space-y-2 p-6">
          {currentQuestion.options.map((option) => {
            const isSelected = selected === option.score
            return (
              <button
                className={`w-full rounded-xl border p-4 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-[#F2C12E] bg-[#F2C12E] text-[#0D0D12]'
                    : 'border-white/[0.12] bg-white/[0.04] text-[#F0F0F0] hover:border-white/[0.2] hover:bg-white/[0.08]'
                }`}
                key={option.label}
                onClick={() => setSelected(option.score)}
                type="button"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p
                      className={`mt-0.5 text-sm ${isSelected ? 'text-[#0D0D12]/70' : 'text-[#9CA3AF]'}`}
                    >
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-150 ${
                      isSelected
                        ? 'border-[#0D0D12]/30 bg-[#0D0D12]/15 text-[#0D0D12]'
                        : 'border-white/[0.2] bg-transparent'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="border-t border-white/[0.08] p-6 pt-0">
          <button
            className="w-full rounded-xl bg-[#F2C12E] py-3.5 text-sm font-semibold text-[#0D0D12] transition duration-150 hover:bg-[#F2C12E]/90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selected === null}
            onClick={handleContinue}
            type="button"
          >
            {step < totalSteps - 1 ? 'Continue' : 'See my profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
