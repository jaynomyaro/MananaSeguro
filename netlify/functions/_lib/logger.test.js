import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger, redactIdentifier, sanitizeMeta } from './logger.js'

describe('redactIdentifier', () => {
  it('keeps only the last 4 characters', () => {
    expect(redactIdentifier('abc123456789')).toBe('***6789')
  })

  it('masks short values', () => {
    expect(redactIdentifier('ab')).toBe('****')
  })
})

describe('sanitizeMeta', () => {
  it('drops email and nombre fields', () => {
    const result = sanitizeMeta({
      email: 'user@example.com',
      nombre: 'Juan',
      orderId: 'order-uuid-1234',
    })
    expect(result.email).toBeUndefined()
    expect(result.nombre).toBeUndefined()
    expect(result.orderId).toBe('***1234')
  })
})

describe('createLogger', () => {
  let consoleSpy

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  function lastLogEntry() {
    const raw = consoleSpy.mock.calls.at(-1)[0]
    return JSON.parse(raw)
  }

  it('generates a UUID v4 requestId per invocation', () => {
    const logA = createLogger('test-fn')
    const logB = createLogger('test-fn')
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    expect(logA.requestId).toMatch(uuidRe)
    expect(logB.requestId).toMatch(uuidRe)
    expect(logA.requestId).not.toBe(logB.requestId)
  })

  it('emits info level JSON with required fields', () => {
    const log = createLogger('etherfuse-webhook')
    log.info('Evento recibido', { type: 'kyc_updated' })

    const entry = lastLogEntry()
    expect(entry.level).toBe('info')
    expect(entry.function).toBe('etherfuse-webhook')
    expect(entry.requestId).toBe(log.requestId)
    expect(entry.message).toBe('Evento recibido')
    expect(entry.type).toBe('kyc_updated')
    expect(entry.timestamp).toBeTruthy()
  })

  it('emits warn level JSON', () => {
    const log = createLogger('auth-google')
    log.warn('Token inválido', { reason: 'expired' })

    const entry = lastLogEntry()
    expect(entry.level).toBe('warn')
    expect(entry.function).toBe('auth-google')
    expect(entry.requestId).toBe(log.requestId)
    expect(entry.message).toBe('Token inválido')
    expect(entry.reason).toBe('expired')
  })

  it('emits error level JSON', () => {
    const log = createLogger('metas')
    log.error('Error inesperado', { detail: 'db timeout' })

    const entry = lastLogEntry()
    expect(entry.level).toBe('error')
    expect(entry.function).toBe('metas')
    expect(entry.requestId).toBe(log.requestId)
    expect(entry.message).toBe('Error inesperado')
    expect(entry.detail).toBe('db timeout')
  })

  it('redacts identifiers in metadata and omits email', () => {
    const log = createLogger('etherfuse-deposit')
    log.info('Quote creado', {
      email: 'secret@example.com',
      customerId: 'cust-abcdef9999',
      montoMxn: 500,
    })

    const entry = lastLogEntry()
    expect(entry.email).toBeUndefined()
    expect(entry.customerId).toBe('***9999')
    expect(entry.montoMxn).toBe(500)
  })

  it('uses the same requestId across log calls in one invocation', () => {
    const log = createLogger('order-status')
    log.info('Consulta iniciada')
    log.warn('Parámetros incompletos')

    const first = JSON.parse(consoleSpy.mock.calls[0][0])
    const second = JSON.parse(consoleSpy.mock.calls[1][0])
    expect(first.requestId).toBe(second.requestId)
    expect(first.requestId).toBe(log.requestId)
  })
})
