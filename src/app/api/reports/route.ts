import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import type { FuelType, Report } from '../../../types/report'

export const runtime = 'nodejs'

const REPORT_TTL_MS = 7 * 24 * 60 * 60 * 1000
const signalsPath = path.join(process.cwd(), 'public', 'signals.json')
const fuelTypes = new Set<FuelType>(['gasoline', 'diesel', 'diesel50'])

type ReportInput = { latitude?: unknown; longitude?: unknown; fuelType?: unknown; note?: unknown }

const isFuelType = (value: unknown): value is FuelType => typeof value === 'string' && fuelTypes.has(value as FuelType)

const isReport = (value: unknown): value is Report => {
  if (!value || typeof value !== 'object') return false
  const report = value as Partial<Report>
  return typeof report.id === 'string' && typeof report.latitude === 'number' && typeof report.longitude === 'number' && typeof report.fuelType === 'string' && fuelTypes.has(report.fuelType) && typeof report.createdAt === 'string' && typeof report.expiresAt === 'string'
}

const removeExpired = (reports: Report[]) => reports.filter((report) => new Date(report.expiresAt).getTime() > Date.now())

const readReports = async () => {
  const content = await readFile(signalsPath, 'utf8')
  const parsed: unknown = JSON.parse(content)
  return Array.isArray(parsed) ? removeExpired(parsed.filter(isReport)) : []
}

const writeReports = (reports: Report[]) => writeFile(signalsPath, `${JSON.stringify(reports, null, 2)}\n`, 'utf8')

export async function GET() {
  try {
    const reports = await readReports()
    await writeReports(reports)
    return NextResponse.json(reports)
  } catch {
    return NextResponse.json({ error: 'Unable to read signals.json.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: ReportInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (typeof body.latitude !== 'number' || body.latitude < 30 || body.latitude > 38 || typeof body.longitude !== 'number' || body.longitude < 7 || body.longitude > 12 || !isFuelType(body.fuelType)) {
    return NextResponse.json({ error: 'Invalid report.' }, { status: 400 })
  }

  try {
    const reports = await readReports()
    const createdAt = new Date()
    const report: Report = {
      id: `local-${crypto.randomUUID()}`,
      latitude: body.latitude,
      longitude: body.longitude,
      fuelType: body.fuelType,
      note: typeof body.note === 'string' ? body.note.trim().slice(0, 140) || undefined : undefined,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + REPORT_TTL_MS).toISOString(),
    }
    await writeReports([...reports, report])
    return NextResponse.json(report, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to write signals.json.' }, { status: 500 })
  }
}
