/**
 * Client HTTP bas niveau pour l'API notrerpn.org.
 * Responsabilité unique : communiquer avec l'API distante.
 * Aucune logique métier, aucune connaissance du modèle de domaine.
 */

import * as https from 'https'

// ── Types des payloads envoyés ─────────────────────────────────────────────

export interface RpnCreateMemberPayload {
  first_name: string
  last_name: string
  birthdate: string           // YYYY-MM-DD
  country: string             // code ISO 3166-1 alpha-2
  nationality: string         // code ISO 3166-1 alpha-2
  city: string
  region: string
  gender: 'MALE' | 'FEMALE'
  identification_type: string
  email: string
  arrival_date_after_limit: boolean
  type: 'RESIDENT' | 'VISITOR'
  relation_reference: string
  relationship: string
}

export interface RpnActivationPayload {
  reference: string
  reason: string
  activate: boolean
}

// ── Types des réponses reçues ──────────────────────────────────────────────

export interface RpnMemberCreatedResponse {
  matricule: string
  reference: string
  firstName: string
  lastName: string
  type: string
  gender: string
  status: string
  community: string
  createdAt: string
  probationEndDate: string
}

// ── Infrastructure interne (HTTP + cache de session) ──────────────────────

const API_HOST = 'api.notrerpn.org'

let _tokenCache: { value: string; expiresAt: number } | null = null
let _adminReferenceCache: string | null = null

function httpRequest<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  options: { headers?: Record<string, string>; body?: unknown } = {}
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    }
    if (bodyStr) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString()
    }

    const req = https.request(
      { hostname: API_HOST, path, method, headers },
      (res) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} ${method} ${path} — ${data}`))
          }
          try {
            resolve(JSON.parse(data) as T)
          } catch {
            reject(new Error(`Réponse non-JSON (${method} ${path}) — ${data}`))
          }
        })
      }
    )
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

async function fetchToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.value

  const username = process.env.EXTERNAL_APP_EMAIL
  const password = process.env.EXTERNAL_APP_PASSWORD
  if (!username || !password) {
    throw new Error('Variables EXTERNAL_APP_EMAIL ou EXTERNAL_APP_PASSWORD manquantes dans .env')
  }

  const resp = await httpRequest<{ token: string }>('POST', '/users/login', {
    body: { username, password },
  })

  const [, payloadB64] = resp.token.split('.')
  const { exp } = JSON.parse(Buffer.from(payloadB64, 'base64').toString()) as { exp: number }

  _tokenCache = { value: resp.token, expiresAt: exp * 1000 - 60_000 }
  _adminReferenceCache = null  // invalider lors du renouvellement de session

  return _tokenCache.value
}

// ── Fonctions exportées ────────────────────────────────────────────────────

/**
 * Retourne la référence du compte administrateur sur notrerpn.org.
 * Priorité à RPN_ADMIN_REFERENCE (variable d'env), sinon appel GET /users/me.
 */
export async function getAdminReference(): Promise<string> {
  if (_adminReferenceCache) return _adminReferenceCache

  const envRef = process.env.RPN_ADMIN_REFERENCE
  if (envRef) {
    _adminReferenceCache = envRef
    return _adminReferenceCache
  }

  const token = await fetchToken()
  const me = await httpRequest<{ reference?: string }>('GET', '/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!me.reference) {
    throw new Error('/users/me ne retourne pas de champ "reference"')
  }
  _adminReferenceCache = me.reference
  return _adminReferenceCache
}

/**
 * Inscrit un nouveau membre sur notrerpn.org.
 * Lève une erreur en cas d'échec HTTP.
 */
export async function createMember(
  payload: RpnCreateMemberPayload
): Promise<RpnMemberCreatedResponse> {
  const token = await fetchToken()
  return httpRequest<RpnMemberCreatedResponse>('POST', '/members', {
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  })
}

/**
 * Active ou désactive un membre sur notrerpn.org.
 * Lève une erreur en cas d'échec HTTP.
 */
export async function setMemberActivation(payload: RpnActivationPayload): Promise<void> {
  const token = await fetchToken()
  await httpRequest('PUT', '/members/admin/activate', {
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  })
}
