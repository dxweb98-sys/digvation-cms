import poseidon from '../data/poseidon.json' with {type: 'json'}
import {contracts, demoUsers} from './contracts.ts'
import {demoAnalytics} from './analytics.ts'
import {records, setPath, getPath, fieldValues, validateFields, imageUrl} from './content.ts'
import type {ContentGateway, WebsiteState, WebsiteContract, Documents, FieldValues, DataRecord, Activity, MediaAsset} from './types.ts'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
const key = 'digvation-content-demo-v1'
const now = () => new Date().toISOString()
const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
function object(value: unknown): value is Record<string, unknown> {return value !== null && typeof value === 'object' && !Array.isArray(value)}
function storedDocuments(value: unknown, contract: WebsiteContract) {
  return object(value) && contract.modules.every(module => {
    const doc = value[module.document]
    return object(doc) && (!module.collection || Array.isArray(getPath(doc, module.collection)))
  })
}
function storedSite(value: unknown, contract: WebsiteContract) {
  return object(value) && value.id === contract.id && typeof value.setupComplete === 'boolean' && typeof value.updatedAt === 'string'
    && storedDocuments(value.documents, contract) && object(value.publishedDocuments)
    && Array.isArray(value.changes) && value.changes.every(item => typeof item === 'string')
    && Array.isArray(value.releases) && value.releases.every(item => object(item) && typeof item.id === 'string' && typeof item.revision === 'string' && storedDocuments(item.documents, contract))
    && Array.isArray(value.media) && value.media.every(item => object(item) && typeof item.id === 'string' && typeof item.name === 'string' && imageUrl(item.url))
    && Array.isArray(value.activity) && value.activity.every(item => object(item) && ['edit', 'publish', 'setup', 'delete'].includes(String(item.kind)) && typeof item.title === 'string')
}

function initialState(): Record<string, WebsiteState> {
  const docs = structuredClone(poseidon) as unknown as Documents
  const media: MediaAsset[] = []
  const urls = new Set<string>()
  for (const module of contracts[0].modules) for (const record of records(docs, module)) {
    for (const value of Object.values(record)) {
      for (const item of Array.isArray(value) ? value : [value]) if (typeof item === 'string' && imageUrl(item) && /cdn.poseidonfilter.id/.test(item) && !urls.has(item) && media.length < 24) {
        urls.add(item); media.push({id: uid(), name: module.singular + ' ' + (media.length + 1), url: item, type: item.includes('.svg') ? 'SVG' : 'Gambar', size: 'URL', addedAt: '2026-10-24T06:00:00Z'})
      }
    }
  }
  const at = now()
  return {
    poseidon: {id: 'poseidon', documents: docs, publishedDocuments: structuredClone(docs), setupComplete: true, changes: [], media, updatedAt: at,
      activity: [
        {id: uid(), title: 'Konten website siap dikelola', detail: '102 produk, 3 artikel, dan 34 foto galeri telah tersedia.', actor: 'Tim Poseidon', at, kind: 'setup'},
        {id: uid(), title: 'Release awal tersedia', detail: 'Versi 20261024-initial menjadi titik awal preview.', actor: 'Digvation', at: '2026-10-24T06:00:00Z', kind: 'publish'},
      ],
      releases: [{id: 'initial', revision: '20261024-initial', at: '2026-10-24T06:00:00Z', actor: 'Digvation', count: 6, documents: structuredClone(docs)}]},
    arunika: {id: 'arunika', documents: {
      home: {title: 'Ruang yang bercerita.', subtitle: 'Studio arsitektur dan interior yang menghadirkan ruang penuh karakter.', ctaLabel: 'Jelajahi karya kami', cover: '/demo/arunika-space.svg'},
      services: {items: []}, projects: {items: []}, team: {items: []},
      contact: {email: 'hello@arunika.example', phone: '', address: '', instagram: ''},
    }, publishedDocuments: {}, setupComplete: false, changes: [], activity: [], releases: [], updatedAt: at,
    media: [{id: 'arunika-space', name: 'Ruang Arunika', url: '/demo/arunika-space.svg', type: 'SVG', size: 'Demo', addedAt: at}]},
  }
}

