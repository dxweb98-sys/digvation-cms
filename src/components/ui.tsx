import {useEffect, useRef, useState} from 'react'
import type {ReactNode} from 'react'
import {Home, Package, FileText, Image, Building2, CircleHelp, Phone, Layers, Folder, Users, X, ArrowUpRight, Globe, CheckCircle2, FileCheck2, AlertCircle} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'

const icons: Record<string, LucideIcon> = {home: Home, box: Package, file: FileText, image: Image, building: Building2, help: CircleHelp, phone: Phone, layers: Layers, folder: Folder, users: Users}
export function ModuleIcon({name, size = 18}: {name: string; size?: number}) {const Icon = icons[name] ?? FileText; return <Icon size={size} strokeWidth={1.75}/>}
export function Brand({compact = false}: {compact?: boolean}) {return <div className={'brand brand-official ' + (compact ? 'brand-compact' : '')}><img src={compact ? '/brand/digvation-mark.png' : '/brand/digvation-lockup.png'} alt="Digvation"/>{!compact && <span className="brand-caption">CONTENT STUDIO</span>}</div>}
export function Badge({children, tone = 'neutral'}: {children: ReactNode; tone?: 'green' | 'blue' | 'amber' | 'neutral' | 'purple'}) {return <span className={'badge badge-' + tone}><i/>{children}</span>}
export function PageTitle({eyebrow, title, description, children}: {eyebrow?: string; title: string; description?: string; children?: ReactNode}) {return <div className="page-title"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="page-actions">{children}</div>}</div>}
export function Empty({icon = 'folder', title, text, children}: {icon?: string; title: string; text: string; children?: ReactNode}) {return <div className="empty"><div className="empty-orbit"><ModuleIcon name={icon} size={29}/></div><h3>{title}</h3><p>{text}</p>{children}</div>}
export function ImageView({src, alt, className = ''}: {src?: string; alt: string; className?: string}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return src && !failed ? <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy"/> : <div className={'image-fallback ' + className} role="img" aria-label={alt}><Image size={25}/></div>
}
export function Dialog({title, children, footer, onClose, wide = false}: {title: string; children: ReactNode; footer?: ReactNode; onClose: () => void; wide?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {const dialog = ref.current; dialog?.showModal(); const original = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => {dialog?.close(); document.body.style.overflow = original}}, [])
  return <dialog ref={ref} className={'dialog ' + (wide ? 'dialog-wide' : '')} aria-label={title} onCancel={event => {event.preventDefault(); onClose()}} onClick={event => {if (event.target === event.currentTarget) {const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()}}}>
    <div className="dialog-head"><div><span className="eyebrow">CONTENT STUDIO</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup dialog"><X size={20}/></button></div>
    <div className="dialog-body">{children}</div>{footer && <div className="dialog-footer">{footer}</div>}
  </dialog>
}
export function dateLabel(value: string, long = false) {return new Date(value).toLocaleDateString('id-ID', {day: 'numeric', month: long ? 'long' : 'short', year: 'numeric'})}
export function timeLabel(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return minutes + ' menit lalu'
  if (minutes < 1440) return Math.floor(minutes / 60) + ' jam lalu'
  return dateLabel(value)
}
export function WebsiteGlyph({initials, color, small = false}: {initials: string; color: string; small?: boolean}) {return <span className={'website-glyph ' + (small ? 'glyph-small' : '')} style={{color, backgroundColor: color + '12'}}>{initials}</span>}
export function SectionHeading({title, text, children}: {title: string; text?: string; children?: ReactNode}) {return <div className="section-heading"><div><h2>{title}</h2>{text && <p>{text}</p>}</div>{children}</div>}
export function ArrowLink({children, onClick}: {children: ReactNode; onClick: () => void}) {return <button className="text-button" onClick={onClick}>{children}<ArrowUpRight size={16}/></button>}
export const StatusIcons = {publish: CheckCircle2, edit: FileCheck2, setup: Globe, delete: AlertCircle}
