'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Query', href: '/' },
  { label: 'Graph Explorer', href: '/explore' },
  { label: 'Schema', href: '/schema' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="h-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <span className="text-[28px] font-semibold text-slate-900">ViddhiAI</span>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#4F46E5' : '#64748B',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                  paddingBottom: '2px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  transition: 'color 0.15s ease',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
