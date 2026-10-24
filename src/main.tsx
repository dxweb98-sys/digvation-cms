import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {createBrowserRouter, RouterProvider, Navigate, Outlet, useRouteError, Link} from 'react-router-dom'
import {StudioProvider, useStudio} from './state/Studio'
import {AppearanceProvider} from './state/Appearance'
import {Brand} from './components/ui'
import {Shell} from './components/Shell'
import {Login} from './pages/Login'
import {Dashboard} from './pages/Dashboard'
import {Analytics} from './pages/Analytics'
import {ContentPage} from './pages/ContentPage'
import {AccessError, Setup, Websites, Media, Releases, Settings} from './pages/WorkspacePages'
import './style.css'
import './analytics.css'

function Workspace() {
  const studio = useStudio()
  if (!studio.ready) return <Loading/>
  if (!studio.session) return <Navigate to="/login" replace/>
  if (studio.error) return <AccessError message={studio.error}/>
  if (!studio.contract || !studio.site) return <Loading/>
  if (!studio.site.setupComplete) return <Setup/>
  return <Shell/>
}
function Loading() {return <div className="loading-screen"><Brand/><span className="spinner"/><p>Menyiapkan ruang cerita Anda…</p></div>}
function RootError() {
  const error = useRouteError()
  return <div className="access-error"><Brand/><h1>Studio perlu dimuat ulang.</h1><p>{error instanceof Error ? error.message : 'Halaman belum tersedia.'}</p><Link className="button primary" to="/login" reloadDocument>Kembali ke studio</Link></div>
}
const router = createBrowserRouter([{
  element: <AppearanceProvider><StudioProvider><Outlet/></StudioProvider></AppearanceProvider>,
  errorElement: <RootError/>,
  children: [
    {index: true, element: <Navigate to="/login" replace/>},
    {path: 'login', element: <Login/>},
    {path: 'w/:siteId', element: <Workspace/>, children: [
      {index: true, element: <Navigate to="overview" replace/>},
      {path: 'overview', element: <Dashboard/>},
      {path: 'analytics', element: <Analytics/>},
      {path: 'content/:moduleId', element: <ContentPage/>},
      {path: 'websites', element: <Websites/>},
      {path: 'media', element: <Media/>},
      {path: 'releases', element: <Releases/>},
      {path: 'settings', element: <Settings/>},
    ]},
    {path: '*', element: <AccessError message="Halaman ini belum terdaftar di studio."/>},
  ],
}])
createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router}/></StrictMode>)
