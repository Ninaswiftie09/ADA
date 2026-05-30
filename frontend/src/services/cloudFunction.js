import { auth } from './firebase'

const FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL

export async function optimizeRoute(destinations, mode) {
  const token = await auth.currentUser.getIdToken()

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ destinations, mode }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || 'Error calling cloud function')
  return data
}
