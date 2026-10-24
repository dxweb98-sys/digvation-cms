import {createContext, useContext, useEffect, useState} from 'react'
import type {ReactNode} from 'react'

export const accents = [
  {name: 'Biru', hex: '#2864e9', rgb: '40,100,233'}, {name: 'Ungu', hex: '#8055d9', rgb: '128,85,217'},
  {name: 'Teal', hex: '#158879', rgb: '21,136,121'}, {name: 'Cyan', hex: '#138fb7', rgb: '19,143,183'},
  {name: 'Amber', hex: '#cf7a21', rgb: '207,122,33'}, {name: 'Rose', hex: '#c74b76', rgb: '199,75,118'},
]
const Context = createContext<{accent: string; dark: boolean; setAccent: (value: string) => void; setDark: (value: boolean) => void} | null>(null)
export function AppearanceProvider({children}: {children: ReactNode}) {
  const [accent, setAccent] = useState(() => {try {return localStorage.getItem('studio-accent') || 'Biru'} catch {return 'Biru'}})
  const [dark, setDark] = useState(() => {try {return localStorage.getItem('studio-theme') === 'dark'} catch {return false}})
  useEffect(() => {
    const color = accents.find(item => item.name === accent) ?? accents[0]
    document.documentElement.style.setProperty('--accent', color.hex)
    document.documentElement.style.setProperty('--accent-rgb', color.rgb)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    try {localStorage.setItem('studio-accent', color.name); localStorage.setItem('studio-theme', dark ? 'dark' : 'light')} catch { /* Appearance is optional. */ }
  }, [accent, dark])
  return <Context.Provider value={{accent, dark, setAccent, setDark}}>{children}</Context.Provider>
}
export function useAppearance() {const context = useContext(Context); if (!context) throw new Error('Appearance provider missing'); return context}
