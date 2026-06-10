import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '/utils/supabase/info'

const supabaseUrl = `https://${projectId}.supabase.co`

// Use a global singleton to prevent multiple instances across hot reloads
const GLOBAL_KEY = '__supabase_client__'

function getSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if (!(window as any)[GLOBAL_KEY]) {
      (window as any)[GLOBAL_KEY] = createClient(supabaseUrl, publicAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'umami-auth',
        }
      })
    }
    return (window as any)[GLOBAL_KEY]
  }

  // Server-side fallback (shouldn't happen in this app)
  return createClient(supabaseUrl, publicAnonKey)
}

export const supabase = getSupabaseClient()

export async function callEdgeFunction<T>(
  name: string,
  body: object
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-b410369f/${name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }
    )

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    if (!response.ok) {
      let errorMessage = 'Request failed'

      if (isJson) {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } else {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }

      return { data: null, error: `HTTP ${response.status}: ${errorMessage}` }
    }

    if (!isJson) {
      const text = await response.text()
      return { data: null, error: text || 'Edge function returned a non-JSON response' }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    console.error('Edge function error:', err)

    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      return {
        data: null,
        error: 'Network error reaching the import service. Verify the Supabase function is deployed and reachable, then try again.'
      }
    }

    return { data: null, error: err instanceof Error ? err.message : 'Unexpected error. Please try again.' }
  }
}
