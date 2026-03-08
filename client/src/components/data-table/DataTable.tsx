import { useEffect, useMemo, useState } from 'react'
import {
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { globalFilterFunction } from './globalFilterFunction'
import { DataTableToolbar } from './DataTableToolbar'
import { DataTableContent } from './DataTableContent'
import { DataTablePagination } from './DataTablePagination'
import type { DataTableFilterConfig, DataTableProps } from './types'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

const getFilterDefaults = <TData,>(
  filters: DataTableFilterConfig<TData>[]
): Record<string, string> => {
  const defaults: Record<string, string> = {}

  for (const filter of filters) {
    defaults[filter.id] = filter.defaultValue ?? filter.allValue ?? 'all'
  }

  return defaults
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPageIndex = 0,
  initialColumnVisibility = {},
  pageName,
  onPaginationChange,
  filters,
  showGlobalFilter = true,
  globalFilterPlaceholder = 'Chercher...',
  showColumnVisibilityToggle = true,
  showPagination = true,
  showFilteredCount = false,
  emptyMessage = "Aucune donnee pour l'instant.",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  toolbarRightContent,
}: DataTableProps<TData, TValue>) {
  const activeFilters = useMemo(() => filters ?? [], [filters])
  const typedGlobalFilterFn = globalFilterFunction as FilterFn<TData>

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility
  )
  const [globalFilter, setGlobalFilter] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    getFilterDefaults(activeFilters)
  )

  useEffect(() => {
    setFilterValues((currentValues) => {
      const defaults = getFilterDefaults(activeFilters)
      const nextValues: Record<string, string> = {}
      let changed = false

      for (const filter of activeFilters) {
        const currentValue = currentValues[filter.id]

        if (typeof currentValue === 'string') {
          nextValues[filter.id] = currentValue
        } else {
          nextValues[filter.id] = defaults[filter.id]
          changed = true
        }
      }

      for (const key of Object.keys(currentValues)) {
        if (!(key in nextValues)) {
          changed = true
        }
      }

      return changed ? nextValues : currentValues
    })
  }, [activeFilters])

  const filteredData = useMemo(() => {
    if (!activeFilters.length) {
      return data
    }

    return data.filter((row) =>
      activeFilters.every((filter) => {
        const allValue = filter.allValue ?? 'all'
        const selectedValue =
          filterValues[filter.id] ?? filter.defaultValue ?? allValue

        if (selectedValue === allValue) {
          return true
        }

        return filter.filterFn(row, selectedValue)
      })
    )
  }, [activeFilters, data, filterValues])

  const table = useReactTable({
    data: filteredData,
    columns,
    initialState: {
      pagination: { pageIndex: initialPageIndex },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: typedGlobalFilterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const pageIndex = table.getState().pagination.pageIndex

  useEffect(() => {
    if (pageName) {
      const storedPageIndex = Number.parseInt(
        localStorage.getItem(pageName) ?? '-1',
        10
      )

      if (storedPageIndex !== pageIndex) {
        localStorage.setItem(pageName, pageIndex.toString())
      }
    }

    onPaginationChange?.(pageIndex)
  }, [onPaginationChange, pageIndex, pageName])

  return (
    <>
      <DataTableToolbar
        table={table}
        showGlobalFilter={showGlobalFilter}
        globalFilter={globalFilter}
        globalFilterPlaceholder={globalFilterPlaceholder}
        onGlobalFilterChange={setGlobalFilter}
        filters={activeFilters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((current) => ({ ...current, [filterId]: value }))
        }
        showColumnVisibilityToggle={showColumnVisibilityToggle}
        showFilteredCount={showFilteredCount}
        filteredRowsCount={table.getFilteredRowModel().rows.length}
        totalRowsCount={data.length}
        rightContent={toolbarRightContent}
      />

      <DataTableContent table={table} columns={columns} emptyMessage={emptyMessage} />

      {showPagination ? (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      ) : null}
    </>
  )
}
