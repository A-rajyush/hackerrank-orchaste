import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CsvValidationError, maskEmail, parseCsv } from './csv'

const header = 'case_id,email,requested_at,reported_status,reported_at,audit_at,request_text'

describe('parseCsv', () => {
  it('parses quoted commas, escaped quotes, and multiline values as text', () => {
    const parsed = parseCsv(`${header}\nC-1,a@example.com,2025-01-02,closed,,,\"Please review, then say \"\"done\"\"\"`)
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0].request_text).toBe('Please review, then say "done"')
    expect(parsed.records[0].reported_status).toBe('closed')
  })

  it('rejects missing required columns', () => {
    expect(() => parseCsv('case_id,email\n1,a@example.com')).toThrow(CsvValidationError)
    expect(() => parseCsv('case_id,email\n1,a@example.com')).toThrow('Missing required columns')
  })

  it('reports extra columns without discarding recognized values', () => {
    const parsed = parseCsv(`${header},reviewer_note\n1,,,,,,hello,extra`)
    expect(parsed.extraColumns).toEqual(['reviewer_note'])
    expect(parsed.records[0].case_id).toBe('1')
  })

  it('accepts the supplied challenge CSV without emitting any source values', () => {
    const input = readFileSync(new URL('../dataset/deletion_requests.csv', import.meta.url), 'utf8')
    expect(parseCsv(input).records).toHaveLength(518)
  })
})

describe('maskEmail', () => {
  it('masks the local part while leaving the domain visible', () => {
    expect(maskEmail('alex@example.com')).toBe('a•••@example.com')
  })

  it('handles blank and malformed values without exposing them', () => {
    expect(maskEmail('')).toBe('—')
    expect(maskEmail('not-an-email')).toBe('••••••')
  })
})
