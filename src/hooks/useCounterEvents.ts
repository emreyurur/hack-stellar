import { useEffect, useRef, useState } from 'react'
import { callCounterGet } from '../services/counterContract'

export type CounterSnapshot = {
  value: number
  timestamp: Date
}

/**
 * Polls the on-chain counter value every POLL_INTERVAL_MS milliseconds,
 * recording each observed change as a snapshot for live event streaming.
 */
const POLL_INTERVAL_MS = 5_000

export function useCounterEvents() {
  const [snapshots, setSnapshots] = useState<CounterSnapshot[]>([])
  const [currentValue, setCurrentValue] = useState<number | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const lastValueRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    setIsPolling(true)

    async function poll() {
      try {
        const value = await callCounterGet()
        if (!active) return

        setCurrentValue(value)

        // Only record a snapshot when the value actually changed
        if (lastValueRef.current !== value) {
          lastValueRef.current = value
          setSnapshots((prev) => [
            { value, timestamp: new Date() },
            ...prev.slice(0, 9), // keep last 10 snapshots
          ])
        }
      } catch {
        // ignore transient RPC errors
      }
    }

    poll() // run immediately on mount
    const interval = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      active = false
      setIsPolling(false)
      clearInterval(interval)
    }
  }, [])

  return { snapshots, currentValue, isPolling }
}
