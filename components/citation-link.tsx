'use client'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { Citation } from '@/types/api'

interface CitationRendererProps {
  answer: string
  citations: Citation[]
  onHoverCitation?: (index: number | null) => void
}

function CitationPill({
  citation,
  onClick,
  onHoverCitation,
}: {
  citation: Citation
  onClick: (uid: string) => void
  onHoverCitation?: (index: number | null) => void
}) {
  return (
    <span className="relative inline-block group">
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full cursor-pointer align-super ml-0.5 transition-colors"
        style={{
          backgroundColor: '#EEF2FF',
          color: '#4F46E5',
          lineHeight: '1',
        }}
        onClick={() => onClick(citation.uid)}
        onMouseEnter={() => onHoverCitation?.(citation.index)}
        onMouseLeave={() => onHoverCitation?.(null)}
        aria-label={`Citation ${citation.index}: ${citation.uid}`}
      >
        {citation.index}
      </button>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-xs hidden group-hover:block z-50 whitespace-nowrap max-w-xs"
        style={{ backgroundColor: '#1E293B', color: '#F8FAFC' }}
      >
        <span className="font-semibold">{citation.type}</span> · {citation.uid}
        {citation.text_excerpt && (
          <>
            <br />
            <span className="text-[11px] opacity-80">
              {citation.text_excerpt.length > 100
                ? citation.text_excerpt.slice(0, 100) + '...'
                : citation.text_excerpt}
            </span>
          </>
        )}
      </span>
    </span>
  )
}

const CITATION_RE = /\[([a-z][\w-]*)\]/

function injectCitations(
  text: string,
  citationMap: Map<string, Citation>,
  onClick: (uid: string) => void,
  onHoverCitation?: (index: number | null) => void,
): React.ReactNode[] {
  const parts = text.split(/(\[[a-z][\w-]*\])/)
  return parts.map((part, i) => {
    const match = part.match(CITATION_RE)
    if (match) {
      const citation = citationMap.get(match[1])
      if (citation) {
        return (
          <CitationPill
            key={i}
            citation={citation}
            onClick={onClick}
            onHoverCitation={onHoverCitation}
          />
        )
      }
    }
    return <span key={i}>{part}</span>
  })
}

export function CitationRenderer({ answer, citations, onHoverCitation }: CitationRendererProps) {
  const router = useRouter()

  const citationMap = new Map<string, Citation>()
  for (const c of citations) {
    citationMap.set(c.marker, c)
  }

  function handleCitationClick(uid: string) {
    router.push(`/explore?uids=${encodeURIComponent(uid)}`)
  }

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mt-5 mb-3 first:mt-0" style={{ color: '#0F172A' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0" style={{ color: '#0F172A' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold mt-3 mb-2 first:mt-0" style={{ color: '#0F172A' }}>
        {children}
      </h3>
    ),
    p: ({ children }) => {
      const text = extractText(children)
      if (CITATION_RE.test(text)) {
        return (
          <p className="mb-3 last:mb-0 leading-relaxed" style={{ color: '#0F172A' }}>
            {injectCitations(text, citationMap, handleCitationClick, onHoverCitation)}
          </p>
        )
      }
      return (
        <p className="mb-3 last:mb-0 leading-relaxed" style={{ color: '#0F172A' }}>
          {children}
        </p>
      )
    },
    strong: ({ children }) => (
      <strong className="font-semibold" style={{ color: '#0F172A' }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic" style={{ color: '#334155' }}>{children}</em>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 last:mb-0 ml-1 space-y-1.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 last:mb-0 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => {
      const text = extractText(children)
      const inner = CITATION_RE.test(text)
        ? injectCitations(text, citationMap, handleCitationClick, onHoverCitation)
        : children
      return (
        <li className="flex items-start gap-2 text-[15px] leading-relaxed" style={{ color: '#1E293B' }}>
          <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: '#4F46E5' }} />
          <span className="flex-1">{inner}</span>
        </li>
      )
    },
    blockquote: ({ children }) => (
      <blockquote
        className="mb-3 last:mb-0 pl-4 py-1 rounded-r-md"
        style={{ borderLeft: '3px solid #4F46E5', backgroundColor: '#F8FAFC', color: '#334155' }}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      if (className?.includes('language-')) {
        return <code className="text-sm" style={{ color: '#0F172A' }}>{children}</code>
      }
      return (
        <code
          className="px-1.5 py-0.5 rounded text-sm font-mono"
          style={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontSize: '0.875em' }}
        >
          {children}
        </code>
      )
    },
    pre: ({ children }) => (
      <pre
        className="mb-3 last:mb-0 rounded-lg p-3.5 overflow-x-auto"
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mb-3 last:mb-0 overflow-x-auto rounded-lg" style={{ border: '1px solid #E2E8F0' }}>
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead style={{ backgroundColor: '#F8FAFC' }}>{children}</thead>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-sm" style={{ color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>
        {children}
      </td>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-1 underline-offset-2 hover:decoration-2"
        style={{ color: '#4F46E5' }}
      >
        {children}
      </a>
    ),
  }

  return (
    <div className="viddhiai-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {answer}
      </ReactMarkdown>
    </div>
  )
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ''
}
