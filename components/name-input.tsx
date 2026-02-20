"use client"

import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface NameInputProps {
  names: string[]
  onNamesChange: (names: string[]) => void
}

export function NameInput({ names, onNamesChange }: NameInputProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.trim() === "") {
      onNamesChange([])
      return
    }
    const parsed = value
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
    onNamesChange(parsed)
  }

  const removeName = (index: number) => {
    onNamesChange(names.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="name-input"
        className="text-sm font-medium text-foreground"
      >
        {"참가자 이름"}
      </label>
      <Textarea
        id="name-input"
        placeholder={"이름을 쉼표(,)로 구분하여 입력하세요\n예: 김철수, 이영희, 박민수, 최수진"}
        className="min-h-[100px] resize-none bg-card text-card-foreground border-border placeholder:text-muted-foreground focus:ring-primary"
        onChange={handleTextChange}
        defaultValue={names.join(", ")}
      />
      {names.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {names.map((name, i) => (
            <Badge
              key={`${name}-${i}`}
              variant="secondary"
              className="gap-1 py-1 px-2.5 text-sm font-normal"
            >
              {name}
              <button
                type="button"
                onClick={() => removeName(i)}
                className="ml-0.5 hover:text-destructive transition-colors"
                aria-label={`${name} 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground self-center">
            {"총 "}{names.length}{"명"}
          </span>
        </div>
      )}
    </div>
  )
}
