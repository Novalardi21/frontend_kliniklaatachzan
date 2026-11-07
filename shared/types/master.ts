export type MasterKind = 'packages' | 'methods' | 'providers'
export interface MasterRecord {
  id: string
  name: string
  description: string
  price: number
  duration: string
  benefits: string[]
  active: boolean
  methodId?: string
  anesthesia?: 'needle' | 'spray'
  usesStitches?: boolean
  image?: string
  role?: string
  capacity?: number
}
export interface MasterSnapshot {
  packages: MasterRecord[]
  methods: MasterRecord[]
  providers: MasterRecord[]
  sessions: { id: string, name: string, time: string, capacity: number }[]
  history: {
    id: string
    name: string
    detail: string
    actor: string
    at: string
  }[]
}
