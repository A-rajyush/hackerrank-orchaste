import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogSurface,
  DialogTitle,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
} from '@fluentui/react-components'
import {
  ArrowDownloadRegular,
  ArrowSortRegular,
  CheckmarkCircleRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  DismissRegular,
  EyeRegular,
  EyeOffRegular,
  SearchRegular,
  ShieldLockRegular,
  WarningRegular,
} from '@fluentui/react-icons'
import { formatCell, maskEmail, parseCsv, type RequestRecord } from './csv'

const PAGE_SIZE = 10
const MAX_FILE_BYTES = 20 * 1024 * 1024

type SortField = 'case_id' | 'requested_at' | 'reported_at' | 'reported_status'

const useStyles = makeStyles({
  table: { minWidth: '790px' },
})

function App() {
  const styles = useStyles()
  const fileInput = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<RequestRecord[]>([])
  const [fileName, setFileName] = useState('')
  const [extraColumns, setExtraColumns] = useState<string[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('requested_at')
  const [sortAscending, setSortAscending] = useState(false)
  const [page, setPage] = useState(1)
  const [revealEmails, setRevealEmails] = useState(false)
  const [selected, setSelected] = useState<RequestRecord | null>(null)

  const statuses = useMemo(
    () => [...new Set(records.map((record) => record.reported_status).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [records],
  )
  const dates = useMemo(
    () => [...new Set(records.map((record) => record.requested_at).filter(Boolean))].sort((a, b) => b.localeCompare(a)),
    [records],
  )
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    records.forEach((record) => {
      const value = record.reported_status || '(blank source value)'
      counts.set(value, (counts.get(value) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [records])

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return records
      .filter((record) => !statusFilter || record.reported_status === statusFilter)
      .filter((record) => !dateFilter || record.requested_at === dateFilter)
      .filter((record) => !needle || [record.case_id, record.reported_status, record.requested_at, record.reported_at, record.audit_at]
        .some((value) => value.toLocaleLowerCase().includes(needle)))
      .sort((a, b) => {
        const compared = a[sortField].localeCompare(b[sortField], undefined, { numeric: true, sensitivity: 'base' })
        return compared * (sortAscending ? 1 : -1)
      })
  }, [records, search, statusFilter, dateFilter, sortField, sortAscending])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setError('')
    setNotice('')
    if (!file.name.toLocaleLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Choose a .csv file to continue.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('This file is larger than the 20 MB local processing limit. Choose a smaller CSV.')
      return
    }
    setBusy(true)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      setRecords(parsed.records)
      setFileName(file.name)
      setExtraColumns(parsed.extraColumns)
      setSearch('')
      setStatusFilter('')
      setDateFilter('')
      setPage(1)
      setRevealEmails(false)
      setSelected(null)
      setNotice(
        `${parsed.records.length.toLocaleString()} records loaded in this browser session.` +
        (parsed.skippedRows ? ` ${parsed.skippedRows} empty row${parsed.skippedRows === 1 ? '' : 's'} skipped.` : ''),
      )
    } catch (caught) {
      setRecords([])
      setFileName('')
      setExtraColumns([])
      setError(caught instanceof Error ? caught.message : 'The CSV could not be read. Check the file and try again.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setRecords([])
    setFileName('')
    setExtraColumns([])
    setError('')
    setNotice('')
    setSearch('')
    setStatusFilter('')
    setDateFilter('')
    setPage(1)
    setRevealEmails(false)
    setSelected(null)
  }

  function setSort(field: SortField) {
    if (field === sortField) setSortAscending((ascending) => !ascending)
    else {
      setSortField(field)
      setSortAscending(true)
    }
    setPage(1)
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setDateFilter('')
    setPage(1)
  }

  const activeFilterCount = Number(Boolean(search.trim())) + Number(Boolean(statusFilter)) + Number(Boolean(dateFilter))

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Request Ledger home" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><span /></span>
          <span>request<span className="brand-light">ledger</span></span>
        </a>
        <div className="topbar-right">
          <span className="local-indicator"><span /> Local session</span>
          <span className="topbar-divider" />
          <span className="topbar-note"><ShieldLockRegular /> Private by design</span>
        </div>
      </header>

      <div className="content">
        <section className="intro">
          <div className="eyebrow"><span className="eyebrow-line" /> PRIVATE CSV WORKSPACE</div>
          <div className="intro-heading">
            <div>
              <h1>Deletion request<br /><span>review ledger</span></h1>
              <p className="intro-copy">A clear view of what your CSV reports. Nothing more, nothing less.</p>
            </div>
            <div className="session-stamp"><span className="stamp-dot" /> BROWSER-ONLY SESSION</div>
          </div>
        </section>

        <section className="evidence-banner" aria-label="Evidence and compliance notice">
          <div className="banner-icon"><WarningRegular /></div>
          <div className="banner-copy">
            <strong>Evidence boundary</strong>
            <p>Compliance is <b>Unevaluated</b>. Every reported status is <b>Unverified</b> and comes from the selected CSV. This workspace does not verify deletion or perform an audit.</p>
          </div>
          <div className="banner-side"><span>NO POLICY OR SOURCE EVIDENCE CONNECTED</span><span className="banner-side-line" /></div>
        </section>

        <section className="privacy-strip" aria-label="Privacy promise">
          <ShieldLockRegular />
          <p><b>Your file stays here.</b> It is processed in this browser session only—not uploaded, logged, or saved. Refreshing or closing this page clears it.</p>
          <span className="privacy-seal"><CheckmarkCircleRegular /> LOCAL ONLY</span>
        </section>

        {!records.length ? (
          <section className={`import-card ${error ? 'has-error' : ''}`} aria-labelledby="import-title">
            <div className="import-visual" aria-hidden="true">
              <div className="file-illustration"><span className="file-fold" /><span className="file-lines"><i /><i /><i /></span><span className="file-arrow"><ArrowDownloadRegular /></span></div>
            </div>
            <div className="import-content">
              <div className="import-kicker">START WITH A LOCAL FILE</div>
              <h2 id="import-title">Bring your request ledger</h2>
              <p className="import-description">Choose a CSV from your device. We’ll check its columns and prepare an in-browser view—your data never leaves this tab.</p>
              <div className="required-cols"><span>EXPECTED COLUMNS</span><code>case_id · email · requested_at · reported_status · reported_at · audit_at · request_text</code></div>
              <div className="import-actions">
                <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleFile} aria-label="Choose a CSV file" tabIndex={-1} />
                <Button appearance="primary" size="large" icon={busy ? <Spinner size="tiny" /> : <ArrowDownloadRegular />} onClick={() => fileInput.current?.click()} disabled={busy}>
                  {busy ? 'Reading file…' : 'Choose a CSV file'}
                </Button>
                <span className="file-hint">CSV only · up to 20 MB</span>
              </div>
              {error && <div role="alert" className="error-message"><WarningRegular /> <span>{error}</span></div>}
              <div className="import-footnote"><span className="footnote-dot" /> No sample data · no automatic file access</div>
            </div>
          </section>
        ) : (
          <>
            <section className="overview-head">
              <div>
                <div className="section-kicker">SESSION OVERVIEW</div>
                <h2>Your imported snapshot</h2>
              </div>
              <div className="loaded-file"><span className="loaded-file-dot" /><span title={fileName}>{fileName}</span><button type="button" onClick={reset} aria-label="Remove selected file"><DismissRegular /></button></div>
            </section>

            <section className="metric-grid" aria-label="CSV descriptive summary">
              <article className="metric-card">
                <div className="metric-label">RECORDS IN CSV <span className="metric-symbol record-symbol">#</span></div>
                <div className="metric-value">{records.length.toLocaleString()}</div>
                <div className="metric-caption">Parsed rows from source file</div>
              </article>
              <article className="metric-card">
                <div className="metric-label">SOURCE STATUS VALUES <span className="metric-symbol status-symbol">≋</span></div>
                <div className="metric-value">{statuses.length.toLocaleString()}<small> distinct</small></div>
                <div className="metric-caption">All values remain unverified</div>
              </article>
              <article className="metric-card metric-evidence">
                <div className="metric-label">COMPLIANCE REVIEW <span className="metric-symbol evidence-symbol">!</span></div>
                <div className="metric-value"><span className="unevaluated-mark" />Unevaluated</div>
                <div className="metric-caption">No policy or evidence provided</div>
              </article>
              <article className="metric-card">
                <div className="metric-label">MATCHING RECORDS <span className="metric-symbol matching-symbol">⌕</span></div>
                <div className="metric-value">{filtered.length.toLocaleString()}<small> / {records.length.toLocaleString()}</small></div>
                <div className="metric-caption">After the current filters</div>
              </article>
            </section>

            <section className="status-section">
              <div className="status-section-head"><div><h3>Reported status mix</h3><p>Literal values in the CSV · not verified against a source system</p></div><span className="unverified-legend"><span /> UNVERIFIED</span></div>
              {statusCounts.length ? (
                <div className="status-bars">
                  {statusCounts.map(([status, count]) => (
                    <button type="button" className={`status-row ${statusFilter === status ? 'is-active' : ''}`} key={status} onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1) }} aria-pressed={statusFilter === status}>
                      <span className="status-name" title={status}>{status}</span>
                      <span className="status-bar-track"><span style={{ width: `${Math.max(2, (count / records.length) * 100)}%` }} /></span>
                      <span className="status-count">{count.toLocaleString()}</span>
                      <span className="status-unverified">UNVERIFIED</span>
                    </button>
                  ))}
                </div>
              ) : <p className="empty-status">No non-empty reported status values in this CSV.</p>}
            </section>

            {extraColumns.length > 0 && <div className="column-notice" role="status"><WarningRegular /><span>Additional columns were found and are not displayed: <b>{extraColumns.join(', ')}</b>.</span></div>}
            {notice && <div className="load-notice" role="status"><CheckmarkCircleRegular /><span>{notice} Values remain source-reported and unverified.</span></div>}

            <section className="records-section" aria-labelledby="records-heading">
              <div className="records-heading">
                <div><div className="section-kicker">SOURCE RECORDS</div><h2 id="records-heading">Request ledger</h2></div>
                <div className="record-tools">
                  <Button appearance="subtle" icon={revealEmails ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setRevealEmails((value) => !value)}>{revealEmails ? 'Mask emails' : 'Reveal emails'}</Button>
                  <Button appearance="subtle" icon={<DismissRegular />} onClick={reset}>Clear file</Button>
                </div>
              </div>

              <div className="filter-toolbar">
                <div className="search-wrap"><SearchRegular /><Input value={search} onChange={(_, data) => { setSearch(data.value); setPage(1) }} placeholder="Search case ID or source dates…" aria-label="Search case ID, status, or source dates" /></div>
                <label className="filter-control"><span>REPORTED STATUS</span><Select value={statusFilter} onChange={(event) => { setStatusFilter(event.currentTarget.value); setPage(1) }} aria-label="Filter by source-reported status"><option value="">All source values</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select></label>
                <label className="filter-control"><span>REQUESTED DATE</span><Select value={dateFilter} onChange={(event) => { setDateFilter(event.currentTarget.value); setPage(1) }} aria-label="Filter by source requested date"><option value="">All date values</option>{dates.map((date) => <option key={date} value={date}>{date}</option>)}</Select></label>
                <Button appearance="subtle" className="clear-filters" onClick={clearFilters} disabled={!activeFilterCount}>Clear filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}</Button>
              </div>

              <div className="table-shell">
                {filtered.length ? (
                  <div className="table-scroll">
                    <Table className={styles.table} aria-label="Imported deletion request CSV records">
                      <TableHeader><TableRow>
                        <TableHeaderCell><button className="sort-button" onClick={() => setSort('case_id')}>CASE ID <ArrowSortRegular /></button></TableHeaderCell>
                        <TableHeaderCell>EMAIL <span className="header-private"><ShieldLockRegular /></span></TableHeaderCell>
                        <TableHeaderCell><button className="sort-button" onClick={() => setSort('requested_at')}>REQUESTED AT <ArrowSortRegular /></button></TableHeaderCell>
                        <TableHeaderCell><button className="sort-button" onClick={() => setSort('reported_at')}>REPORTED AT <ArrowSortRegular /></button></TableHeaderCell>
                        <TableHeaderCell><button className="sort-button" onClick={() => setSort('reported_status')}>CSV-REPORTED STATUS <ArrowSortRegular /></button></TableHeaderCell>
                        <TableHeaderCell>DETAILS</TableHeaderCell>
                      </TableRow></TableHeader>
                      <TableBody>{pageRows.map((record) => (
                        <TableRow key={`${record._row}-${record.case_id}`}>
                          <TableCell><button className="case-link" onClick={() => setSelected(record)}>{formatCell(record.case_id)}</button></TableCell>
                          <TableCell><span className="email-value">{revealEmails ? formatCell(record.email) : maskEmail(record.email)}</span></TableCell>
                          <TableCell><span className="date-value">{formatCell(record.requested_at)}</span></TableCell>
                          <TableCell><span className="date-value">{formatCell(record.reported_at)}</span></TableCell>
                          <TableCell><span className="reported-pill"><span />{formatCell(record.reported_status)}<b>UNVERIFIED</b></span></TableCell>
                          <TableCell><Button appearance="subtle" size="small" onClick={() => setSelected(record)} aria-label={`Inspect CSV row ${record._row}`}>Inspect <span aria-hidden="true">↗</span></Button></TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  </div>
                ) : <div className="no-results"><SearchRegular /><h3>No matching records</h3><p>Try adjusting your search or filters.</p><Button appearance="subtle" onClick={clearFilters}>Clear all filters</Button></div>}
              </div>
              <div className="table-footer"><span>Showing <b>{filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</b> of <b>{filtered.length}</b> matching records</span><div className="pagination"><Button appearance="subtle" icon={<ChevronLeftRegular />} onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page" /><span>Page <b>{currentPage}</b> of <b>{pageCount}</b></span><Button appearance="subtle" icon={<ChevronRightRegular />} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount} aria-label="Next page" /></div></div>
              <div className="table-disclaimer"><span className="disclaimer-dot" /> CSV values are shown as provided. No deletion, audit, or compliance outcome is determined here.</div>
            </section>
          </>
        )}

        <footer className="page-footer"><span>REQUEST LEDGER <span className="footer-separator">/</span> LOCAL REVIEW TOOL</span><span>NO DATA LEAVES THIS BROWSER <span className="footer-dot">·</span> NO VERDICTS GENERATED</span></footer>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(_, data) => { if (!data.open) setSelected(null) }}>
        <DialogSurface className="detail-dialog">
          {selected && <DialogBody>
            <div className="dialog-topline"><span>CSV ROW {selected._row.toString().padStart(3, '0')}</span><Button appearance="subtle" icon={<DismissRegular />} aria-label="Close record details" onClick={() => setSelected(null)} /></div>
            <DialogTitle>Record details</DialogTitle>
            <div className="detail-evidence"><WarningRegular /><span>Compliance: <b>Unevaluated</b> · All values are source-reported, not independently verified.</span></div>
            <div className="detail-grid">
              <DetailField label="CASE ID" value={selected.case_id} />
              <div className="detail-field"><span>EMAIL <ShieldLockRegular /></span><strong>{revealEmails ? formatCell(selected.email) : maskEmail(selected.email)}</strong><Checkbox checked={revealEmails} onChange={(_, data) => setRevealEmails(Boolean(data.checked))} label="Reveal email for this session" /></div>
              <DetailField label="REQUESTED AT · SOURCE VALUE" value={selected.requested_at} />
              <DetailField label="REPORTED AT · SOURCE VALUE" value={selected.reported_at} />
              <DetailField label="AUDIT AT · SOURCE VALUE" value={selected.audit_at} />
              <div className="detail-field detail-wide"><span>REPORTED STATUS <Badge appearance="outline" color="warning">UNVERIFIED</Badge></span><strong>{formatCell(selected.reported_status)}</strong><small>Literal value supplied by the CSV; no independent source check was performed.</small></div>
              <DetailField label="REQUEST TEXT · SOURCE VALUE" value={selected.request_text} wide />
            </div>
            <div className="dialog-bottom"><span><ShieldLockRegular /> Kept in browser memory only</span><Button appearance="secondary" onClick={() => setSelected(null)}>Done</Button></div>
          </DialogBody>}
        </DialogSurface>
      </Dialog>
    </main>
  )
}

function DetailField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`detail-field ${wide ? 'detail-wide' : ''}`}><span>{label}</span><strong>{formatCell(value)}</strong></div>
}

export default App
