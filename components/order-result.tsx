"use client"

import { useEffect, useState } from "react"

interface OrderResultProps {
  names: string[]
  isShuffling: boolean
}

export function OrderResult({ names, isShuffling }: OrderResultProps) {
  const [displayNames, setDisplayNames] = useState<string[]>(names)

  useEffect(() => {
    if (!isShuffling) {
      setDisplayNames(names)
      return
    }

    const interval = setInterval(() => {
      setDisplayNames((prev) => {
        const copy = [...prev]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
      })
    }, 80)

    return () => clearInterval(interval)
  }, [isShuffling, names])

  if (displayNames.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">
        {"발표 순서"}
      </h3>
      <div className="flex flex-col gap-2">
        {displayNames.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 ${
              isShuffling ? "animate-pulse" : "hover:border-primary/40"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {i + 1}
            </div>
            <span className="text-sm font-medium text-card-foreground">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
