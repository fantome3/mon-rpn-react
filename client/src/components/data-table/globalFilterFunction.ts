import type { FilterFn } from '@tanstack/react-table'

export const globalFilterFunction: FilterFn<unknown> = (
  row,
  columnId,
  filterValue
) => {
  const normalizedFilter = String(filterValue ?? '').toLowerCase()
  const valueFromAccessor = row.getValue(columnId)
  const valueFromOriginal =
    typeof row.original === 'object' && row.original !== null
      ? (row.original as Record<string, unknown>)[columnId]
      : undefined
  const cellValue = valueFromAccessor ?? valueFromOriginal

  if (typeof cellValue === 'object' && cellValue !== null) {
    const stringValue = JSON.stringify(cellValue).toLowerCase()
    return stringValue.includes(normalizedFilter)
  }

  if (typeof cellValue === 'number') {
    return cellValue.toString().includes(normalizedFilter)
  }

  return String(cellValue ?? '').toLowerCase().includes(normalizedFilter)
}
