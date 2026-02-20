"use client"

import { useEffect, useState, useRef } from "react"
import { Users } from "lucide-react"

interface GroupResultProps {
  groups: string[][]
  isShuffling: boolean
}

const GROUP_COLORS = [
  { bg: "bg-group-1/10", border: "border-group-1/30", badge: "bg-group-1", text: "text-group-1" },
  { bg: "bg-group-2/10", border: "border-group-2/30", badge: "bg-group-2", text: "text-group-2" },
  { bg: "bg-group-3/10", border: "border-group-3/30", badge: "bg-group-3", text: "text-group-3" },
  { bg: "bg-group-4/10", border: "border-group-4/30", badge: "bg-group-4", text: "text-group-4" },
  { bg: "bg-group-5/10", border: "border-group-5/30", badge: "bg-group-5", text: "text-group-5" },
  { bg: "bg-group-6/10", border: "border-group-6/30", badge: "bg-group-6", text: "text-group-6" },
]

export function GroupResult({ groups, isShuffling }: GroupResultProps) {
  const [displayGroups, setDisplayGroups] = useState<string[][]>(groups)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    if (!isShuffling) {
      setDisplayGroups(groups)
      
      // 소리 중지
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      return
    }

    // 릴 스핀 사운드 시작 - 깔끔한 전자음 버전
    audioContextRef.current = new AudioContext()
    const context = audioContextRef.current
    
    // 메인 톤
    oscillatorRef.current = context.createOscillator()
    gainNodeRef.current = context.createGain()
    
    oscillatorRef.current.connect(gainNodeRef.current)
    gainNodeRef.current.connect(context.destination)
    
    oscillatorRef.current.type = 'sine'
    oscillatorRef.current.frequency.value = 300
    gainNodeRef.current.gain.value = 0.15
    
    oscillatorRef.current.start()
    
    // 주파수를 빠르게 변경 - 릴 스핀 효과
    let baseFreq = 300
    const freqInterval = setInterval(() => {
      if (oscillatorRef.current) {
        baseFreq = 200 + Math.random() * 300
        oscillatorRef.current.frequency.setValueAtTime(baseFreq, context.currentTime)
      }
    }, 50)

    const flatNames = groups.flat()
    const groupSizes = groups.map((g) => g.length)

    const interval = setInterval(() => {
      const shuffled = [...flatNames]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      const newGroups: string[][] = []
      let idx = 0
      for (const size of groupSizes) {
        newGroups.push(shuffled.slice(idx, idx + size))
        idx += size
      }
      setDisplayGroups(newGroups)
    }, 150)

    return () => {
      clearInterval(interval)
      clearInterval(freqInterval)
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isShuffling, groups])

  if (displayGroups.length === 0) {
    return null
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {displayGroups.map((group, groupIdx) => {
        const color = GROUP_COLORS[groupIdx % GROUP_COLORS.length]
        return (
          <div
            key={groupIdx}
            className={`flex-shrink-0 min-w-[200px] rounded-xl border ${color.border} ${color.bg} p-4 transition-all duration-200 ${
              isShuffling ? "animate-pulse" : ""
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${color.badge}`}
                >
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className={`text-base font-semibold ${color.text}`}>
                  {groupIdx + 1}{"차"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {group.length}{"팀"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.map((name, nameIdx) => (
                  <span
                    key={`${name}-${nameIdx}`}
                    className="rounded-md bg-card px-3 py-2 text-sm text-card-foreground border border-border text-center"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
