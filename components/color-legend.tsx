'use client'

import { NODE_COLORS } from '@/lib/graph-colors'

export function ColorLegend() {
  return (
    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 p-2.5 pointer-events-none">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Node Types</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] text-slate-600">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
