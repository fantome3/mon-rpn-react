import { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormField } from '@/components/ui/form'
import MoneyInput from './MoneyInput'

type MoneyFormFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  isInteger?: boolean
}

export function MoneyFormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  isInteger = false,
}: MoneyFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <MoneyInput
          field={field}
          label={label}
          placeholder={placeholder}
          isInteger={isInteger}
        />
      )}
    />
  )
}
