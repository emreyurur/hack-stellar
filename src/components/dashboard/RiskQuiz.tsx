import { useState } from 'react'
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
  { description: string; color: string; dotColor: string; emoji: string }
> = {
  Conservative: {
    description: 'Stable lending pools with predictable yields and lower exposure.',
    color: 'text-[#4ade80]',
    dotColor: 'bg-[#4ade80]',
    emoji: '🛡️',
  },
  Moderate: {
    description: 'A balanced mix of lending and LP positions for solid risk-adjusted returns.',
    color: 'text-[#C8A84B]',
    dotColor: 'bg-[#C8A84B]',
    emoji: '⚖️',
  },
  Aggressive: {
    description: 'High-yield LP and rewards. Higher APY comes with more market exposure.',
    color: 'text-orange-400',
    dotColor: 'bg-orange-400',
    emoji: '🚀',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F0F]/75 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#6B7B6B]/20 bg-[#F5F0E8] shadow-2xl">
          <div className="p-8 text-center">
            <div className="mb-4 text-5xl">{meta.emoji}</div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#6B7B6B]">Your risk profile</p>
            <h2 className={`mt-2 text-4xl font-bold ${meta.color}`}>{result}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6B7B6B]">{meta.description}</p>
          </div>
          <div className="border-t border-[#6B7B6B]/15 p-6">
            <button
              className="w-full rounded-xl bg-[#1A2E1A] py-3.5 text-sm font-semibold text-[#F5F0E8] transition duration-150 hover:bg-[#0F1F0F]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F0F]/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#6B7B6B]/20 bg-[#F5F0E8] shadow-2xl">
        <div className="p-6 pb-0">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[#6B7B6B]">
              Risk assessment · {step + 1}/{totalSteps}
            </p>
            <button
              className="text-xs text-[#6B7B6B] underline underline-offset-4 transition hover:text-[#1A2E1A]"
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
                  i <= step ? 'bg-[#1A2E1A]' : 'bg-[#6B7B6B]/20'
                }`}
                key={i}
              />
            ))}
          </div>

          <h2 className="text-xl font-semibold leading-snug text-[#1A2E1A]">
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
                    ? 'border-[#1A2E1A] bg-[#1A2E1A] text-[#F5F0E8]'
                    : 'border-[#6B7B6B]/20 bg-white/60 text-[#1A2E1A] hover:border-[#1A2E1A]/30 hover:bg-white/80'
                }`}
                key={option.label}
                onClick={() => setSelected(option.score)}
                type="button"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p
                      className={`mt-0.5 text-sm ${isSelected ? 'text-[#F5F0E8]/60' : 'text-[#6B7B6B]'}`}
                    >
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-150 ${
                      isSelected
                        ? 'border-[#F5F0E8]/30 bg-[#F5F0E8]/15 text-[#F5F0E8]'
                        : 'border-[#6B7B6B]/30 bg-transparent'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="border-t border-[#6B7B6B]/15 p-6 pt-0">
          <button
            className="w-full rounded-xl bg-[#1A2E1A] py-3.5 text-sm font-semibold text-[#F5F0E8] transition duration-150 hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-40"
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
