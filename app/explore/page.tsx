'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { GraphViewer, type GraphNode, type GraphLink } from '@/components/graph-viewer'
import { NodePanel } from '@/components/node-panel'
import { ColorLegend } from '@/components/color-legend'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { postCypher } from '@/lib/api'

// ---- Cypher queries --------------------------------------------------------

function buildSubgraphQuery(uids: string[]): string {
  const safe = uids
    .map((u) => u.replace(/[^a-zA-Z0-9\-_.:/]/g, ''))
    .filter(Boolean)
    .map((u) => `'${u}'`)
    .join(', ')

  return `MATCH (n)-[r]-(m)
WHERE n.uid IN [${safe}]
RETURN n.uid AS source_uid, labels(n)[0] AS source_type,
       coalesce(n.title, n.term, n.label, '') AS source_label,
       n.number AS source_number, n.text AS source_text,
       type(r) AS rel_type,
       m.uid AS target_uid, labels(m)[0] AS target_type,
       coalesce(m.title, m.term, m.label, '') AS target_label,
       m.number AS target_number, m.text AS target_text
LIMIT 200`
}

const DEFAULT_QUERY = `MATCH (s:Section)-[r]-(child)
WHERE s.number IN [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
RETURN s.uid AS source_uid, 'Section' AS source_type,
       coalesce(s.title, '') AS source_label,
       s.number AS source_number, s.text AS source_text,
       type(r) AS rel_type,
       child.uid AS target_uid, labels(child)[0] AS target_type,
       coalesce(child.title, child.term, child.label, '') AS target_label,
       child.number AS target_number, child.text AS target_text
LIMIT 200`

const OVERVIEW_QUERY = `
// Act hierarchy: Act -> Chapter -> Section (+ a few SubSections)
MATCH (a:Act)-[:HAS_CHAPTER]->(ch:Chapter)-[:HAS_SECTION]->(s:Section)
WITH a, ch, s LIMIT 40
OPTIONAL MATCH (s)-[:HAS_SUBSECTION]->(ss:SubSection)
WITH a, ch, s, collect(ss)[0..2] AS subs
UNWIND ([{
  source_uid: a.uid, source_type: 'Act',
  source_label: coalesce(a.title, ''), source_number: null, source_text: a.text,
  rel_type: 'HAS_CHAPTER',
  target_uid: ch.uid, target_type: 'Chapter',
  target_label: coalesce(ch.title, ''), target_number: ch.number, target_text: ch.text
}, {
  source_uid: ch.uid, source_type: 'Chapter',
  source_label: coalesce(ch.title, ''), source_number: ch.number, source_text: ch.text,
  rel_type: 'HAS_SECTION',
  target_uid: s.uid, target_type: 'Section',
  target_label: coalesce(s.title, ''), target_number: s.number, target_text: s.text
}] + [x IN subs | {
  source_uid: s.uid, source_type: 'Section',
  source_label: coalesce(s.title, ''), source_number: s.number, source_text: s.text,
  rel_type: 'HAS_SUBSECTION',
  target_uid: x.uid, target_type: 'SubSection',
  target_label: coalesce(x.title, ''), target_number: x.number, target_text: x.text
}]) AS row
RETURN row.source_uid AS source_uid, row.source_type AS source_type,
       row.source_label AS source_label, row.source_number AS source_number,
       row.source_text AS source_text, row.rel_type AS rel_type,
       row.target_uid AS target_uid, row.target_type AS target_type,
       row.target_label AS target_label, row.target_number AS target_number,
       row.target_text AS target_text

UNION

// Amendment Act -> Act link + amendment relationships to Sections
MATCH (aa:AmendmentAct)-[r]->(target)
WHERE type(r) IN ['AMENDED_BY', 'SUBSTITUTES', 'INSERTS', 'OMITS', 'DECRIMINALIZES']
WITH aa, r, target LIMIT 20
RETURN aa.uid AS source_uid, 'AmendmentAct' AS source_type,
       coalesce(aa.title, '') AS source_label, null AS source_number, aa.text AS source_text,
       type(r) AS rel_type,
       target.uid AS target_uid, labels(target)[0] AS target_type,
       coalesce(target.title, target.term, '') AS target_label,
       target.number AS target_number, target.text AS target_text

UNION

// RuleSet -> Rules (+ a few Forms)
MATCH (rs:RuleSet)-[:HAS_RULE]->(ru:Rule)
WITH rs, ru LIMIT 15
OPTIONAL MATCH (ru)-[:HAS_FORM]->(f:Form)
WITH rs, ru, collect(f)[0..1] AS forms
UNWIND ([{
  source_uid: rs.uid, source_type: 'RuleSet',
  source_label: coalesce(rs.title, ''), source_number: null, source_text: rs.text,
  rel_type: 'HAS_RULE',
  target_uid: ru.uid, target_type: 'Rule',
  target_label: coalesce(ru.title, ''), target_number: ru.number, target_text: ru.text
}] + [x IN forms | {
  source_uid: ru.uid, source_type: 'Rule',
  source_label: coalesce(ru.title, ''), source_number: ru.number, source_text: ru.text,
  rel_type: 'HAS_FORM',
  target_uid: x.uid, target_type: 'Form',
  target_label: coalesce(x.title, ''), target_number: x.form_number, target_text: x.text
}]) AS row
RETURN row.source_uid AS source_uid, row.source_type AS source_type,
       row.source_label AS source_label, row.source_number AS source_number,
       row.source_text AS source_text, row.rel_type AS rel_type,
       row.target_uid AS target_uid, row.target_type AS target_type,
       row.target_label AS target_label, row.target_number AS target_number,
       row.target_text AS target_text`

