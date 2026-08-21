'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CircleAlert, Download, LocateFixed, MapPin, Navigation, Search, Send, X } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { FuelType, Report } from './types/report'
import { FUEL_LABELS, FUEL_TYPES } from './types/report'
import { exportReports, loadReports, saveReport } from './data/reportRepository'
import './App.css'

type Locale = 'fr' | 'en' | 'ar'
type Coordinates = { latitude: number; longitude: number }

const copy = {
  fr: { eyebrow: 'CARBURANT · TUNISIE', title: 'Où le carburant manque-t-il ?', subtitle: 'Partagez un signal en quelques secondes. Les signalements restent visibles pendant 7 jours.', add: 'Signaler une rupture', reports: 'signalements actifs', all: 'Tous', locate: 'Ma position', searchPlaceholder: 'Ville, quartier ou station...', fuel: 'Type de carburant', note: 'Note (facultatif)', notePlaceholder: 'File, station ou contexte...', cancel: 'Annuler', publish: 'Publier le signal', choose: 'Choisissez un point sur la carte', selected: 'Position sélectionnée', local: 'Mode local', export: 'Exporter JSON', localText: 'Vos signalements sont enregistrés dans signals.json.', apiError: 'Impossible d’enregistrer dans signals.json.', locationError: 'Position indisponible', searchError: 'Lieu introuvable', close: 'Fermer' },
  en: { eyebrow: 'FUEL · TUNISIA', title: 'Where is fuel running out?', subtitle: 'Share a signal in seconds. Reports stay visible for 7 days.', add: 'Report a shortage', reports: 'active reports', all: 'All', locate: 'My location', searchPlaceholder: 'City, district or station...', fuel: 'Fuel type', note: 'Note (optional)', notePlaceholder: 'Queue, station or context...', cancel: 'Cancel', publish: 'Publish signal', choose: 'Choose a point on the map', selected: 'Selected position', local: 'Local mode', export: 'Export JSON', localText: 'Reports are saved in signals.json.', apiError: 'Unable to save to signals.json.', locationError: 'Location unavailable', searchError: 'Place not found', close: 'Close' },
  ar: { eyebrow: 'وقود · تونس', title: 'أين ينقص الوقود؟', subtitle: 'شارك إشارة في ثوانٍ. تبقى البلاغات ظاهرة لمدة 7 أيام.', add: 'الإبلاغ عن نقص', reports: 'بلاغات نشطة', all: 'الكل', locate: 'موقعي', searchPlaceholder: 'مدينة أو حي أو محطة...', fuel: 'نوع الوقود', note: 'ملاحظة (اختياري)', notePlaceholder: 'الطابور أو المحطة أو السياق...', cancel: 'إلغاء', publish: 'نشر الإشارة', choose: 'اختر نقطة على الخريطة', selected: 'الموقع المحدد', local: 'الوضع المحلي', export: 'تصدير JSON', localText: 'يتم حفظ البلاغات في signals.json.', apiError: 'تعذر الحفظ في signals.json.', locationError: 'الموقع غير متاح', searchError: 'لم يتم العثور على المكان', close: 'إغلاق' },
} as const

const fuelColors: Record<FuelType, string> = { gasoline: '#e66b3d', diesel: '#3478c5', diesel50: '#c49a35' }
const mapCenter: [number, number] = [34.3, 9.8]

function MapClick({ onSelect }: { onSelect: (position: Coordinates) => void }) {
  useMapEvents({ click: (event) => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }) })
  return null
}

function MapRecenter({ position }: { position: Coordinates | null }) {
  const map = useMap()
  useEffect(() => { if (position) map.flyTo([position.latitude, position.longitude], 13, { duration: 0.8 }) }, [map, position])
  return null
}

