export type Ingredient = {
  amount: string
  unit: string
  name: string
  group?: string
}

export type Step = {
  order: number
  text: string
}

export type RecipePublisher = {
  display_name: string | null
}

export type Recipe = {
  id: string
  slug: string
  title: string
  description: string | null
  image_url: string | null
  source_url: string | null
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  status: 'draft' | 'published'
  owner_id: string
  publisher?: RecipePublisher | null
  share_token: string | null
  share_enabled: boolean
  import_method: 'manual' | 'url' | 'ocr' | 'fork'
  import_source: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type DraftSchema = {
  title: string | null
  description: string | null
  image_url: string | null
  source_url: string | null
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  confidence: number
  raw_text: string | null
  errors: string[]
}

export type Profile = {
  id: string
  display_name: string | null
  created_at: string
}
