import type {DataRecord, Json, ContentModule, FieldValues, Field, Documents, WebsiteState} from './types.ts'

const unsafe = new Set(['__proto__', 'prototype', 'constructor'])
export function getPath(value: unknown, path: string): Json | undefined {
  return path.split('.').reduce<unknown>((current, key) => {
    if (unsafe.has(key) || current === null || typeof current !== 'object') return undefined
    return Object.hasOwn(current, key) ? (current as Record<string, unknown>)[key] : undefined
  }, value) as Json | undefined
}
export function setPath(target: DataRecord, path: string, value: Json) {
  const keys = path.split('.')
  if (keys.some(key => !key || unsafe.has(key))) throw new Error('Field tidak terdaftar.')
  let current = target
  for (const key of keys.slice(0, -1)) {
    if (current[key] === null || typeof current[key] !== 'object' || Array.isArray(current[key])) current[key] = {}
    current = current[key] as DataRecord
  }
  current[keys[keys.length - 1]] = structuredClone(value)
}
export function records(documents: Documents, module: ContentModule): DataRecord[] {
  const document = documents[module.document] ?? {}
  if (!module.collection) return [document]
  const value = getPath(document, module.collection)
  return Array.isArray(value) ? value.filter(item => item !== null && typeof item === 'object' && !Array.isArray(item)) as DataRecord[] : []
}
export function fieldValues(record: DataRecord, fields: Field[]): FieldValues {
  return Object.fromEntries(fields.map(field => [field.path, getPath(record, field.path) ?? (['images', 'tags'].includes(field.type) ? [] : field.type === 'specs' ? {} : field.type === 'toggle' ? true : '')]))
}
export function labelOf(record: DataRecord, module: ContentModule) {
  return String(getPath(record, module.titlePath) || module.singular)
}
export function imageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value)) return value.length < 3_000_000
  if (value.startsWith('/demo/') && !value.includes('..')) return true
  try {return ['https:', 'http:'].includes(new URL(value).protocol)} catch {return false}
}
export function recordPublication(site: Pick<WebsiteState, 'documents' | 'publishedDocuments'>, module: ContentModule, record: DataRecord): 'draft' | 'hidden' | 'published' {
  const published = records(site.publishedDocuments, module).find(item => !module.collection || String(item.id) === String(record.id))
  if (!published || JSON.stringify(published) !== JSON.stringify(record)) return 'draft'
  return record.visible === false ? 'hidden' : 'published'
}
export const publicationLabels = {draft: 'Draft belum dipublikasikan', hidden: 'Disembunyikan', published: 'Versi aktif demo'}
export function validateFields(values: FieldValues, fields: Field[], unchanged?: FieldValues) {
  for (const key of Object.keys(values)) if (!fields.some(field => field.path === key)) throw new Error('Field tidak terdaftar dalam kontrak: ' + key)
  for (const field of fields) {
    const value = values[field.path]
    // Existing source values may predate the editor contract. Preserve untouched
    // values, while every new/changed value must satisfy the current contract.
    if (unchanged && Object.hasOwn(unchanged, field.path) && JSON.stringify(value) === JSON.stringify(unchanged[field.path])) continue
    const empty = value === null || value === undefined || value === '' || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length)
    if (field.required && empty) throw new Error(field.label + ' wajib diisi.')
    if (empty && !Array.isArray(value)) continue
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(field.label + ' harus berupa angka.')
    if (field.type === 'toggle' && typeof value !== 'boolean') throw new Error(field.label + ' tidak valid.')
    if (field.type === 'image' && !imageUrl(value)) throw new Error('URL gambar tidak valid.')
    if (field.type === 'images' && (!Array.isArray(value) || value.some(item => !imageUrl(item)))) throw new Error('Daftar gambar tidak valid.')
    if (field.type === 'tags' && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) throw new Error(field.label + ' tidak valid.')
    if (field.type === 'specs' && (typeof value !== 'object' || Array.isArray(value) || value === null || Object.entries(value).some(([key, item]) => unsafe.has(key) || !key.trim() || !['string', 'number'].includes(typeof item)))) throw new Error('Spesifikasi tidak valid.')
    if (['text', 'textarea', 'richtext', 'select'].includes(field.type) && (typeof value !== 'string' || value.length > 100000)) throw new Error(field.label + ' tidak valid.')
    if (field.options && !field.options.some(option => option.value === value)) throw new Error(field.label + ' tidak sesuai pilihan kontrak.')
  }
}
