import {useEffect, useRef, useState} from 'react'
import {useBlocker} from 'react-router-dom'
import {Save, ShieldCheck, FileCheck2, Globe, Eye} from 'lucide-react'
import type {ContentModule, DataRecord} from '../domain/types'
import {fieldValues, getPath, validateFields} from '../domain/content'
import {useWorkspace} from '../state/Studio'
import {Fields} from './Fields'
import {Dialog, ImageView, Badge} from './ui'

export function RecordEditor({module, record, onClose}: {module: ContentModule; record?: DataRecord; onClose: () => void}) {
  const {api, mutate, contract} = useWorkspace()
  const initial = fieldValues(record ?? module.defaults ?? {}, module.fields)
  const [values, setValues] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const allowLeave = useRef(false)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const blocker = useBlocker(() => dirty && !allowLeave.current)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Ada perubahan yang belum disimpan. Tinggalkan editor?')) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {if (dirty && !allowLeave.current) {event.preventDefault(); event.returnValue = ''}}
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
  const imageField = module.fields.find(field => field.type === 'images' || field.type === 'image')
  const imageValue = imageField ? values[imageField.path] : undefined
  const image = Array.isArray(imageValue) ? String(imageValue[0] ?? '') : typeof imageValue === 'string' ? imageValue : ''
  const titleValue = String(values[module.titlePath] || getPath(record, module.titlePath) || module.singular + ' baru')
  const toggle = module.fields.find(field => field.type === 'toggle')
  async function save() {
    setError('')
    try {validateFields(values, module.fields, record ? initial : undefined)} catch (cause) {setError(cause instanceof Error ? cause.message : 'Periksa kembali konten Anda.'); return}
    setBusy(true)
    const success = await mutate(() => api.saveRecord(contract.id, module.id, record && module.collection ? String(record.id) : null, values), 'Draft ' + module.singular.toLowerCase() + ' berhasil disimpan.')
    setBusy(false)
    if (success) {allowLeave.current = true; onClose()}
  }
  return <Dialog wide title={(module.collection ? record ? 'Edit ' : 'Tambah ' : 'Edit ') + module.singular.toLowerCase()} onClose={() => {if (!busy) onClose()}} footer={<><span className="editor-footer-note"><ShieldCheck size={15}/>Disimpan sebagai draft demo</span><button className="button secondary" disabled={busy} onClick={onClose}>Batal</button><button className="button primary" onClick={save} disabled={busy}><Save size={16}/>{busy ? 'Menyimpan…' : 'Simpan draft'}</button></>}>
    <div className="editor-layout"><div><div className="editor-section-title"><FileCheck2 size={18}/><div><strong>Detail konten</strong><p>Lengkapi informasi yang akan tampil di website.</p></div><Badge tone="blue">{module.fields.length} field</Badge></div><Fields fields={module.fields} values={values} onChange={setValues}/>{error && <div className="form-error error-box" role="alert">{error}</div>}</div><aside className="editor-aside">
      <div className="editor-preview-label"><Eye size={15}/>PREVIEW KONTEN</div><div className="editor-preview-card">{imageField && <ImageView src={image} alt={titleValue}/>}<div><small>{contract.name}</small><h3>{titleValue}</h3><p>{String(values[module.subtitlePath ?? ''] ?? 'Konten Anda akan tampil mengikuti layout website.')}</p></div></div>
      <div className="editor-status"><h4><Globe size={16}/>Visibilitas konten</h4>{toggle ? <label className="toggle-label"><span><strong>Tampilkan di website</strong><small>Berlaku setelah dipublikasikan.</small></span><input type="checkbox" className="switch" checked={values[toggle.path] === true} onChange={event => setValues({...values, [toggle.path]: event.target.checked})}/></label> : <p>Konten ini merupakan bagian tetap dari halaman website.</p>}</div>
      <div className="contract-note"><ShieldCheck size={17}/><div><strong>Sesuai kontrak editor</strong><p>Field mengikuti kontrak versi {contract.contractVersion}. Struktur dan layout website tetap dikelola Digvation.</p></div></div>
    </aside></div>
  </Dialog>
}
