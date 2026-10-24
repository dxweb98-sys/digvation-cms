import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import type {ReactNode} from 'react'
import {useMatch} from 'react-router-dom'
import {createMockGateway} from '../domain/gateway'
import type {ContentGateway, Session, WebsiteContract, WebsiteState, WebsiteSummary} from '../domain/types'

function browserStorage() {try {return window.localStorage} catch {return undefined}}
const gateway = createMockGateway({storage: browserStorage()})
type Toast = {message: string; error?: boolean}
interface Studio {
  api: ContentGateway; session: Session | null; ready: boolean; loading: boolean; error: string
  contract?: WebsiteContract; site?: WebsiteState; websites: WebsiteSummary[]
  login: (email: string, password: string) => Promise<Session>
  logout: () => Promise<void>; refresh: () => Promise<void>
  mutate: (action: () => Promise<unknown>, message: string) => Promise<boolean>
  notify: (message: string, error?: boolean) => void
}
const Context = createContext<Studio | null>(null)
export function StudioProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [websites, setWebsites] = useState<WebsiteSummary[]>([])
  const [loaded, setLoaded] = useState<{contract: WebsiteContract; site: WebsiteState}>()
  const [toast, setToast] = useState<Toast>()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const generation = useRef(0)
  const siteId = useMatch('/w/:siteId/*')?.params.siteId
  const notify = useCallback((message: string, isError = false) => {
    clearTimeout(timer.current); setToast({message, error: isError})
    timer.current = setTimeout(() => setToast(undefined), 4500)
  }, [])
  useEffect(() => {
    let active = true
    gateway.getSession().then(value => {if (active) {setSession(value); setReady(true)}})
    return () => {active = false; clearTimeout(timer.current)}
  }, [])
  const refresh = useCallback(async () => {
    if (!session) return
    const current = ++generation.current
    setLoading(true); setError('')
    try {
      const list = await gateway.listWebsites()
      const data = siteId ? await Promise.all([gateway.getContract(siteId), gateway.getState(siteId)]) : null
      if (current !== generation.current) return
      setWebsites(list)
      if (data) setLoaded({contract: data[0], site: data[1]})
    } catch (cause) {
      if (current === generation.current) {setLoaded(undefined); setError(cause instanceof Error ? cause.message : 'Workspace belum dapat dimuat.')}
    } finally {if (current === generation.current) setLoading(false)}
  }, [session, siteId])
  useEffect(() => {void refresh(); return () => {generation.current++}}, [refresh])
  const value: Studio = {
    api: gateway, session, ready, loading, error, websites,
    contract: loaded && loaded.contract.id === siteId ? loaded.contract : undefined,
    site: loaded && loaded.site.id === siteId ? loaded.site : undefined,
    async login(email, password) {const result = await gateway.signIn(email, password); setSession(result); return result},
    async logout() {await gateway.signOut(); generation.current++; setSession(null); setLoaded(undefined); setWebsites([])},
    refresh, notify,
    async mutate(action, message) {
      try {await action(); await refresh(); notify(message); return true}
      catch (cause) {notify(cause instanceof Error ? cause.message : 'Perubahan belum dapat disimpan.', true); return false}
    },
  }
  return <Context.Provider value={value}>{children}{toast && <div className={'toast ' + (toast.error ? 'toast-error' : '')} role={toast.error ? 'alert' : 'status'}><span className="toast-dot"/>{toast.message}<button onClick={() => setToast(undefined)} aria-label="Tutup notifikasi">×</button></div>}</Context.Provider>
}
export function useStudio() {const value = useContext(Context); if (!value) throw new Error('Studio provider missing'); return value}
export function useWorkspace() {
  const studio = useStudio()
  if (!studio.contract || !studio.site || !studio.session) throw new Error('Workspace belum dimuat.')
  return {...studio, contract: studio.contract, site: studio.site, session: studio.session}
}
