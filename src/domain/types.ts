import type {AnalyticsPeriod, AnalyticsSnapshot} from './analytics.ts'
export type Json = string | number | boolean | null | Json[] | DataRecord
export type DataRecord = {[key: string]: Json}
export type Documents = Record<string, DataRecord>
export type FieldType = 'text' | 'textarea' | 'richtext' | 'number' | 'select' | 'images' | 'image' | 'toggle' | 'tags' | 'specs'
export interface Field {
  path: string; label: string; type: FieldType; required?: boolean; hint?: string
  placeholder?: string; options?: {value: string; label: string}[]; optionsPath?: string
}
export interface ContentModule {
  id: string; label: string; singular: string; icon: string; description: string
  document: string; collection?: string; titlePath: string; imagePath?: string
  subtitlePath?: string; fields: Field[]; defaults?: DataRecord
}
export interface WebsiteContract {
  id: string; name: string; domain: string; url?: string; initials: string
  industry: string; description: string; color: string; contractVersion: string
  modules: ContentModule[]
}
export interface User {
  id: string; name: string; email: string; role: 'operator' | 'client'
  websiteIds: string[]; initials: string
}
export interface Session {user: User}
export interface Activity {id: string; title: string; detail: string; at: string; actor: string; kind: 'edit' | 'publish' | 'setup' | 'delete'}
export interface MediaAsset {id: string; name: string; url: string; type: string; size: string; addedAt: string}
export interface Release {
  id: string; revision: string; at: string; actor: string; count: number; documents: Documents
}
export interface WebsiteState {
  id: string; documents: Documents; publishedDocuments: Documents; setupComplete: boolean
  identitySequence?: Record<string, number>
  changes: string[]; activity: Activity[]; releases: Release[]; media: MediaAsset[]; updatedAt: string
}
export interface WebsiteSummary {contract: WebsiteContract; setupComplete: boolean; changes: number; updatedAt: string}
export type FieldValues = Record<string, Json>
export interface ContentGateway {
  getSession(): Promise<Session | null>
  signIn(email: string, password: string): Promise<Session>
  signOut(): Promise<void>
  listWebsites(): Promise<WebsiteSummary[]>
  getContract(websiteId: string): Promise<WebsiteContract>
  getState(websiteId: string): Promise<WebsiteState>
  saveRecord(websiteId: string, moduleId: string, recordId: string | null, values: FieldValues): Promise<string>
  deleteRecord(websiteId: string, moduleId: string, recordId: string): Promise<void>
  publish(websiteId: string): Promise<Release>
  restoreDraft(websiteId: string, releaseId: string): Promise<void>
  completeSetup(websiteId: string): Promise<void>
  addMedia(websiteId: string, asset: Omit<MediaAsset, 'id' | 'addedAt'>): Promise<void>
  getAnalytics(websiteId: string, period: AnalyticsPeriod): Promise<AnalyticsSnapshot>
  persistenceWarning(): boolean
}
