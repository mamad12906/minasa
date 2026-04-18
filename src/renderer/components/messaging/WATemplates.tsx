import React from 'react'
import { Button, Tag, message } from 'antd'

export interface WATemplate {
  name: string
  fields: string[]
  text: string
}

const STORAGE_KEY = 'minasa_wa_templates2'

export function loadTemplates(): WATemplate[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export function persistTemplates(list: WATemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

interface Props {
  templates: WATemplate[]
  includedFields: Set<string>
  extraText: string
  onChange: (list: WATemplate[]) => void
  onApply: (template: WATemplate) => void
}

/** Template manager: save current field selection + text as a template, apply or delete. */
export default function WATemplates({ templates, includedFields, extraText, onChange, onApply }: Props) {
  const saveTemplate = () => {
    const name = prompt('اسم القالب:')
    if (!name) return
    const updated = [...templates.filter(x => x.name !== name), { name, fields: [...includedFields], text: extraText }]
    persistTemplates(updated)
    onChange(updated)
    message.success('تم حفظ القالب')
  }

  const removeTemplate = (name: string) => {
    const updated = templates.filter(x => x.name !== name)
    persistTemplates(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <Button size="small" onClick={saveTemplate} style={{ borderRadius: 6 }}>حفظ كقالب</Button>
      {templates.map(t => (
        <Tag key={t.name} closable color="blue" style={{ cursor: 'pointer', fontSize: 11 }}
          onClick={() => onApply(t)}
          onClose={e => { e.preventDefault(); removeTemplate(t.name) }}>
          {t.name}
        </Tag>
      ))}
    </div>
  )
}
