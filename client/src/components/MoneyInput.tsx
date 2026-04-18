import { useState, useEffect } from 'react'
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type MoneyInputProps = {
  field: {
    value: number
    onChange: (value: number) => void
    onBlur: () => void
  }
  label: string
  placeholder?: string
  isInteger: boolean
}

function MoneyInput({ field, label, placeholder, isInteger }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (isFocused) return
    setDisplayValue(
      field.value === 0 || field.value === undefined
        ? ''
        : formatForDisplay(field.value, isInteger),
    )
  }, [field.value, isFocused])

  const formatForDisplay = (value: number, asInteger: boolean): string => {
    if (!Number.isFinite(value) || value === 0) return ''
    if (asInteger) return String(value)
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\s/g, '')

    if (isInteger) {
      if (/^\d*$/.test(raw)) {
        setDisplayValue(raw)
        field.onChange(Number(raw) || 0)
      }
      return
    }

    // Champs monetaires : accepter virgule ou point comme separateur decimal
    const normalized = raw.replace(',', '.')
    if (/^\d*\.?\d{0,2}$/.test(normalized) || normalized === '') {
      setDisplayValue(raw)
      field.onChange(normalized === '' ? 0 : parseFloat(normalized) || 0)
    }
  }

  const handleFocus = () => setIsFocused(true)

  const handleBlur = () => {
    setIsFocused(false)
    field.onBlur()
    setDisplayValue(formatForDisplay(field.value, isInteger))
  }

  return (
    <FormItem>
      <FormLabel className='text-xs leading-tight'>{label}</FormLabel>
      <FormControl>
        <div className='relative'>
          <Input
            type='text'
            inputMode={isInteger ? 'numeric' : 'decimal'}
            placeholder={placeholder ?? (isInteger ? '0' : '0,00')}
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className='pr-6 h-10'
          />
          {!isInteger && (
            <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>
              $
            </span>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )
}

export default MoneyInput
