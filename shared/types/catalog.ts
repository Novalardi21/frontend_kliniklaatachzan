export interface PublicCatalog {
  packages: {
    id: string
    name: string
    label: string
    description: string
    methodId: string
    price: number
    duration: string
    icon: string
    featured: boolean
    benefits: string[]
  }[]
  methods: { id: string, name: string, description: string, icon: string }[]
  providers: {
    id: string
    name: string
    role: string
    description: string
    image: string
  }[]
  sessions: {
    id: string
    name: string
    time: string
    description: string
    icon: string
  }[]
}
