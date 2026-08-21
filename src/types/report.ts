export const FUEL_TYPES = ['gasoline', 'diesel', 'diesel50'] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export type Report = {
  id: string
  latitude: number
  longitude: number
  fuelType: FuelType
  note?: string
  createdAt: string
  expiresAt: string
}

export const FUEL_LABELS: Record<FuelType, { fr: string; en: string; ar: string }> = {
  gasoline: { fr: 'Essence', en: 'Gasoline', ar: 'بنزين' },
  diesel: { fr: 'Gasoil', en: 'Diesel', ar: 'ديزل' },
  diesel50: { fr: 'Gasoil 50', en: 'Diesel 50', ar: 'ديزل 50' },
}