function buildSectionQuery(sectionNumber: string): string {
  const safe = sectionNumber.replace(/[^a-zA-Z0-9\-_.]/g, '')
  const num = parseInt(safe, 10)
  const sectionFilter = isNaN(num) ? `'${safe}'` : String(num)
  return `MATCH (s:Section)-[r]-(m)
WHERE s.number = ${sectionFilter}
RETURN s.uid AS source_uid, 'Section' AS source_type,
       coalesce(s.title, '') AS source_label,
       s.number AS source_number, s.text AS source_text,
       type(r) AS rel_type,
       m.uid AS target_uid, labels(m)[0] AS target_type,
       coalesce(m.title, m.term, m.label, '') AS target_label,
       m.number AS target_number, m.text AS target_text
LIMIT 200`
}

function buildTextSearchQuery(text: string): string {
  const safe = text.replace(/'/g, "\\'").replace(/\\/g, '\\\\')
  return `MATCH (s:Section)
WHERE toLower(s.title) CONTAINS toLower('${safe}')
   OR toLower(s.text) CONTAINS toLower('${safe}')
WITH s LIMIT 5
MATCH (s)-[r]-(m)
RETURN s.uid AS source_uid, 'Section' AS source_type,
       coalesce(s.title, '') AS source_label,
       s.number AS source_number, s.text AS source_text,
       type(r) AS rel_type,
       m.uid AS target_uid, labels(m)[0] AS target_type,
       coalesce(m.title, m.term, m.label, '') AS target_label,
       m.number AS target_number, m.text AS target_text
LIMIT 150`
}

function buildNeighborQuery(uid: string): string {
  const safe = uid.replace(/[^a-zA-Z0-9\-_.:/]/g, '')
  return `MATCH (n {uid: '${safe}'})-[r]-(m)
RETURN n.uid AS source_uid, labels(n)[0] AS source_type,
       coalesce(n.title, n.term, n.label, '') AS source_label,
       n.number AS source_number, n.text AS source_text,
       type(r) AS rel_type,
       m.uid AS target_uid, labels(m)[0] AS target_type,
       coalesce(m.title, m.term, m.label, '') AS target_label,
       m.number AS target_number, m.text AS target_text
LIMIT 100`
}

// ---- Result transformation -------------------------------------------------

interface CypherRow {
  source_uid?: string
  source_type?: string
  source_label?: string
  source_number?: number | string
  source_text?: string
  rel_type?: string
  target_uid?: string
  target_type?: string
  target_label?: string
  target_number?: number | string
  target_text?: string
}

function makeDisplayLabel(type: string, label: string, number?: number | string, uid?: string): string {
  if (type === 'Act' && label) return label
  if (type === 'AmendmentAct' && label) return label
  if (type === 'RuleSet' && label) return label

  const numStr = number !== undefined && number !== null ? `${number}` : ''

  if (type === 'Section' && numStr) return `Section ${numStr}`
  if (type === 'SubSection' && numStr) return `Sub-section (${numStr})`
  if (type === 'Rule' && numStr) return `Rule ${numStr}`
  if (type === 'Form' && numStr) return `Form ${numStr}`
  if (type === 'Chapter' && numStr && numStr !== 'UNKNOWN') return `Chapter ${numStr}`

  if (label && label.length < 100) return label
  if (numStr) return `${type} ${numStr}`
  if (uid) return uid
  return type
}

function truncateText(text: string | undefined, max = 200): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function transformResults(
  rows: Record<string, unknown>[],
  existingNodes?: Map<string, GraphNode>,
  existingLinks?: GraphLink[],
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodeMap = new Map<string, GraphNode>(existingNodes ?? [])
  const linkSet = new Set<string>(
    (existingLinks ?? []).map((l) => `${l.source}|${l.target}|${l.type}`)
  )
  const links: GraphLink[] = [...(existingLinks ?? [])]

  for (const row of rows) {
    const r = row as CypherRow

    if (r.source_uid) {
      if (!nodeMap.has(r.source_uid)) {
        nodeMap.set(r.source_uid, {
          id: r.source_uid,
          type: r.source_type ?? 'Unknown',
          label: makeDisplayLabel(r.source_type ?? '', r.source_label ?? '', r.source_number, r.source_uid),
          properties: {
            ...(r.source_number !== undefined && r.source_number !== null ? { number: r.source_number } : {}),
            ...(r.source_text ? { text: truncateText(r.source_text) } : {}),
          },
          connections: 0,
        })
      }
      const n = nodeMap.get(r.source_uid)!
      n.connections = (n.connections ?? 0) + 1
    }

    if (r.target_uid) {
      if (!nodeMap.has(r.target_uid)) {
        nodeMap.set(r.target_uid, {
          id: r.target_uid,
          type: r.target_type ?? 'Unknown',
          label: makeDisplayLabel(r.target_type ?? '', r.target_label ?? '', r.target_number, r.target_uid),
          properties: {
            ...(r.target_number !== undefined && r.target_number !== null ? { number: r.target_number } : {}),
            ...(r.target_text ? { text: truncateText(r.target_text) } : {}),
          },
          connections: 0,
        })
      }
      const n = nodeMap.get(r.target_uid)!
      n.connections = (n.connections ?? 0) + 1
    }

    if (r.source_uid && r.target_uid && r.rel_type) {
      const key = `${r.source_uid}|${r.target_uid}|${r.rel_type}`
      if (!linkSet.has(key)) {
        linkSet.add(key)
        links.push({
          source: r.source_uid,
          target: r.target_uid,
          type: r.rel_type,
        })
      }
    }
  }

  return { nodes: Array.from(nodeMap.values()), links }
}

// ---- Inner component (uses useSearchParams) --------------------------------

function ExploreContent() {
  const searchParams = useSearchParams()
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const nodeMapRef = useRef<Map<string, GraphNode>>(new Map())
  const linksRef = useRef<GraphLink[]>([])

  const loadGraph = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const data = await postCypher(query)
      const { nodes: n, links: l } = transformResults(data.results)
      nodeMapRef.current = new Map(n.map((nd) => [nd.id, nd]))
      linksRef.current = l
      setNodes(n)
      setLinks(l)
    } catch (err) {
      console.error('Graph query failed:', err)
      setNodes([])
      setLinks([])
    } finally {
      setLoading(false)
    }
  }, [])

  const expandNode = useCallback(async (node: GraphNode) => {
    setExpanding(true)
    try {
      const data = await postCypher(buildNeighborQuery(node.id))
      const { nodes: n, links: l } = transformResults(
        data.results,
        nodeMapRef.current,
        linksRef.current,
      )
      nodeMapRef.current = new Map(n.map((nd) => [nd.id, nd]))
      linksRef.current = l
      setNodes(n)
      setLinks(l)
    } catch (err) {
      console.error('Expand failed:', err)
    } finally {
      setExpanding(false)
    }
  }, [])

  useEffect(() => {
    const rawUids = searchParams.get('uids')
    if (rawUids) {
      const uids = decodeURIComponent(rawUids).split(',').map((u) => u.trim()).filter(Boolean)
      if (uids.length > 0) {
        loadGraph(buildSubgraphQuery(uids))
        return
      }
    }
    loadGraph(DEFAULT_QUERY)
  }, [searchParams, loadGraph])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    setPanelOpen(true)
  }, [])

  const handleNodeDoubleClick = useCallback((node: GraphNode) => {
    expandNode(node)
  }, [expandNode])

  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) return
    const trimmed = searchInput.trim()
    const asNum = parseInt(trimmed, 10)
    if (!isNaN(asNum)) {
      loadGraph(buildSectionQuery(trimmed))
    } else {
      loadGraph(buildTextSearchQuery(trimmed))
    }
  }, [searchInput, loadGraph])

  const handleShowOverview = useCallback(() => {
    loadGraph(OVERVIEW_QUERY)
  }, [loadGraph])

  const handleResetDefault = useCallback(() => {
    loadGraph(DEFAULT_QUERY)
  }, [loadGraph])

  const isEmpty = !loading && nodes.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="flex-none border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900 flex-shrink-0">Graph Explorer</h1>

          <div className="h-4 w-px bg-slate-200" />

          <Button onClick={handleResetDefault} variant="ghost" size="sm" className="text-xs h-7">
            Sections 2-12
          </Button>
          <Button onClick={handleShowOverview} variant="ghost" size="sm" className="text-xs h-7">
            Act Overview
          </Button>

          {nodes.length > 0 && (
            <span className="text-xs text-slate-400">
              {nodes.length} nodes · {links.length} edges
              {expanding && ' · expanding...'}
            </span>
          )}

          <div className="flex-1" />

          <span className="text-xs text-slate-400 hidden md:inline">
            Double-click to expand
          </span>

          <Input
            className="w-[220px] h-7 text-xs"
            placeholder="Section # or keyword..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="outline" size="sm" className="h-7 text-xs">
            Search
          </Button>
        </div>
      </div>

      {/* Graph area — fills remaining viewport */}
      <div className="flex-1 relative min-h-0">
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-slate-50" />
        ) : isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <p className="text-slate-500 text-center max-w-sm text-sm">
              No graph data found. Try searching for a section number (e.g. &quot;2&quot;) or keyword (e.g. &quot;director&quot;).
            </p>
          </div>
        ) : (
          <>
            <GraphViewer
              nodes={nodes}
              links={links}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
            <ColorLegend />
          </>
        )}
      </div>

      <NodePanel
        node={selectedNode}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onExpand={(node) => expandNode(node)}
      />
    </div>
  )
}

// ---- Page export -----------------------------------------------------------

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-64px)] animate-pulse bg-slate-50" />}>
      <ExploreContent />
    </Suspense>
  )
}
