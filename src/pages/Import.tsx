import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { Link as LinkIcon, Camera, Sparkles } from 'lucide-react'
import type { DraftSchema } from '../lib/types/recipe'

export function Import() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'url' | 'ocr'>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleUrlImport = async () => {
    if (!url || !user) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data, error: edgeError } = await callEdgeFunction<DraftSchema>('import-url', { url })

      if (edgeError) {
        setError(edgeError)
        setLoading(false)
        return
      }

      if (data) {
        // Show success message based on confidence
        if (data.confidence && data.confidence >= 0.9) {
          setSuccessMessage('✨ Recipe imported with high confidence!')
        } else if (data.confidence && data.confidence >= 0.7) {
          setSuccessMessage('✓ Recipe imported successfully')
        }

        const { data: recipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image_url: data.image_url,
            source_url: url,
            ingredients: data.ingredients,
            steps: data.steps,
            tags: data.tags,
            owner_id: user.id,
            status: 'draft',
            import_method: 'url',
            import_source: url,
            slug: ''
          })
          .select()
          .single()

        if (insertError) throw insertError
        
        // Brief delay to show success message
        setTimeout(() => {
          navigate(`/drafts/${recipe.id}`)
        }, 800)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleOcrImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setLoading(true)
    setError(null)

    try {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ocr-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data, error: edgeError } = await callEdgeFunction<DraftSchema>('import-ocr', {
        storage_path: filePath
      })

      if (edgeError) {
        setError(edgeError)
        setLoading(false)
        return
      }

      if (data) {
        const { data: recipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image_url: data.image_url,
            source_url: data.source_url,
            ingredients: data.ingredients,
            steps: data.steps,
            tags: data.tags,
            owner_id: user.id,
            status: 'draft',
            import_method: 'ocr',
            import_source: fileName,
            slug: ''
          })
          .select()
          .single()

        if (insertError) throw insertError
        navigate(`/drafts/${recipe.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Import Recipe"
      belowHeader={
        <div className="flex gap-6 border-b border-gray-200 -mb-px">
          <button
            onClick={() => setTab('url')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'url'
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            From URL
          </button>
          <button
            onClick={() => setTab('ocr')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'ocr'
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            From Photo
          </button>
        </div>
      }
    >
      <div className="max-w-2xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <Sparkles size={20} />
            {successMessage}
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">
                Recipe URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent"
                />
                <button
                  onClick={handleUrlImport}
                  disabled={loading || !url}
                  className="px-6 py-3 bg-[#C0622F] text-white rounded-lg hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LinkIcon size={20} />
                  {loading ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
            <p className="text-sm text-[#1A1A18]/60">
              Paste a link to a recipe from any website. We support 376+ recipe sites with high-accuracy extraction.
            </p>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Works best with popular sites like AllRecipes, Food Network, Bon Appétit, Serious Eats, and 370+ more!
              </p>
            </div>
          </div>
        )}

        {tab === 'ocr' && (
          <div className="space-y-4">
            <label className="block w-full cursor-pointer">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#C0622F] transition-colors">
                <Camera size={48} className="mx-auto mb-4 text-[#C0622F]" />
                <p className="text-lg font-medium text-[#1A1A18] mb-2">
                  {loading ? 'Processing image…' : 'Take or upload a photo'}
                </p>
                <p className="text-sm text-[#1A1A18]/60">
                  Photograph a recipe from a book or magazine
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOcrImport}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </Layout>
  )
}
