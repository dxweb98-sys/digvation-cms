import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createMockGateway} from '../src/domain/gateway.ts'
import {fieldValues, records, validateFields} from '../src/domain/content.ts'
import * as content from '../src/domain/content.ts'
import {contracts} from '../src/domain/contracts.ts'

const memory = () => {
  const data = new Map<string, string>()
  return {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => {data.set(key, value)}}
}
test('mock login rejects unknown users and invalid credentials', async () => {
  const gateway = createMockGateway({storage: memory()})
  await assert.rejects(gateway.signIn('unknown@example.test', 'demo123'), /Akun/)
  await assert.rejects(gateway.signIn('admin@digvation.test', 'wrong'), /sandi/)
  assert.equal((await gateway.signIn('admin@digvation.test', 'demo123')).user.websiteIds.length, 2)
})
test('client accounts see only their website and cannot request another contract or data', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  assert.deepEqual((await gateway.listWebsites()).map(site => site.contract.id), ['poseidon'])
  await assert.rejects(gateway.getState('arunika'), /akses/)
  await assert.rejects(gateway.getContract('arunika'), /akses/)
  await gateway.signOut()
  await assert.rejects(gateway.getState('poseidon'), /Masuk/)
})
test('saving accepts registered fields, preserves identity and rejects unknown paths', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  const before = await gateway.getState('poseidon')
  const product = (before.documents.products.items as any[])[0]
  await assert.rejects(gateway.saveRecord('poseidon', 'products', product.id, {rogueField: 'no'}), /terdaftar/)
  await assert.rejects(gateway.saveRecord('poseidon', 'products', product.id, {'__proto__.polluted': true}), /terdaftar/)
  await gateway.saveRecord('poseidon', 'products', product.id, {Serie: '1812-75 NEW'})
  const after = await gateway.getState('poseidon')
  const updated = (after.documents.products.items as any[])[0]
  assert.equal(updated.id, product.id)
  assert.equal(updated.Serie, '1812-75 NEW')
  assert.deepEqual(updated.detail, product.detail)
  assert.equal((after.publishedDocuments.products.items as any[])[0].Serie, product.Serie)
  assert.equal(({} as any).polluted, undefined)
})
test('validation rejects empty required content and unsafe media URLs before changing drafts', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  await assert.rejects(gateway.saveRecord('poseidon', 'products', 'product-1', {Serie: ''}), /wajib/)
  await assert.rejects(gateway.saveRecord('poseidon', 'products', 'product-1', {Images: ['javascript:alert(1)']}), /gambar/)
  assert.equal((await gateway.getState('poseidon')).changes.length, 0)
})
test('a new client can finish setup and create content using a different contract', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@arunika.test', 'demo123')
  assert.equal((await gateway.getState('arunika')).setupComplete, false)
  await gateway.completeSetup('arunika')
  const id = await gateway.saveRecord('arunika', 'services', null, {title: 'Interior komersial', description: 'Ruang kerja yang lebih baik.', category: 'Komersial', visible: true})
  const state = await gateway.getState('arunika')
  assert.equal(state.setupComplete, true)
  assert.equal((state.documents.services.items as any[])[0].id, id)
  await assert.rejects(gateway.saveRecord('arunika', 'products', null, {Serie: 'Wrong schema'}), /terdaftar/)
})
test('publication is a snapshot; later edits and restoring a draft do not alter an existing release', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('admin@digvation.test', 'demo123')
  await gateway.saveRecord('poseidon', 'products', 'product-1', {Serie: 'Version one'})
  const release = await gateway.publish('poseidon')
  assert.equal((await gateway.getState('poseidon')).changes.length, 0)
  await gateway.saveRecord('poseidon', 'products', 'product-1', {Serie: 'Version two'})
  assert.equal((release.documents.products.items as any[])[0].Serie, 'Version one')
  await gateway.restoreDraft('poseidon', release.id)
  const state = await gateway.getState('poseidon')
  assert.equal((state.documents.products.items as any[])[0].Serie, 'Version one')
  assert.ok(state.changes.length)
  assert.equal((await gateway.getState('arunika')).changes.length, 0)
})
test('numeric gallery identities are deleted precisely and newly created identities remain unique', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('admin@digvation.test', 'demo123')
  await gateway.deleteRecord('poseidon', 'gallery', '1')
  const first = await gateway.saveRecord('poseidon', 'gallery', null, {title: 'First', image: 'https://example.test/one.png', category: 'Model', visible: true})
  const second = await gateway.saveRecord('poseidon', 'gallery', null, {title: 'Second', image: 'https://example.test/two.png', category: 'Model', visible: true})
  assert.notEqual(first, second)
  assert.equal((await gateway.getState('poseidon')).documents.gallery.items instanceof Array, true)
})
test('unavailable or corrupt browser storage does not prevent using the demo', async () => {
  const gateway = createMockGateway({storage: {getItem: () => '{broken', setItem: () => {throw new Error('quota')}}})
  await gateway.signIn('admin@digvation.test', 'demo123')
  await gateway.saveRecord('poseidon', 'products', 'product-1', {Serie: 'Kept in memory'})
  assert.equal((await gateway.getState('poseidon')).changes.length, 1)
  assert.equal(gateway.persistenceWarning(), true)
})
test('a structurally corrupt stored document is discarded before a workspace can render it', async () => {
  const storage = memory()
  const first = createMockGateway({storage})
  await first.signIn('admin@digvation.test', 'demo123')
  const saved = JSON.parse(storage.getItem('digvation-content-demo-v1')!)
  saved.sites.poseidon.documents = null
  storage.setItem('digvation-content-demo-v1', JSON.stringify(saved))
  const restored = createMockGateway({storage})
  await restored.signIn('admin@digvation.test', 'demo123')
  const state = await restored.getState('poseidon')
  assert.ok(state.documents && Array.isArray(state.documents.products.items))
})
test('the demo starts on HTTP previews where crypto.randomUUID is unavailable', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID')
  Object.defineProperty(crypto, 'randomUUID', {value: undefined, configurable: true})
  try {
    const gateway = createMockGateway({storage: memory()})
    await gateway.signIn('admin@digvation.test', 'demo123')
    const site = await gateway.getState('poseidon')
    assert.equal(new Set(site.media.map(item => item.id)).size, site.media.length)
  } finally {
    if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor)
    else Reflect.deleteProperty(crypto, 'randomUUID')
  }
})
test('all existing gallery categories can be edited without changing the category', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  const state = await gateway.getState('poseidon')
  const items = state.documents.gallery.items as any[]
  for (const category of new Set(items.map(item => item.category))) {
    const item = items.find(item => item.category === category)!
    await gateway.saveRecord('poseidon', 'gallery', String(item.id), {title: 'Updated ' + category})
  }
})
test('deleting the highest gallery identity never reassigns it, including after reopening', async () => {
  const storage = memory()
  const gateway = createMockGateway({storage})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  const items = (await gateway.getState('poseidon')).documents.gallery.items as any[]
  const highest = Math.max(...items.map(item => Number(item.id)))
  await gateway.deleteRecord('poseidon', 'gallery', String(highest))
  const reopened = createMockGateway({storage})
  const id = await reopened.saveRecord('poseidon', 'gallery', null, {title: 'New image', image: 'https://example.test/new.png', category: 'Model', visible: true})
  assert.ok(Number(id) > highest)
})
test('analytics follows website access and a new client has no fabricated traffic', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  await assert.rejects(gateway.getAnalytics('arunika', 30), /akses/)
  const data = await gateway.getAnalytics('poseidon', 7)
  assert.equal(data.demo, true)
  assert.equal(data.points.length, 7)
  assert.equal(data.visitors, data.points.reduce((total, point) => total + point.visitors, 0))
  await gateway.signIn('owner@arunika.test', 'demo123')
  const empty = await gateway.getAnalytics('arunika', 30)
  assert.equal(empty.hasData, false)
  assert.equal(empty.visitors, 0)
  assert.deepEqual(empty.campaigns, [])
})
test('every existing Poseidon record can round-trip without repairing untouched legacy fields', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  const before = await gateway.getState('poseidon')
  for (const module of contracts[0].modules) for (const record of records(before.documents, module)) {
    const values = fieldValues(record, module.fields)
    assert.doesNotThrow(() => validateFields(values, module.fields, fieldValues(record, module.fields)))
    await gateway.saveRecord('poseidon', module.id, module.collection ? String(record.id) : null, values)
  }
  assert.deepEqual((await gateway.getState('poseidon')).documents, before.documents)
})
test('legacy compatibility permits title-only edits but still rejects newly invalid values', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('owner@poseidon.test', 'demo123')
  await gateway.saveRecord('poseidon', 'products', 'product-2', {Serie: 'Edited legacy product'})
  await assert.rejects(gateway.saveRecord('poseidon', 'products', 'product-2', {Images: ['javascript:bad']}), /gambar/)
  await assert.rejects(gateway.saveRecord('poseidon', 'products', 'product-1', {visible: []}), /valid/)
  await assert.rejects(gateway.saveRecord('poseidon', 'products', 'product-1', {Description: ''}), /wajib/)
  assert.equal((await gateway.getState('poseidon')).changes.length, 1)
})
test('publication indicators follow snapshot differences after restore, and never call new or hidden content live', async () => {
  const gateway = createMockGateway({storage: memory()})
  await gateway.signIn('admin@digvation.test', 'demo123')
  const module = contracts[0].modules.find(item => item.id === 'products')!
  await gateway.saveRecord('poseidon', 'products', 'product-1', {Serie: 'Published change'})
  await gateway.publish('poseidon')
  let state = await gateway.getState('poseidon')
  assert.equal(content.recordPublication(state, module, records(state.documents, module)[0]), 'published')
  await gateway.restoreDraft('poseidon', 'initial')
  state = await gateway.getState('poseidon')
  assert.equal(content.recordPublication(state, module, records(state.documents, module)[0]), 'draft')
  await gateway.saveRecord('poseidon', 'products', 'product-1', {visible: false})
  await gateway.publish('poseidon')
  state = await gateway.getState('poseidon')
  assert.equal(content.recordPublication(state, module, records(state.documents, module)[0]), 'hidden')
  await gateway.completeSetup('arunika')
  await gateway.saveRecord('arunika', 'services', null, {title: 'First service', description: 'New service', category: 'Hunian'})
  const newSite = await gateway.getState('arunika')
  const service = contracts[1].modules.find(item => item.id === 'services')!
  assert.equal(content.recordPublication(newSite, service, records(newSite.documents, service)[0]), 'draft')
})
test('denial of the storage getter is reported as memory-only persistence', () => {
  assert.equal(createMockGateway({storage: undefined}).persistenceWarning(), true)
})
