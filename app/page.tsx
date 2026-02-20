"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NameInput } from "@/components/name-input"
import { OrderResult } from "@/components/order-result"
import { GroupResult } from "@/components/group-result"
import { Shuffle, Users, ListOrdered, RotateCcw, Copy, Check } from "lucide-react"

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Page() {
  const [names, setNames] = useState<string[]>([])
  const [mode, setMode] = useState<"order" | "group">("order")
  const [groupSize, setGroupSize] = useState<number>(4)
  const [groupSizes, setGroupSizes] = useState<string>("")

  const [shuffledOrder, setShuffledOrder] = useState<string[]>([])
  const [groups, setGroups] = useState<string[][]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
  }, [])

  const playSound = useCallback(() => {
    if (audioRef.current) {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        oscillator2.frequency.value = 1000
        oscillator2.type = 'sine'
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.5)
      }, 100)
    }
  }, [])

  const handleShuffle = useCallback(() => {
    if (names.length < 2) return
    setIsShuffling(true)
    setHasResult(false)

    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current)
    }

    if (mode === "order") {
      setShuffledOrder(names)
      shuffleTimeoutRef.current = setTimeout(() => {
        setShuffledOrder(shuffleArray(names))
        setIsShuffling(false)
        setHasResult(true)
        playSound()
      }, 1200)
    } else {
      // 사용자 정의 조별 인원수 파싱
      const customSizes = groupSizes
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && n > 0)

      let placeholderGroups: string[][] = []
      let totalGroups = 0

      if (customSizes.length > 0) {
        // 사용자 정의 조별 인원수 사용
        totalGroups = customSizes.length
        let idx = 0
        for (const size of customSizes) {
          if (idx >= names.length) break
          placeholderGroups.push(names.slice(idx, idx + size))
          idx += size
        }
      } else {
        // 기존 방식 (조당 인원수로 균등 분배)
        const size = Math.max(2, groupSize)
        totalGroups = Math.ceil(names.length / size)
        let idx = 0
        for (let i = 0; i < totalGroups; i++) {
          const remaining = names.length - idx
          const groupsLeft = totalGroups - i
          const currentSize = Math.ceil(remaining / groupsLeft)
          placeholderGroups.push(names.slice(idx, idx + currentSize))
          idx += currentSize
        }
      }
      setGroups(placeholderGroups)
      setShowGroupDialog(true)

      shuffleTimeoutRef.current = setTimeout(() => {
        const shuffled = shuffleArray(names)
        const result: string[][] = []

        if (customSizes.length > 0) {
          // 사용자 정의 조별 인원수 사용
          let sIdx = 0
          for (const size of customSizes) {
            if (sIdx >= shuffled.length) break
            result.push(shuffled.slice(sIdx, sIdx + size))
            sIdx += size
          }
        } else {
          // 기존 방식 (조당 인원수로 균등 분배)
          let sIdx = 0
          for (let i = 0; i < totalGroups; i++) {
            const remaining = shuffled.length - sIdx
            const groupsLeft = totalGroups - i
            const currentSize = Math.ceil(remaining / groupsLeft)
            result.push(shuffled.slice(sIdx, sIdx + currentSize))
            sIdx += currentSize
          }
        }
        setGroups(result)
        setIsShuffling(false)
        setHasResult(true)
        playSound()
      }, 2500)
    }
  }, [names, mode, groupSize, groupSizes, playSound])

  const handleReset = useCallback(() => {
    setShuffledOrder([])
    setGroups([])
    setHasResult(false)
    setIsShuffling(false)
    setShowGroupDialog(false)
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current)
    }
  }, [])

  const handleCopy = useCallback(() => {
    let text = ""
    if (mode === "order" && shuffledOrder.length > 0) {
      text = shuffledOrder.map((n, i) => `${i + 1}. ${n}`).join("\n")
    } else if (mode === "group" && groups.length > 0) {
      text = groups
        .map((g, i) => `${i + 1}조: ${g.join(", ")}`)
        .join("\n")
    }
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }, [mode, shuffledOrder, groups])

  const groupPreview =
    names.length > 0 && mode === "group"
      ? (() => {
          // 사용자 정의 조별 인원수가 있는 경우
          const customSizes = groupSizes
            .split(",")
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n) && n > 0)

          if (customSizes.length > 0) {
            const total = customSizes.reduce((sum, size) => sum + size, 0)
            return {
              sizes: customSizes,
              isCustom: true,
              total,
              hasExcess: total < names.length,
              hasShortage: total > names.length
            }
          }

          // 기존 방식
          const size = Math.max(2, groupSize)
          const totalGroups = Math.ceil(names.length / size)
          const sizes: number[] = []
          let remaining = names.length
          for (let i = 0; i < totalGroups; i++) {
            const groupsLeft = totalGroups - i
            const currentSize = Math.ceil(remaining / groupsLeft)
            sizes.push(currentSize)
            remaining -= currentSize
          }
          return {
            sizes,
            isCustom: false,
            total: names.length,
            hasExcess: false,
            hasShortage: false
          }
        })()
      : null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Shuffle className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            {"순서 뽑기"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {"이름을 입력하고 랜덤으로 순서를 정하거나 조를 나눠보세요"}
          </p>
        </header>

        {/* Input Card */}
        <Card className="mb-6 border-border bg-card shadow-sm">
          <CardContent className="p-5 md:p-6">
            <NameInput names={names} onNamesChange={setNames} />
          </CardContent>
        </Card>

        {/* Mode Tabs */}
        <Tabs
          defaultValue="order"
          onValueChange={(v) => {
            setMode(v as "order" | "group")
            handleReset()
          }}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="order" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              {"발표 순서"}
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" />
              {"조 나누기"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="mt-4">
            <p className="text-sm text-muted-foreground">
              {"입력된 이름을 랜덤으로 섞어 발표 순서를 정합니다."}
            </p>
          </TabsContent>

          <TabsContent value="group" className="mt-4">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  {/* 조별 인원수 직접 입력 */}
                  <div className="flex-1">
                    <label
                      htmlFor="group-sizes"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      {"조별 인원수 (쉼표로 구분)"}
                    </label>
                    <Input
                      id="group-sizes"
                      type="text"
                      placeholder="예: 9, 8, 7, 6"
                      value={groupSizes}
                      onChange={(e) => setGroupSizes(e.target.value)}
                      className="bg-card text-card-foreground border-border"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {"조별로 다른 인원수를 설정하려면 입력하세요. 비워두면 균등 분배됩니다."}
                    </p>
                  </div>

                  {/* 균등 분배 옵션 (조별 인원수가 비어있을 때만) */}
                  {!groupSizes.trim() && (
                    <div className="flex-1">
                      <label
                        htmlFor="group-size"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                      >
                        {"조당 인원 수 (균등 분배)"}
                      </label>
                      <Input
                        id="group-size"
                        type="number"
                        min={2}
                        max={names.length || 99}
                        value={groupSize}
                        onChange={(e) =>
                          setGroupSize(Math.max(2, parseInt(e.target.value) || 2))
                        }
                        className="bg-card text-card-foreground border-border"
                      />
                    </div>
                  )}

                  {/* 미리보기 */}
                  {groupPreview && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {groupPreview.sizes.length}{"개 조:"}
                        </span>
                        <span className="text-muted-foreground">
                          {groupPreview.sizes.join(", ")}{" 명"}
                        </span>
                      </div>
                      {groupPreview.isCustom && (
                        <div className="mt-2 text-xs">
                          {groupPreview.hasShortage && (
                            <span className="text-destructive">
                              ⚠️ 총 {groupPreview.total}명이 필요하지만 {names.length}명만 입력되었습니다
                            </span>
                          )}
                          {groupPreview.hasExcess && (
                            <span className="text-amber-600">
                              ⚠️ {names.length - groupPreview.total}명이 조에 배정되지 않습니다
                            </span>
                          )}
                          {!groupPreview.hasShortage && !groupPreview.hasExcess && (
                            <span className="text-green-600">
                              ✓ 총 {groupPreview.total}명 (전원 배정)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Button
            onClick={handleShuffle}
            disabled={names.length < 2 || isShuffling}
            className="flex-1 gap-2 h-12 text-base font-semibold"
            size="lg"
          >
            <Shuffle className={`h-5 w-5 ${isShuffling ? "animate-spin" : ""}`} />
            {isShuffling ? "섞는 중..." : "랜덤 뽑기"}
          </Button>
          {hasResult && (
            <>
              <Button
                onClick={handleShuffle}
                variant="outline"
                size="lg"
                className="h-12 gap-2"
                aria-label="다시 뽑기"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">{"다시"}</span>
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="lg"
                className="h-12 gap-2"
                aria-label="결과 복사"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-accent" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {copied ? "복사됨" : "복사"}
                </span>
              </Button>
            </>
          )}
        </div>

        {/* Results */}
        {mode === "order" && shuffledOrder.length > 0 && (
          <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardContent className="p-5 md:p-6">
              <OrderResult names={shuffledOrder} isShuffling={isShuffling} />
            </CardContent>
          </Card>
        )}

        {/* Group Result Dialog */}
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogContent 
            className="max-h-[85vh] overflow-hidden"
            style={{
              maxWidth: groups.length > 0 
                ? `min(95vw, ${Math.min(groups.length * 250 + 100, 1400)}px)` 
                : '600px',
              width: '100%'
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                {"조 편성 결과"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-x-auto">
              {groups.length > 0 && (
                <GroupResult groups={groups} isShuffling={isShuffling} />
              )}
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowGroupDialog(false)
                  handleShuffle()
                }}
                variant="outline"
                className="gap-2"
                disabled={isShuffling}
              >
                <RotateCcw className="h-4 w-4" />
                {"다시 뽑기"}
              </Button>
              <Button
                onClick={handleCopy}
                variant="default"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {"복사됨"}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {"결과 복사"}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {names.length < 2 && (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Shuffle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {"2명 이상의 이름을 입력하면 시작할 수 있습니다"}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
