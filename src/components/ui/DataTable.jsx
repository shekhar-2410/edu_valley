import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'

const DataTable = ({
  rows,
  columns,
  searchPlaceholder = 'Search',
  filters = [],
  pageSizes = [25, 50, 100],
  getRowKey = (row) => row.id,
  rowClassName,
  bulkActions = [],
  emptyMessage = 'No rows match the current view.',
}) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: columns[0]?.key, dir: 'asc' })
  const [filterValues, setFilterValues] = useState({})
  const [pageSize, setPageSize] = useState(pageSizes[0])
  const [page, setPage] = useState(1)
  const [selectedKeys, setSelectedKeys] = useState([])

  const normalizedQuery = query.trim().toLowerCase()

  const processedRows = useMemo(() => {
    let nextRows = [...rows]
    if (normalizedQuery) {
      nextRows = nextRows.filter((row) => columns.some((column) => {
        if (column.searchable === false) return false
        const value = column.searchValue ? column.searchValue(row) : column.accessor ? column.accessor(row) : row[column.key]
        return String(value ?? '').toLowerCase().includes(normalizedQuery)
      }))
    }

    filters.forEach((filter) => {
      const value = filterValues[filter.key]
      if (!value || value === 'all') return
      nextRows = nextRows.filter((row) => String(filter.accessor(row)) === String(value))
    })

    const sortColumn = columns.find((column) => column.key === sort.key)
    if (sortColumn?.sortable !== false) {
      nextRows.sort((a, b) => {
        const aValue = sortColumn?.sortValue ? sortColumn.sortValue(a) : sortColumn?.accessor ? sortColumn.accessor(a) : a[sort.key]
        const bValue = sortColumn?.sortValue ? sortColumn.sortValue(b) : sortColumn?.accessor ? sortColumn.accessor(b) : b[sort.key]
        const result = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
        return sort.dir === 'asc' ? result : -result
      })
    }
    return nextRows
  }, [rows, columns, normalizedQuery, filters, filterValues, sort])

  const pageCount = Math.max(1, Math.ceil(processedRows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleRows = processedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const visibleKeys = visibleRows.map((row) => String(getRowKey(row)))
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedSet.has(key))
  const selectedRows = rows.filter((row) => selectedSet.has(String(getRowKey(row))))
  const hasBulkActions = bulkActions.length > 0

  const updateSort = (key) => {
    setSort((current) => current.key === key
      ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
  }

  const toggleRow = (key) => {
    const stringKey = String(key)
    setSelectedKeys((current) => current.includes(stringKey)
      ? current.filter((item) => item !== stringKey)
      : [...current, stringKey]
    )
  }

  const toggleVisibleRows = () => {
    setSelectedKeys((current) => {
      const currentSet = new Set(current)
      if (allVisibleSelected) {
        visibleKeys.forEach((key) => currentSet.delete(key))
      } else {
        visibleKeys.forEach((key) => currentSet.add(key))
      }
      return [...currentSet]
    })
  }

  const exportCsv = () => {
    const headers = columns.filter((column) => column.export !== false).map((column) => column.header)
    const lines = processedRows.map((row) => columns
      .filter((column) => column.export !== false)
      .map((column) => {
        const value = column.exportValue ? column.exportValue(row) : column.accessor ? column.accessor(row) : row[column.key]
        return `"${String(value ?? '').replaceAll('"', '""')}"`
      })
      .join(',')
    )
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'export.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterValues[filter.key] || 'all'}
              onChange={(event) => {
                setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))
                setPage(1)
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-brand-navy-500"
            >
              <option value="all">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ))}
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download size={15} />
            CSV
          </button>
        </div>
      </div>

      {hasBulkActions && selectedRows.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-navy-100 bg-brand-navy-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-brand-navy-800">{selectedRows.length} selected</p>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={async () => {
                  await action.onClick(selectedRows)
                  setSelectedKeys([])
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                  action.tone === 'danger'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-white text-brand-navy-700 hover:bg-brand-navy-100'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile card list */}
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 md:hidden">
        {visibleRows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
        ) : visibleRows.map((row) => {
          const key = String(getRowKey(row))
          const visibleColumns = columns.filter((col) => col.mobile !== false).slice(0, 3)
          return (
            <div
              key={key}
              className={`flex items-start gap-3 px-4 py-3 ${rowClassName?.(row) || ''}`}
            >
              {hasBulkActions && (
                <input
                  type="checkbox"
                  checked={selectedSet.has(key)}
                  onChange={() => toggleRow(key)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-navy-600"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                {visibleColumns.map((col) => {
                  const value = col.render ? col.render(row) : col.accessor ? col.accessor(row) : row[col.key]
                  return (
                    <div key={col.key} className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400 w-20">{col.header}</span>
                      <span className="truncate text-sm font-semibold text-slate-800">{value ?? '—'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-brand-cream">
            <tr className="border-b border-slate-200">
              {hasBulkActions && (
                <th className="w-12 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleRows}
                    aria-label="Select visible rows"
                    className="h-4 w-4 rounded border-slate-300 text-brand-navy-600 focus:ring-brand-navy-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${column.className || ''}`}>
                  {column.sortable === false ? (
                    column.header
                  ) : (
                    <button type="button" onClick={() => updateSort(column.key)} className="inline-flex items-center gap-1">
                      {column.header}
                      {sort.key === column.key && <span className="text-slate-400">{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row) => (
              <tr key={getRowKey(row)} className={rowClassName ? rowClassName(row) : 'hover:bg-slate-50'}>
                {hasBulkActions && (
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(String(getRowKey(row)))}
                      onChange={() => toggleRow(getRowKey(row))}
                      aria-label="Select row"
                      className="h-4 w-4 rounded border-slate-300 text-brand-navy-600 focus:ring-brand-navy-500"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-4 ${column.cellClassName || ''}`}>
                    {column.render ? column.render(row) : column.accessor ? column.accessor(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (hasBulkActions ? 1 : 0)} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{processedRows.length} result{processedRows.length === 1 ? '' : 's'}</p>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold"
          >
            {pageSizes.map((size) => <option key={size} value={size}>{size}/page</option>)}
          </select>
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Prev</button>
          <span className="font-mono text-xs font-medium">Page {safePage} of {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
