import { randomUUID } from 'crypto'

const PII_KEY_PATTERN = /email|nombre|displayname/i
const IDENTIFIER_KEY_PATTERN =
  /(^id$|id$|key$|address$|clabe$|wallet|customer|order|quote|usuario|google|stellar|public)/i

/**
 * Redacts identifiers to the last 4 characters for log safety.
 */
export function redactIdentifier(value) {
  if (value == null) return value
  const s = String(value)
  if (s.length <= 4) return '****'
  return `***${s.slice(-4)}`
}

/**
 * Removes PII and truncates identifiers in metadata before logging.
 */
export function sanitizeMeta(meta) {
  if (meta == null) return {}
  if (typeof meta !== 'object' || Array.isArray(meta)) return {}

  const out = {}
  for (const [key, value] of Object.entries(meta)) {
    if (PII_KEY_PATTERN.test(key)) continue

    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeMeta(value)
      continue
    }

    if (
      typeof value === 'string' &&
      (IDENTIFIER_KEY_PATTERN.test(key) || value.includes('@') || value.startsWith('G'))
    ) {
      if (value.includes('@')) continue
      out[key] = redactIdentifier(value)
      continue
    }

    out[key] = value
  }
  return out
}

function emit(level, functionName, requestId, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    function: functionName,
    requestId,
    message,
    ...sanitizeMeta(meta),
  }
  console.log(JSON.stringify(entry))
}

/**
 * Creates a per-invocation logger with a unique requestId for support traceability.
 *
 * @param {string} functionName - Netlify function name (e.g. etherfuse-webhook)
 * @returns {{ requestId: string, info: Function, warn: Function, error: Function }}
 */
export function createLogger(functionName) {
  const requestId = randomUUID()

  return {
    requestId,
    info(message, meta = {}) {
      emit('info', functionName, requestId, message, meta)
    },
    warn(message, meta = {}) {
      emit('warn', functionName, requestId, message, meta)
    },
    error(message, meta = {}) {
      emit('error', functionName, requestId, message, meta)
    },
  }
}

/**
 * Builds a JSON error response body including requestId for client support.
 */
export function errorBody(log, error, extra = {}) {
  return JSON.stringify({ error, requestId: log.requestId, ...extra })
}

/**
 * Adds requestId to error response bodies returned by inner handlers.
 */
export function withRequestId(log, result) {
  if (result.statusCode >= 400 && result.body) {
    try {
      const body = JSON.parse(result.body)
      body.requestId = log.requestId
      return { ...result, body: JSON.stringify(body) }
    } catch {
      return result
    }
  }
  return result
}
