'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getNodeColor } from '@/lib/graph-colors'
import type { GraphNode } from '@/components/graph-viewer'

interface NodePanelProps {
  node: GraphNode | null
  open: boolean
  onClose: () => void
  onExpand?: (node: GraphNode) => void
}

function truncate(value: string, max = 500): string {
  if (value.length <= max) return value
  return value.slice(0, max) + '...'
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return truncate(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return truncate(JSON.stringify(value))
}

export function NodePanel({ node, open, onClose, onExpand }: NodePanelProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[360px] sm:w-[400px] flex flex-col p-0 gap-0"
      >
        {/* Color accent bar */}
        <div
          className="h-1 w-full flex-none"
          style={{ backgroundColor: node ? getNodeColor(node.type) : '#4F46E5' }}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SheetHeader className="pb-4 text-left">
            <SheetTitle className="text-lg font-semibold text-slate-900 leading-snug">
              {node ? node.label : 'Node Properties'}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {node ? `${node.type} node` : 'Select a node to view details'}
            </SheetDescription>
          </SheetHeader>

          {node && (
            <>
              {onExpand && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mb-5"
                  onClick={() => onExpand(node)}
                >
                  Expand neighbors
                </Button>
              )}

              <dl className="space-y-4">
                <div>
                  <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">UID</dt>
                  <dd className="mt-0.5 text-sm text-slate-900 break-all font-mono">{node.id}</dd>
                </div>

                <div>
                  <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Type</dt>
                  <dd className="mt-0.5 flex items-center gap-2 text-sm text-slate-900">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getNodeColor(node.type) }}
                    />
                    {node.type}
                  </dd>
                </div>

                {node.connections !== undefined && node.connections > 0 && (
                  <div>
                    <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Connections</dt>
                    <dd className="mt-0.5 text-sm text-slate-900">{node.connections}</dd>
                  </div>
                )}

                {Object.entries(node.properties).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null
                  const formatted = formatValue(value)
                  if (!formatted) return null
                  return (
                    <div key={key}>
                      <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-0.5 text-sm text-slate-900 break-words whitespace-pre-wrap leading-relaxed">
                        {formatted}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
