import {useState} from 'react'
import {Navigate, useNavigate} from 'react-router-dom'
import {ArrowRight, ShieldCheck, LayoutDashboard, Check, Eye, EyeOff} from 'lucide-react'
import {Brand} from '../components/ui'
import {useStudio} from '../state/Studio'
import {demoUsers} from '../domain/contracts'

export function Login() {
  const studio = useStudio(); const navigate = useNavigate()
  const [email, setEmail] = useState('admin@digvation.test'); const [password, setPassword] = useState('demo123')
  const [show, setShow] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (!studio.ready) return <div className="loading-screen"><Brand/><span className="spinner"/></div>
  if (studio.session) return <Navigate to={'/w/' + studio.session.user.websiteIds[0] + '/overview'} replace/>
  return <div className="login-page">
    <section className="login-story"><Brand/><div className="login-story-main"><span className="login-eyebrow"><span/> SATU RUANG, BANYAK CERITA</span><h1>Website yang berbeda.<br/>Cara kelola yang<br/><em>lebih sederhana.</em></h1><p>Ruang kerja yang memahami konten Anda.<br/>Dari cerita pertama, sampai siap diterbitkan.</p>
      <div className="login-art" aria-hidden="true"><div className="art-back"/><div className="art-browser"><div className="art-bar"><i/><i/><i/><span>Content Studio</span></div><div className="art-content"><div className="art-side"><b/><span/><span/><span/><span/></div><div className="art-right"><small>WORKSPACE ANDA</small><h3>Ide bagus.<br/>Siap dibagikan.</h3><div className="art-cards"><span/><span/><span/></div><div className="art-lines"><i/><i/></div></div></div></div><div className="art-toast"><span><Check size={17}/></span><div>Perubahan tersimpan<small>Satu langkah lebih dekat.</small></div></div></div>
    </div><div className="login-story-foot"><ShieldCheck size={17}/>Konten terpisah. Pengalaman yang menyatu.<span>© 2026 Digvation</span></div></section>
    <section className="login-form-side"><div className="mobile-brand"><Brand/></div><div className="login-form-wrap"><div className="login-symbol"><LayoutDashboard size={23}/></div><div className="eyebrow">SELAMAT DATANG KEMBALI</div><h2>Masuk ke studio.</h2><p className="login-description">Pilih workspace dan mulai kelola cerita Anda.</p>
      <form onSubmit={async event => {event.preventDefault(); setBusy(true); setError(''); try {const session = await studio.login(email, password); navigate('/w/' + session.user.websiteIds[0] + '/overview')} catch (cause) {setError(cause instanceof Error ? cause.message : 'Gagal masuk.')} finally {setBusy(false)}}}>
        <label className="field-label" htmlFor="login-email">Alamat email</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@perusahaan.com"/>
        <label className="field-label" htmlFor="login-password">Kata sandi</label><div className="password-input"><input id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/><button type="button" aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}<button className="button primary login-submit" disabled={busy}>{busy ? 'Memasuki studio…' : 'Masuk ke studio'}<ArrowRight size={18}/></button>
      </form>
      <div className="demo-accounts"><div className="demo-divider"><span>COBA PENGALAMAN DEMO</span></div><div className="demo-account-grid">{demoUsers.map(user => <button key={user.id} className={email === user.email ? 'selected' : ''} onClick={() => {setEmail(user.email); setPassword('demo123'); setError('')}}><span className="account-avatar">{user.initials}</span><strong>{user.role === 'operator' ? 'Digvation' : user.id === 'poseidon-owner' ? 'Poseidon' : 'Arunika'}</strong><small>{user.role === 'operator' ? '2 website' : user.id === 'arunika-owner' ? 'Client baru' : 'Client aktif'}</small></button>)}</div><p>Akun contoh · kata sandi <code>demo123</code></p></div>
      <div className="login-note"><ShieldCheck size={16}/><span>Mode demo. Autentikasi dan konten disimulasikan di browser. Integrasi CORE menyusul.</span></div>
    </div><div className="login-foot">Dibuat untuk website yang terus bertumbuh.<span>Digvation Content Studio</span></div></section>
  </div>
}
