import { createWorker, type Worker } from 'tesseract.js'

export interface OcrResult {
  text: string
  confidence: number
}

export interface OcrProgress {
  status: string
  progress: number
}

let worker: Worker | null = null

async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker
  }

  worker = await createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
      }
    },
  })

  return worker
}

export async function extractTextFromImage(
  imageBlob: Blob,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    onProgress?.({ status: 'Initializing OCR engine...', progress: 0 })

    const ocrWorker = await getWorker()

    onProgress?.({ status: 'Recognizing text...', progress: 30 })

    const { data } = await ocrWorker.recognize(imageBlob)

    onProgress?.({ status: 'Processing results...', progress: 90 })

    const text = data.text.trim()
    const confidence = data.confidence / 100

    onProgress?.({ status: 'Complete', progress: 100 })

    return {
      text,
      confidence,
    }
  } catch (error) {
    console.error('OCR extraction failed:', error)
    throw new Error(
      error instanceof Error
        ? `OCR failed: ${error.message}`
        : 'Failed to extract text from image'
    )
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

export function parseRecipeText(text: string): {
  title: string | null
  ingredients: Array<{ amount: string; unit: string; name: string }>
  steps: Array<{ order: number; text: string }>
} {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)

  const title = lines.find(
    (line) =>
      line.length >= 4 &&
      line.length <= 90 &&
      !/^(ingredients?|ingrédients?|directions?|instructions?|method|steps?|préparation|étapes?)/i.test(
        line
      )
  ) || null

  const ingredients: Array<{ amount: string; unit: string; name: string }> = []
  let inIngredientsSection = false

  for (const line of lines) {
    if (/^(ingredients?|ingrédients?)/i.test(line)) {
      inIngredientsSection = true
      continue
    }

    if (
      /^(directions?|instructions?|method|steps?|préparation|étapes?|recette)/i.test(
        line
      )
    ) {
      inIngredientsSection = false
    }

    if (inIngredientsSection) {
      const match = line.match(/^([\d¼½¾⅓⅔⅛⅜⅝⅞\/\.\s]+)?\s*([a-zA-Zàâäéèêëïîôùûüÿç]+)?\s+(.+)$/)
      if (match) {
        ingredients.push({
          amount: (match[1] || '').trim(),
          unit: (match[2] || '').trim(),
          name: (match[3] || line).trim(),
        })
      }
    }
  }

  const steps: Array<{ order: number; text: string }> = []
  let inStepsSection = false

  for (const line of lines) {
    if (
      /^(directions?|instructions?|method|steps?|préparation|étapes?|recette)/i.test(
        line
      )
    ) {
      inStepsSection = true
      continue
    }

    if (inStepsSection) {
      const numberedMatch = line.match(/^(\d+)[\.\):]\s*(.+)$/)
      if (numberedMatch) {
        steps.push({
          order: parseInt(numberedMatch[1], 10),
          text: numberedMatch[2].trim(),
        })
      } else if (line.length >= 30) {
        steps.push({
          order: steps.length + 1,
          text: line,
        })
      }
    }
  }

  return {
    title,
    ingredients,
    steps,
  }
}
