import { CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { formatCurrency } from '@/lib/utils'

export type CoverageChoice = 'both' | 'membership' | 'none'

type CoverageOption = {
  value: CoverageChoice
  label: string
  description: string
  amount: number | null
  recommended?: boolean
}

type Props = {
  memberName: string
  membershipFee: number
  rpnFee: number
  choice: CoverageChoice
  onChoiceChange: (choice: CoverageChoice) => void
  onClose: () => void
  onPay: () => void
  year?: number
}

export const MemberCoverageStep = ({
  memberName,
  membershipFee,
  rpnFee,
  choice,
  onChoiceChange,
  onClose,
  onPay,
  year = new Date().getFullYear(),
}: Props) => {
  const options: CoverageOption[] = [
    {
      value: 'both',
      label: 'Membership + RPN',
      description: 'Membership + fonds entraide deces',
      amount: membershipFee + rpnFee,
      recommended: true,
    },
    {
      value: 'membership',
      label: 'Membership uniquement',
      description: 'Cotisation annuelle membership',
      amount: membershipFee,
    },
    {
      value: 'none',
      label: 'Pas maintenant',
      description: `Ce membre sera inclus lors de la prochaine cotisation (janvier ${year + 1})`,
      amount: null,
    },
  ]

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4'>
        <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
        <div>
          <p className='font-semibold text-green-800'>{memberName} a ete ajoute(e) a votre famille</p>
          <p className='mt-1 text-sm text-green-700'>
            Votre membership {year} est deja regle. Souhaitez-vous couvrir ce membre des maintenant ?
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        {options.map((option) => {
          const isSelected = choice === option.value
          return (
            <button
              key={option.value}
              type='button'
              onClick={() => onChoiceChange(option.value)}
              className={`flex w-full items-start justify-between gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              <span className='flex items-start gap-3'>
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-primary' : 'border-muted-foreground'
                  }`}
                >
                  {isSelected && <span className='h-2.5 w-2.5 rounded-full bg-primary' />}
                </span>
                <span>
                  <span className='flex items-center gap-2'>
                    <span className='block text-sm font-semibold'>{option.label}</span>
                    {option.recommended && (
                      <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                        Recommande
                      </span>
                    )}
                  </span>
                  <span className='mt-0.5 block text-xs text-muted-foreground'>
                    {option.description}
                  </span>
                </span>
              </span>
              {option.amount !== null && (
                <span className='shrink-0 text-sm font-bold text-primary'>
                  {formatCurrency(option.amount)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className='flex flex-col-reverse gap-3 pt-1 sm:flex-row'>
        <Button variant='outline' onClick={onClose} className='w-full sm:flex-1'>
          Fermer
        </Button>
        {choice !== 'none' && (
          <Button onClick={onPay} className='w-full sm:flex-1'>
            Aller au paiement
          </Button>
        )}
      </div>
    </div>
  )
}
