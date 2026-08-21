import type { Metadata } from 'next'
import '../index.css'
import 'leaflet/dist/leaflet.css'

export const metadata: Metadata = {
  title: 'Fama Carburant',
  description: 'Signaler les ruptures de carburant en Tunisie.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>
}
