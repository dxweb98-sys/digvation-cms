import {useRef, useState} from 'react'
import {ImagePlus, Link2, Plus, Trash2, Bold, Italic, List, Eye, Code2, Check} from 'lucide-react'
import DOMPurify from 'dompurify'
import type {Field, Json, FieldValues, DataRecord} from '../domain/types'
import {useWorkspace} from '../state/Studio'
import {imageUrl} from '../domain/content'
import {ImageView} from './ui'

function Specs({value, onChange}: {value: Json; onChange: (value: Json) => void}) {
  const [key, setKey] = useState(''); const [entry, setEntry] = useState('')
  const entries = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const duplicate = Object.hasOwn(entries, key.trim())
  return <div className="spec-editor">{Object.entries(entries).map(([name, item]) => <div className="spec-row" key={name}><span>{name}</span><input aria-label={'Nilai ' + name} value={String(item)} onChange={event => onChange({...entries, [name]: event.target.value})}/><button type="button" className="icon-button danger-text" aria-label={'Hapus spesifikasi ' + name} onClick={() => onChange(Object.fromEntries(Object.entries(entries).filter(([k]) => k !== name)))}><Trash2 size={15}/></button></div>)}<div className="spec-row spec-add"><input aria-label="Nama spesifikasi baru" placeholder="Nama parameter" value={key} onChange={event => setKey(event.target.value)}/><input aria-label="Nilai spesifikasi baru" placeholder="Nilai" value={entry} onChange={event => setEntry(event.target.value)}/><button type="button" className="icon-button" disabled={!key.trim() || duplicate || ['__proto__', 'constructor', 'prototype'].includes(key.trim())} aria-label="Tambah spesifikasi" onClick={() => {onChange({...entries, [key.trim()]: entry}); setKey(''); setEntry('')}}><Plus size={17}/></button></div>{duplicate && <small className="form-error">Nama parameter ini sudah dipakai.</small>}</div>
}

function ImageInput({field, value, onChange}: {field: Field; value: Json; onChange: (value: Json) => void}) {
  const {site} = useWorkspace()
  const [url, setUrl] = useState(''); const [picker, setPicker] = useState(false); const [error, setError] = useState('')
  const multiple = field.type === 'images'
  const images = multiple && Array.isArray(value) ? value.map(String) : typeof value === 'string' && value ? [value] : []
  function choose(src: string) {
    if (!imageUrl(src)) {setError('Gunakan URL http/https atau pilih dari pustaka media.'); return}
    onChange(multiple ? [...images.filter(image => image !== src), src] : src)
    setPicker(false); setUrl(''); setError('')
  }
  return <div className="image-input">{images.length > 0 && <div className="field-image-list">{images.map((src, index) => <div className="field-image" key={src + index}><ImageView src={src} alt={field.label + ' ' + (index + 1)}/><button type="button" aria-label={'Hapus gambar ' + (index + 1)} onClick={() => onChange(multiple ? images.filter((_, i) => i !== index) : '')}><Trash2 size={13}/></button>{index === 0 && <span>Utama</span>}</div>)}</div>}
    <div className="image-input-actions"><button type="button" className="button secondary small" onClick={() => setPicker(!picker)}><ImagePlus size={15}/>Pilih dari media</button><div className="image-url"><Link2 size={15}/><input id={field.path} value={url} placeholder="Tempel URL gambar…" onChange={event => setUrl(event.target.value)} onKeyDown={event => {if (event.key === 'Enter') {event.preventDefault(); if (url) choose(url)}}}/><button type="button" onClick={() => choose(url)} disabled={!url} aria-label={'Tambahkan URL ' + field.label}><Plus size={17}/></button></div></div>
    {error && <small className="form-error">{error}</small>}
    {picker && <div className="inline-media"><div className="inline-media-heading"><strong>Pilih media website ini</strong><button type="button" className="text-button" onClick={() => setPicker(false)}>Tutup</button></div><div className="inline-media-grid">{site.media.map(asset => <button type="button" key={asset.id} onClick={() => choose(asset.url)} title={asset.name}><ImageView src={asset.url} alt={asset.name}/>{images.includes(asset.url) && <span><Check size={12}/></span>}</button>)}</div>{!site.media.length && <p className="muted">Unggah media melalui halaman Pustaka media.</p>}</div>}
  </div>
}

