export type AnalyticsPeriod = 7 | 30 | 90
export interface TrafficPoint {date: string; visitors: number}
export interface Campaign {
  id: string; name: string; platform: 'Google Ads' | 'Meta Ads'; status: 'active' | 'paused'
  impressions: number; clicks: number; spend: number; leads: number; objective: string
}
export interface AnalyticsSnapshot {
  websiteId: string; period: AnalyticsPeriod; demo: true; hasData: boolean
  visitors: number; pageViews: number; engagementSeconds: number; points: TrafficPoint[]
  channels: {name: string; visitors: number; share: number; color: string}[]
  pages: {path: string; title: string; views: number; share: number}[]
  devices: {name: string; share: number; color: string}[]
  campaigns: Campaign[]
}
const daily = [310, 358, 340, 415, 372, 320, 295, 410, 465, 420, 510, 475, 390, 350, 485, 525, 490, 575, 542, 460, 420, 550, 620, 590, 655, 610, 565, 525, 680, 715]
const campaigns: Campaign[] = [
  {id: 'search-ro', name: 'Membran RO · Pencarian produk', platform: 'Google Ads', status: 'active', impressions: 68400, clicks: 2838, spend: 1890000, leads: 84, objective: 'Inquiry produk'},
  {id: 'meta-family', name: 'Air bersih untuk keluarga', platform: 'Meta Ads', status: 'active', impressions: 92600, clicks: 2346, spend: 1240000, leads: 62, objective: 'Percakapan WhatsApp'},
  {id: 'brand-search', name: 'Poseidon · Brand awareness', platform: 'Google Ads', status: 'active', impressions: 25400, clicks: 1154, spend: 610000, leads: 38, objective: 'Kunjungan website'},
  {id: 'retargeting', name: 'Kembali mengenal Poseidon', platform: 'Meta Ads', status: 'paused', impressions: 0, clicks: 0, spend: 0, leads: 0, objective: 'Retargeting pengunjung'},
]
export function demoAnalytics(websiteId: string, period: AnalyticsPeriod): AnalyticsSnapshot {
  const hasData = websiteId === 'poseidon'
  const points = hasData ? Array.from({length: period}, (_, index) => {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - period + index + 1)
    return {date: date.toISOString(), visitors: Math.round(daily[index % daily.length] * (period === 90 ? .88 : 1))}
  }) : []
  const visitors = points.reduce((sum, point) => sum + point.visitors, 0)
  const factor = period / 30
  return {
    websiteId, period, demo: true, hasData, visitors, pageViews: Math.round(visitors * 2.79), engagementSeconds: 154, points,
    channels: hasData ? [
      {name: 'Organic Search', share: 43, color: 'var(--accent)', visitors: Math.round(visitors * .43)},
      {name: 'Direct', share: 27, color: '#9474da', visitors: Math.round(visitors * .27)},
      {name: 'Social', share: 18, color: '#49a69d', visitors: Math.round(visitors * .18)},
      {name: 'Paid Search', share: 12, color: '#d9a65c', visitors: Math.round(visitors * .12)},
    ] : [],
    pages: hasData ? [
      {path: '/product', title: 'Katalog produk', share: 46, views: Math.round(visitors * 2.79 * .46)},
      {path: '/', title: 'Beranda', share: 29, views: Math.round(visitors * 2.79 * .29)},
      {path: '/about-us', title: 'Tentang Poseidon', share: 15, views: Math.round(visitors * 2.79 * .15)},
      {path: '/contact', title: 'Hubungi kami', share: 10, views: Math.round(visitors * 2.79 * .1)},
    ] : [],
    devices: hasData ? [{name: 'Desktop', share: 58, color: 'var(--accent)'}, {name: 'Mobile', share: 36, color: '#9474da'}, {name: 'Tablet', share: 6, color: '#49a69d'}] : [],
    campaigns: hasData ? campaigns.map(campaign => ({...campaign, impressions: Math.round(campaign.impressions * factor), clicks: Math.round(campaign.clicks * factor), spend: Math.round(campaign.spend * factor), leads: Math.round(campaign.leads * factor)})) : [],
  }
}
export const money = (value: number) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(value)
export const integer = (value: number) => value.toLocaleString('id-ID')
export const ratio = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator : null
