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

export type ImportFlagField =
  | 'title'
  | 'description'
  | 'ingredients'
  | 'steps'
  | 'image'
  | 'source'
  | 'general'

export type ImportFlagSeverity = 'info' | 'warning' | 'error'

export type ImportFlag = {
  field: ImportFlagField
  severity: ImportFlagSeverity
  message: string
}

export type RecipePublisher = {
  nickname: string | null
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
  servings: number | null
  status: 'draft' | 'published'
  owner_id: string
  publisher?: RecipePublisher | null
  share_token: string | null
  share_enabled: boolean
  import_method: 'manual' | 'url' | 'ocr' | 'fork'
  import_source: string | null
  raw_text?: string | null
  import_confidence?: number | null
  import_errors?: string[]
  import_warnings?: string[]
  import_flags?: ImportFlag[]
  import_reviewed_at?: string | null
  ocr_engine?: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type OcrImportResult = DraftSchema & {
  ocr_engine?: string | null
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
  warnings?: string[]
  flags?: ImportFlag[]
}

export type Profile = {
  id: string
  display_name: string | null
  created_at: string
}
