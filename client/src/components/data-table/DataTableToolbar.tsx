import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { DataTableColumnVisibility } from './DataTableColumnVisibility'
import { DataTableFilters } from './DataTableFilters'
import type { DataTableFilterConfig } from './types'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  showGlobalFilter: boolean
  globalFilter: string
  globalFilterPlaceholder: string
  onGlobalFilterChange: (value: string) => void
  filters: DataTableFilterConfig<TData>[]
  filterValues: Record<string, string>
  onFilterChange: (filterId: string, value: string) => void
  showColumnVisibilityToggle: boolean
  showFilteredCount: boolean
  filteredRowsCount: number
  totalRowsCount: number
  rightContent?: ReactNode
}

export const DataTableToolbar = <TData,>({
  table,
  showGlobalFilter,
  globalFilter,
  globalFilterPlaceholder,
  onGlobalFilterChange,
  filters,
  filterValues,
  onFilterChange,
  showColumnVisibilityToggle,
  showFilteredCount,
  filteredRowsCount,
  totalRowsCount,
  rightContent,
}: DataTableToolbarProps<TData>) => {
  const hasLeftControls = showGlobalFilter || filters.length > 0
  const hasRightControls =
    showColumnVisibilityToggle || showFilteredCount || Boolean(rightContent)

  if (!hasLeftControls && !hasRightControls) return null

  return (
    <div className='flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap'>
        {showGlobalFilter ? (
          <Input
            placeholder={globalFilterPlaceholder}
            value={globalFilter}
            onChange={(event) => onGlobalFilterChange(event.target.value)}
            className='max-w-sm'
          />
        ) : null}

        <DataTableFilters
          filters={filters}
          values={filterValues}
          onFilterChange={onFilterChange}
        />
      </div>

      <div className='flex items-center gap-3 self-start lg:self-auto'>
        {showFilteredCount ? (
          <p className='text-sm text-muted-foreground'>
            {filteredRowsCount} / {totalRowsCount} elements
          </p>
        ) : null}

        {rightContent}

        {showColumnVisibilityToggle ? (
          <DataTableColumnVisibility table={table} />
        ) : null}
      </div>
    </div>
  )
}
