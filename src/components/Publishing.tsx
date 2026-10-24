import {useState} from 'react'
import {Rocket, CheckCircle2, FileStack, ArrowUpRight, Monitor} from 'lucide-react'
import {useWorkspace} from '../state/Studio'
import {getPath, records, labelOf} from '../domain/content'
import {Dialog, Badge, ImageView} from './ui'

export function PublishDialog({onClose}: {onClose: () => void}) {
  const {contract, site, api, mutate} = useWorkspace(); const [busy, setBusy] = useState(false)
  return <Dialog title="Siap membagikan cerita baru?" onClose={() => {if (!busy) onClose()}} footer={<><button className="button secondary" disabled={busy} onClick={onClose}>Tinjau lagi</button><button className="button primary" disabled={busy} onClick={async () => {setBusy(true); const success = await mutate(() => api.publish(contract.id), 'Versi demo berhasil dipublikasikan.'); setBusy(false); if (success) onClose()}}><Rocket size={16}/>{busy ? 'Menyiapkan versi…' : 'Publikasikan demo'}</button></>}>
    <div className="publish-art"><div><Rocket size={30}/></div><span/><span/></div><p className="publish-description">Perubahan untuk <strong>{contract.name}</strong> akan disatukan dalam satu versi baru.</p><div className="publish-facts"><div><FileStack size={19}/><span>Perubahan draft</span><strong>{site.changes.length}</strong></div><div><CheckCircle2 size={19}/><span>Kontrak editor</span><strong>Versi {contract.contractVersion}</strong></div></div><div className="notice"><Monitor size={18}/><p><strong>Ini publikasi demo.</strong> Versi disimpan di browser ini. Website live dan file R2 tidak diubah.</p></div>
  </Dialog>
}
export function PreviewDialog({onClose}: {onClose: () => void}) {
  const {contract, site} = useWorkspace()
  const featured = contract.modules.find(module => module.collection)
  return <Dialog title="Pratinjau konten" wide onClose={onClose} footer={<><span className="muted">Preview isi draft, mengikuti kontrak website.</span>{contract.url && <a className="button secondary" href={contract.url} target="_blank" rel="noreferrer">Buka website live<ArrowUpRight size={15}/></a>}<button className="button primary" onClick={onClose}>Kembali ke studio</button></>}>
    <div className="preview-browser"><div className="preview-browser-bar"><div><i/><i/><i/></div><span>{contract.domain}</span><Badge tone="amber">Draft demo</Badge></div><div className="preview-cover"><span className="eyebrow">{contract.industry}</span><h2>{contract.name}</h2><p>{contract.description}</p></div><div className="preview-content">{featured && <><h3>{featured.label}</h3><div className="preview-grid">{records(site.documents, featured).filter(record => record.visible !== false).slice(0, 3).map(record => <div key={String(record.id)}><ImageView src={String(getPath(record, featured.imagePath ?? '') ?? '')} alt={labelOf(record, featured)}/><h4>{labelOf(record, featured)}</h4><p>{String(getPath(record, featured.subtitlePath ?? '') ?? '')}</p></div>)}</div>{!records(site.documents, featured).length && <p className="muted">Konten pertama Anda akan terlihat di sini.</p>}</>}<div className="preview-sections">{contract.modules.filter(module => !module.collection).map(module => <div key={module.id}><span>{module.label}</span><p>{module.fields.slice(0, 2).map(field => {const value = getPath(site.documents[module.document], field.path); return Array.isArray(value) ? value.join(' ') : String(value ?? '')}).join(' · ')}</p></div>)}</div></div></div>
  </Dialog>
}
