import type { Report } from '../types/report'

export const REPORT_TTL_MS = 7 * 24 * 60 * 60 * 1000

type NewReport = Pick<Report, 'latitude' | 'longitude' | 'fuelType'> & { note?: string }

export const loadReports = async (): Promise<Report[]> => {
  const response = await fetch('/api/reports', { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load reports')
  return response.json() as Promise<Report[]>
}

export const saveReport = async (input: NewReport): Promise<Report> => {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Unable to save report')
  return response.json() as Promise<Report>
}

export const exportReports = (reports: Report[]) => {
  const activeReports = reports.filter((report) => new Date(report.expiresAt).getTime() > Date.now())
  const file = new Blob([JSON.stringify(activeReports, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = 'signals.json'
  link.click()
  URL.revokeObjectURL(url)
}
