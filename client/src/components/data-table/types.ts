import type { ReactNode } from 'react'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'

export type DataTableFilterOption = {
  label: string
  value: string
}

export type DataTableFilterConfig<TData> = {
  id: string
  label: string
  options: DataTableFilterOption[]
  filterFn: (row: TData, value: string) => boolean
  defaultValue?: string
  allValue?: string
  placeholder?: string
  triggerClassName?: string
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialPageIndex?: number
  initialColumnVisibility?: VisibilityState
  onPaginationChange?: (page: number) => void
  pageName?: string
  filters?: DataTableFilterConfig<TData>[]
  showGlobalFilter?: boolean
  globalFilterPlaceholder?: string
  showColumnVisibilityToggle?: boolean
  showPagination?: boolean
  showFilteredCount?: boolean
  emptyMessage?: string
  pageSizeOptions?: number[]
  toolbarRightContent?: ReactNode
}