export function createMockGateway(options: {storage?: StorageLike} = {}): ContentGateway {
  let sites = initialState()
  let userId: string | null = null
  let warning = !options.storage
  try {
    const raw = options.storage?.getItem(key)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved.version === 1 && contracts.every(contract => storedSite(saved.sites?.[contract.id], contract))) {
        sites = saved.sites
        userId = demoUsers.some(user => user.id === saved.userId) ? saved.userId : null
      }
    }
  } catch {warning = true}
  function persist() {
    try {options.storage?.setItem(key, JSON.stringify({version: 1, sites, userId}))} catch {warning = true}
  }
  function user() {
    const result = demoUsers.find(item => item.id === userId)
    if (!result) throw new Error('Masuk terlebih dahulu.')
    return result
  }
  function access(id: string) {
    if (!user().websiteIds.includes(id)) throw new Error('Anda tidak memiliki akses ke website ini.')
    const contract = contracts.find(item => item.id === id)
    if (!contract || !sites[id]) throw new Error('Website tidak terdaftar.')
    return {contract, site: sites[id]}
  }
  function activity(id: string, item: Omit<Activity, 'id' | 'at' | 'actor'>) {
    const site = sites[id]; site.updatedAt = now()
    site.activity.unshift({...item, id: uid(), at: site.updatedAt, actor: user().name})
    site.activity = site.activity.slice(0, 40)
  }
  function changed(id: string, entry: string) {
    sites[id].changes = [...new Set([...sites[id].changes, entry])]
  }
  return {
    async getSession() {const current = demoUsers.find(item => item.id === userId); return current ? {user: structuredClone(current)} : null},
    async signIn(email, password) {
      const current = demoUsers.find(item => item.email.toLowerCase() === email.trim().toLowerCase())
      if (!current) throw new Error('Akun demo tidak ditemukan.')
      if (password !== 'demo123') throw new Error('Kata sandi demo tidak sesuai.')
      userId = current.id; persist(); return {user: structuredClone(current)}
    },
    async signOut() {userId = null; persist()},
    async listWebsites() {return contracts.filter(contract => user().websiteIds.includes(contract.id)).map(contract => ({contract: structuredClone(contract), setupComplete: sites[contract.id].setupComplete, changes: sites[contract.id].changes.length, updatedAt: sites[contract.id].updatedAt}))},
    async getContract(id) {return structuredClone(access(id).contract)},
    async getState(id) {return structuredClone(access(id).site)},
    async saveRecord(id, moduleId, recordId, values: FieldValues) {
      const {contract, site} = access(id)
      const module = contract.modules.find(item => item.id === moduleId)
      if (!module) throw new Error('Bagian konten tidak terdaftar.')
      for (const path of Object.keys(values)) if (!module.fields.some(field => field.path === path)) throw new Error('Field tidak terdaftar dalam kontrak: ' + path)
      const list = records(site.documents, module)
      const existing = module.collection ? list.find(item => String(item.id) === recordId) : list[0]
      if (recordId && module.collection && !existing) throw new Error('Konten tidak ditemukan.')
      const record: DataRecord = structuredClone(existing ?? module.defaults ?? {})
      const original = existing ? fieldValues(existing, module.fields) : undefined
      for (const [path, value] of Object.entries(values)) {
        if (original && JSON.stringify(value) === JSON.stringify(original[path])) continue
        setPath(record, path, value)
      }
      validateFields(fieldValues(record, module.fields), module.fields, original)
      if (module.id === 'products') {
        const categories = site.documents.products.categories as DataRecord[]
        const category = categories.find(item => item.id === record.categoryId)
        if (!category || !(category.subcategories as DataRecord[]).some(item => item.id === record.subcategoryId)) throw new Error('Subkategori tidak sesuai kategori.')
      }
      if (module.collection) {
        if (!existing) {
          if (module.id === 'gallery') {
            const sequence = site.identitySequence ??= {}
            record.id = Math.max(sequence[module.id] || 0, 0, ...list.map(item => Number(item.id) || 0)) + 1
            sequence[module.id] = Number(record.id)
          } else record.id = module.id + '-' + uid()
          record.order = Math.max(-1, ...list.map(item => Number(item.order) || 0)) + 1
          if ('No' in record) record.No = Math.max(0, ...list.map(item => Number(item.No) || 0)) + 1
          list.push(record)
        } else list[list.findIndex(item => String(item.id) === String(record.id))] = record
        setPath(site.documents[module.document], module.collection, list)
      } else site.documents[module.document] = record
      const resultId = module.collection ? String(record.id) : 'page'
      changed(id, moduleId + ':' + resultId)
      activity(id, {title: existing ? module.singular + ' diperbarui' : module.singular + ' ditambahkan', detail: String(record[module.titlePath] || module.label), kind: 'edit'})
      persist(); return resultId
    },
    async deleteRecord(id, moduleId, recordId) {
      const {contract, site} = access(id)
      const module = contract.modules.find(item => item.id === moduleId && item.collection)
      if (!module) throw new Error('Bagian konten tidak terdaftar.')
      const list = records(site.documents, module); const record = list.find(item => String(item.id) === recordId)
      if (!record) throw new Error('Konten tidak ditemukan.')
      if (module.id === 'gallery') {
        const sequence = site.identitySequence ??= {}
        sequence[module.id] = Math.max(sequence[module.id] || 0, ...list.map(item => Number(item.id) || 0))
      }
      setPath(site.documents[module.document], module.collection!, list.filter(item => String(item.id) !== recordId))
      changed(id, moduleId + ':' + recordId)
      activity(id, {title: module.singular + ' dihapus dari draft', detail: String(record[module.titlePath] || module.label), kind: 'delete'})
      persist()
    },
    async publish(id) {
      const {site} = access(id)
      if (!site.setupComplete) throw new Error('Selesaikan penyiapan website terlebih dahulu.')
      if (!site.changes.length) throw new Error('Belum ada perubahan untuk dipublikasikan.')
      const release = {id: uid(), revision: 'demo-' + new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + uid().slice(0, 4), at: now(), actor: user().name, count: site.changes.length, documents: structuredClone(site.documents)}
      site.releases.unshift(release); site.releases = site.releases.slice(0, 12)
      site.publishedDocuments = structuredClone(site.documents); site.changes = []
      activity(id, {title: 'Versi demo baru dipublikasikan', detail: release.revision, kind: 'publish'})
      persist(); return structuredClone(release)
    },
    async restoreDraft(id, releaseId) {
      const {site} = access(id); const release = site.releases.find(item => item.id === releaseId)
      if (!release) throw new Error('Versi tidak ditemukan.')
      site.documents = structuredClone(release.documents); changed(id, 'restore:' + releaseId)
      activity(id, {title: 'Versi dipulihkan sebagai draft', detail: release.revision, kind: 'edit'}); persist()
    },
    async completeSetup(id) {
      const {site} = access(id); site.setupComplete = true
      activity(id, {title: 'Workspace siap digunakan', detail: 'Kontrak editor telah dikonfirmasi.', kind: 'setup'}); persist()
    },
    async addMedia(id, asset) {
      const {site} = access(id)
      if (!imageUrl(asset.url)) throw new Error('Format gambar tidak didukung.')
      site.media.unshift({...asset, id: uid(), addedAt: now()}); persist()
    },
    async getAnalytics(id, period) {access(id); return demoAnalytics(id, period)},
    persistenceWarning() {return warning},
  }
}
