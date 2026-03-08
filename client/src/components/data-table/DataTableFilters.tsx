import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DataTableFilterConfig } from './types'

type DataTableFiltersProps<TData> = {
  filters: DataTableFilterConfig<TData>[]
  values: Record<string, string>
  onFilterChange: (filterId: string, value: string) => void
}

export const DataTableFilters = <TData,>({
  filters,
  values,
  onFilterChange,
}: DataTableFiltersProps<TData>) => {
  if (!filters.length) return null

  return (
    <>
      {filters.map((filter) => {
        const allValue = filter.allValue ?? 'all'
        const selectedValue = values[filter.id] ?? filter.defaultValue ?? allValue

        return (
          <div key={filter.id} className='flex items-center gap-2'>
            <span className='text-sm font-medium whitespace-nowrap'>
              {filter.label}
            </span>
            <Select
              value={selectedValue}
              onValueChange={(value) => onFilterChange(filter.id, value)}
            >
              <SelectTrigger className={filter.triggerClassName ?? 'w-[230px]'}>
                <SelectValue placeholder={filter.placeholder ?? filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </>
  )
}