function RichText({field, value, onChange}: {field: Field; value: Json; onChange: (value: Json) => void}) {
  const [preview, setPreview] = useState(false); const ref = useRef<HTMLTextAreaElement>(null)
  function wrap(open: string, close: string) {
    const area = ref.current; const text = String(value ?? ''); const a = area?.selectionStart ?? text.length; const b = area?.selectionEnd ?? a
    onChange(text.slice(0, a) + open + (text.slice(a, b) || 'Teks Anda') + close + text.slice(b))
    requestAnimationFrame(() => area?.focus())
  }
  return <div className="rich-editor"><div className="rich-toolbar"><div><button type="button" title="Tebal" aria-label="Format tebal" onClick={() => wrap('<strong>', '</strong>')}><Bold size={16}/></button><button type="button" title="Miring" aria-label="Format miring" onClick={() => wrap('<em>', '</em>')}><Italic size={16}/></button><button type="button" title="Daftar" aria-label="Format daftar" onClick={() => wrap('<ul><li>', '</li></ul>')}><List size={17}/></button></div><button type="button" onClick={() => setPreview(!preview)}>{preview ? <Code2 size={15}/> : <Eye size={15}/>} {preview ? 'Editor' : 'Preview'}</button></div>{preview ? <div className="prose rich-preview" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(String(value ?? ''))}}/> : <textarea id={field.path} ref={ref} rows={10} value={String(value ?? '')} onChange={event => onChange(event.target.value)} placeholder="Tuliskan cerita Anda…"/>}</div>
}

export function Fields({fields, values, onChange}: {fields: Field[]; values: FieldValues; onChange: (values: FieldValues) => void}) {
  const {site} = useWorkspace()
  return <div className="fields-grid">{fields.filter(field => field.type !== 'toggle').map(field => {
    const value = values[field.path] ?? ''
    const change = (next: Json) => {
      const updated = {...values, [field.path]: next}
      if (field.path === 'categoryId') {
        const categories = site.documents.products?.categories as DataRecord[] ?? []
        const category = categories.find(item => item.id === next)
        updated.subcategoryId = (category?.subcategories as DataRecord[] | undefined)?.[0]?.id ?? ''
      }
      onChange(updated)
    }
    let options = field.options ?? []
    if (field.optionsPath) {
      const categories = site.documents.products?.categories as DataRecord[] ?? []
      const rows = field.optionsPath.endsWith('subcategories') ? (categories.find(item => item.id === values.categoryId)?.subcategories as DataRecord[] | undefined) ?? [] : categories
      options = rows.map(item => ({value: String(item.id), label: String(item.name)}))
    }
    return <div className={'field-group ' + (['textarea', 'richtext', 'images', 'image', 'specs', 'tags'].includes(field.type) ? 'full-width' : '')} key={field.path}>
      <label className="field-label" htmlFor={field.path}>{field.label}{field.required && <span className="required-dot">*</span>}</label>
      {field.type === 'text' && <input id={field.path} value={String(value)} placeholder={field.placeholder || field.label} onChange={event => change(event.target.value)}/>}
      {field.type === 'number' && <input id={field.path} type="number" value={typeof value === 'number' ? value : ''} onChange={event => change(event.target.value === '' ? '' : Number(event.target.value))}/>}
      {field.type === 'textarea' && <textarea id={field.path} rows={4} value={String(value)} onChange={event => change(event.target.value)} placeholder={field.placeholder || 'Tuliskan ' + field.label.toLowerCase() + '…'}/>}
      {field.type === 'tags' && <textarea id={field.path} rows={3} defaultValue={Array.isArray(value) ? value.join('\n') : ''} onChange={event => change(event.target.value.split('\n').filter(item => item.trim()))} placeholder="Satu entri per baris"/>}
      {field.type === 'select' && <select id={field.path} value={String(value)} onChange={event => change(event.target.value)}><option value="">Pilih {field.label.toLowerCase()}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
      {['images', 'image'].includes(field.type) && <ImageInput field={field} value={value} onChange={change}/>}
      {field.type === 'specs' && <Specs value={value} onChange={change}/>}
      {field.type === 'richtext' && <RichText field={field} value={value} onChange={change}/>}
      {field.hint && <small className="field-hint">{field.hint}</small>}
    </div>
  })}</div>
}
