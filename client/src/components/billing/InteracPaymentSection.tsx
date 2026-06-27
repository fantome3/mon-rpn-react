import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

export type InteracPaymentSectionErrors = {
  amountInterac?: string
  refInterac?: string
}

export type InteracPaymentSectionProps = {
  membershipTotal: number
  rpnTotal: number
  total: number
  amountInterac: string
  refInterac: string
  errors: InteracPaymentSectionErrors
  isSubmitting: boolean
  onAmountChange: (value: string) => void
  onRefChange: (value: string) => void
  onSubmit: () => void
}

export const InteracPaymentSection = ({
  membershipTotal,
  rpnTotal,
  total,
  amountInterac,
  refInterac,
  errors,
  isSubmitting,
  onAmountChange,
  onRefChange,
  onSubmit,
}: InteracPaymentSectionProps) => (
  <div className='space-y-4'>
    <div className='rounded-lg border bg-slate-50 p-4 space-y-1 text-sm'>
      <div className='flex justify-between'>
        <span>Total Membership</span>
        <strong>{formatCurrency(membershipTotal)}</strong>
      </div>
      <div className='flex justify-between'>
        <span>Total Fonds RPN</span>
        <strong>{formatCurrency(rpnTotal)}</strong>
      </div>
      <div className='flex justify-between border-t pt-2 text-base'>
        <span className='font-semibold'>Total à payer</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </div>

    <p className='text-sm text-muted-foreground'>
      Faire le virement Interac à{' '}
      <strong className='text-foreground'>acq.quebec@gmail.com</strong> — mot de passe :{' '}
      <strong className='text-foreground'>monrpn</strong>
    </p>

    <div className='grid gap-4 sm:grid-cols-2'>
      <div>
        <Label htmlFor='amountInterac'>Montant Interac envoyé</Label>
        <Input
          id='amountInterac'
          type='number'
          min={0}
          value={amountInterac}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder={total > 0 ? String(total) : '0'}
        />
        {total > 0 && (
          <p className='mt-1 text-xs text-muted-foreground'>
            Montant minimal : {formatCurrency(total)}
          </p>
        )}
        {errors.amountInterac && (
          <p className='mt-1 text-sm text-destructive'>{errors.amountInterac}</p>
        )}
      </div>
      <div>
        <Label htmlFor='refInterac' className='text-xs'>
          Numéro de référence Interac (fourni par la banque après virement)
        </Label>
        <Input
          id='refInterac'
          value={refInterac}
          onChange={(e) => onRefChange(e.target.value)}
          placeholder='C2Km0'
        />
        {errors.refInterac && (
          <p className='mt-1 text-sm text-destructive'>{errors.refInterac}</p>
        )}
      </div>
    </div>

    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6'>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || total === 0}
        className='w-full sm:w-auto'
      >
        Valider Paiement
      </Button>

      <Link
        to='/faq#facturation'
        className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <HelpCircle className='h-4 w-4 shrink-0' />
        Questions fréquentes sur le paiement
      </Link>
    </div>
  </div>
)
