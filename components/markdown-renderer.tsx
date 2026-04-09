'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
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
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed" style={{ color: '#0F172A' }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: '#0F172A' }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic" style={{ color: '#334155' }}>
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 last:mb-0 ml-1 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 last:mb-0 ml-1 space-y-1.5 list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[15px] leading-relaxed" style={{ color: '#1E293B' }}>
      <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: '#4F46E5' }} />
      <span className="flex-1">{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="mb-3 last:mb-0 pl-4 py-1 rounded-r-md"
      style={{
        borderLeft: '3px solid #4F46E5',
        backgroundColor: '#F8FAFC',
        color: '#334155',
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="text-sm" style={{ color: '#0F172A' }}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded text-sm font-mono"
        style={{
          backgroundColor: '#EEF2FF',
          color: '#4338CA',
          fontSize: '0.875em',
        }}
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
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ backgroundColor: '#F8FAFC' }}>
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider"
      style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0' }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="px-3 py-2 text-sm"
      style={{ color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr className="my-4" style={{ borderColor: '#E2E8F0' }} />
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-1 underline-offset-2 transition-colors hover:decoration-2"
      style={{ color: '#4F46E5' }}
    >
      {children}
    </a>
  ),
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`viddhiai-prose ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
