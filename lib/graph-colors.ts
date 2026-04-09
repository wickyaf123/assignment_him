export const NODE_COLORS: Record<string, string> = {
  Act:          '#1E40AF',
  Chapter:      '#3B82F6',
  Section:      '#6366F1',
  SubSection:   '#8B5CF6',
  Clause:       '#A855F7',
  SubClause:    '#D946EF',
  Proviso:      '#EC4899',
  Explanation:  '#14B8A6',
  Definition:   '#06B6D4',
  Rule:         '#0EA5E9',
  RuleSet:      '#10B981',
  Schedule:     '#84CC16',
  Form:         '#EAB308',
  AmendmentAct: '#F97316',
}

export const FALLBACK_COLOR = '#94A3B8'

export function getNodeColor(type: string): string {
  return NODE_COLORS[type] ?? FALLBACK_COLOR
}
