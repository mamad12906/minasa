// Shared utilities used by the cards / split / table view renderers.
// Extracted from CustomerTable.tsx so the orchestrator stays focused on
// filtering + pagination state.

export function statusTone(s?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!s) return 'neutral'
  if (s.includes('نشط') || s.includes('مكتمل') || s.includes('تم')) return 'success'
  if (s.includes('انتظار') || s.includes('قيد') || s.includes('معلّق') || s.includes('معلق')) return 'warning'
  if (s.includes('منتهي') || s.includes('متأخر') || s.includes('ملغي') || s.includes('رفض')) return 'danger'
  return 'neutral'
}

export function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || '?'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

export function formatDate(d?: string): string {
  if (!d) return '-'
  return d.split('T')[0].split(' ')[0]
}
