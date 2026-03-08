import type { Table } from '@tanstack/react-table'
import { functionTranslate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DataTableColumnVisibilityProps<TData> = {
  table: Table<TData>
  label?: string
}

export const DataTableColumnVisibility = <TData,>({
  table,
  label = 'Colonne',
}: DataTableColumnVisibilityProps<TData>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant='outline'>{label}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align='end'>
      {table
        .getAllColumns()
        .filter((column) => column.getCanHide())
        .map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className='capitalize'
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {functionTranslate(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
    </DropdownMenuContent>
  </DropdownMenu>
)
