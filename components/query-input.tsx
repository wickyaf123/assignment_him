'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const EXAMPLE_QUESTIONS = [
  'What are the penalties under Section 135 for CSR non-compliance and director liability?',
  'Compare the original Section 149 with changes made by the Amendment Act regarding independent directors',
  'Which chapters of the Companies Act have no corresponding Rules?',
  'What are the penalties for violating Section 185 and which Rules prescribe exceptions?',
  'List sections that impose personal liability on directors',
  'Which sections were decriminalized by the Amendment Act?',
]

interface QueryInputProps {
  onSubmit: (question: string) => void
  isLoading: boolean
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  function handleChipClick(question: string) {
    setValue(question)
    onSubmit(question)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Ask about any section, amendment, or rule in the Companies Act..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          aria-label="Legal question input"
        />
        <Button
          type="submit"
          disabled={isLoading || !value.trim()}
          style={{ backgroundColor: '#4F46E5', color: '#ffffff', minHeight: '44px' }}
          className="px-5 font-medium whitespace-nowrap"
        >
          Ask ViddhiAI
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-sm shrink-0"
          style={{ color: '#64748B' }}
        >
          Try an example:
        </span>
        {EXAMPLE_QUESTIONS.map((question) => (
          <Button
            key={question}
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleChipClick(question)}
            className="text-sm h-auto py-1.5 px-3 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}