function App() {
  const [locale, setLocale] = useState<Locale>('fr')
  const [reports, setReports] = useState<Report[]>([])
  const [selectedFuel, setSelectedFuel] = useState<FuelType | 'all'>('all')
  const [selectedPosition, setSelectedPosition] = useState<Coordinates | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [note, setNote] = useState('')
  const [fuelType, setFuelType] = useState<FuelType>('gasoline')
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const t = copy[locale]

  useEffect(() => { loadReports().then(setReports).catch(() => { setReports([]); setError(t.apiError) }) }, [t.apiError])
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr' }, [locale])

  const visibleReports = useMemo(() => selectedFuel === 'all' ? reports : reports.filter((report) => report.fuelType === selectedFuel), [reports, selectedFuel])
  const openReportForm = (position: Coordinates) => { setSelectedPosition(position); setIsFormOpen(true); setError('') }
  const submitReport = async () => {
    if (!selectedPosition) return
    try {
      const report = await saveReport({ ...selectedPosition, fuelType, note })
      setReports((current) => [...current, report])
      setIsFormOpen(false); setSelectedPosition(null); setNote(''); setError('')
    } catch {
      setError(t.apiError)
    }
  }
  const locate = () => {
    if (!navigator.geolocation) { setError(t.locationError); return }
    navigator.geolocation.getCurrentPosition((position) => openReportForm({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setError(t.locationError))
  }
  const searchPlace = async (event: FormEvent) => {
    event.preventDefault(); if (!searchValue.trim()) return
    setIsSearching(true); setError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tn&q=${encodeURIComponent(searchValue)}`)
      const results = await response.json()
      if (!results[0]) throw new Error('not found')
      openReportForm({ latitude: Number(results[0].lat), longitude: Number(results[0].lon) })
    } catch { setError(t.searchError) } finally { setIsSearching(false) }
  }
  const markerIcon = (fuel: FuelType) => L.divIcon({ className: 'custom-marker', html: `<div style="--marker-color:${fuelColors[fuel]}"><span></span></div>`, iconSize: [32, 42], iconAnchor: [16, 40] })

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><MapPin size={18} /></span><span className="brand-copy"><span className="brand-name">fama<span>carburant</span></span><a className="powered-by" href="https://powermaps.tech/" target="_blank" rel="noreferrer">Powered by <strong>Powermaps</strong></a></span></div><div className="header-actions"><button className="export-button" onClick={() => exportReports(reports)}><Download size={14} />{t.export}</button><span className="mode-badge"><span className="status-dot" />{t.local}</span><div className="language-switcher">{(['fr', 'en', 'ar'] as Locale[]).map((item) => <button key={item} className={locale === item ? 'active' : ''} onClick={() => setLocale(item)}>{item.toUpperCase()}</button>)}</div></div></header>
    <section className="intro"><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="subtitle">{t.subtitle}</p></div><button className="primary-button" onClick={() => setIsFormOpen(true)}><MapPin size={17} />{t.add}</button></section>
    <section className="map-layout"><aside className="control-panel"><div className="panel-heading"><div><p className="eyebrow">{t.local}</p><h2>{reports.length} <span>{t.reports}</span></h2></div><span className="pulse-ring"><span /></span></div><form className="search-form" onSubmit={searchPlace}><Search size={17} /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} /><button type="submit" aria-label={t.searchPlaceholder} disabled={isSearching}>{isSearching ? '...' : <Navigation size={16} />}</button></form><button className="location-button" onClick={locate}><LocateFixed size={16} />{t.locate}</button><div className="filter-section"><p className="section-label">{t.fuel}</p><div className="filters"><button className={selectedFuel === 'all' ? 'selected' : ''} onClick={() => setSelectedFuel('all')}>{t.all}<span>{reports.length}</span></button>{FUEL_TYPES.map((fuel) => <button key={fuel} className={selectedFuel === fuel ? 'selected' : ''} onClick={() => setSelectedFuel(fuel)}><i style={{ backgroundColor: fuelColors[fuel] }} />{FUEL_LABELS[fuel][locale]}<span>{reports.filter((report) => report.fuelType === fuel).length}</span></button>)}</div></div><div className="legend-note"><CircleAlert size={15} /><span>{t.localText}</span></div>{error && <p className="error-message"><CircleAlert size={15} />{error}</p>}</aside><div className="map-frame"><MapContainer center={mapCenter} zoom={7} scrollWheelZoom className="map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapClick onSelect={openReportForm} /><MapRecenter position={selectedPosition} />{visibleReports.map((report) => <Marker key={report.id} position={[report.latitude, report.longitude]} icon={markerIcon(report.fuelType)}><Popup><strong>{FUEL_LABELS[report.fuelType][locale]}</strong>{report.note && <p>{report.note}</p>}<small>{new Date(report.createdAt).toLocaleDateString(locale)}</small></Popup></Marker>)}</MapContainer><div className="map-hint"><MapPin size={15} />{t.choose}</div></div></section>
+    {isFormOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}><section className="report-modal" aria-label={t.add}><button className="close-button" onClick={() => setIsFormOpen(false)} aria-label={t.close}><X size={18} /></button><p className="eyebrow">{t.eyebrow}</p><h2>{t.add}</h2><p className="modal-location"><MapPin size={15} />{selectedPosition ? `${selectedPosition.latitude.toFixed(4)}, ${selectedPosition.longitude.toFixed(4)}` : t.selected}</p><label className="field-label">{t.fuel}<div className="fuel-options">{FUEL_TYPES.map((fuel) => <button type="button" key={fuel} className={fuelType === fuel ? 'selected' : ''} onClick={() => setFuelType(fuel)}><i style={{ backgroundColor: fuelColors[fuel] }} />{FUEL_LABELS[fuel][locale]}</button>)}</div></label><label className="field-label">{t.note}<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} maxLength={140} /></label><div className="modal-actions"><button className="secondary-button" onClick={() => setIsFormOpen(false)}>{t.cancel}</button><button className="primary-button" onClick={submitReport} disabled={!selectedPosition}><Send size={16} />{t.publish}</button></div></section></div>}
+  </main>
}

export default App
