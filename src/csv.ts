import Papa from 'papaparse'

export const EXPECTED_COLUMNS = [
  'case_id',
  'email',
  'requested_at',
  'reported_at',
  'reported_status',
  'audit_at',
  'request_text',
] as const

export type RequestRecord = Record<(typeof EXPECTED_COLUMNS)[number], string> & {
  _row: number
}

export type ParsedCsv = {
  records: RequestRecord[]
  extraColumns: string[]
  skippedRows: number
}

export class CsvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvValidationError'
  }
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  })

  if (!result.meta.fields?.length) {
    throw new CsvValidationError('No header row was found. Choose a CSV with a column header row.')
  }

  const fields = result.meta.fields
  const missing = EXPECTED_COLUMNS.filter((column) => !fields.includes(column))
  if (missing.length) {
    throw new CsvValidationError(`Missing required columns: ${missing.join(', ')}.`)
  }

  const errors = result.errors
  if (errors.length) {
    throw new CsvValidationError(
      `The CSV could not be parsed safely (${errors.length} parsing issue${errors.length === 1 ? '' : 's'}). Check quoting and delimiters, then try again.`,
    )
  }

  const rows = result.data
  let skippedRows = 0
  const records = rows.flatMap((row, index) => {
    if (!row || Object.values(row).every((value) => value === undefined || value === '')) {
      skippedRows += 1
      return []
    }
    return [{
      _row: index + 2,
      case_id: row.case_id ?? '',
      email: row.email ?? '',
      requested_at: row.requested_at ?? '',
      reported_at: row.reported_at ?? '',
      reported_status: row.reported_status ?? '',
      audit_at: row.audit_at ?? '',
      request_text: row.request_text ?? '',
    }]
  })

  if (!records.length) {
    throw new CsvValidationError('The file has the expected columns, but no non-empty records were found.')
  }

  return {
    records,
    extraColumns: fields.filter((field) => !EXPECTED_COLUMNS.includes(field as (typeof EXPECTED_COLUMNS)[number])),
    skippedRows,
  }
}

export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return email ? '••••••' : '—'
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const visible = local.length > 1 ? `${local[0]}•••` : '••••'
  return `${visible}@${domain}`
}

export function formatCell(value: string): string {
  return value.trim() || '—'
}
