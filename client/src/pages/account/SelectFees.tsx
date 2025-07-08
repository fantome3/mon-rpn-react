import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SelectFeesProps {
  onContinue?: () => void
}
const SelectFees = ({ onContinue }: SelectFeesProps) => {
  const [acq, setAcq] = useState(false)
  const [transition, setTransition] = useState(false)
  const [rpn, setRpn] = useState(false)

  const total = (acq ? 50 : 0) + (transition ? 10 : 0) + (rpn ? 20 : 0)

  const continueHandler = () => {
    if (onContinue) onContinue()
  }

  return (
    <div className='container my-8 max-w-lg space-y-6'>
        <p className='text-center px-4'>
          Veuillez sélectionner les frais applicables à votre situation en
          cochant les cases correspondantes ci-dessous. Chaque frais est indiqué
          avec son montant, et le total sera automatiquement mis à jour selon vos
          choix. Le total affiché en gras de la page reflète le montant que vous
          devrez régler. Exemple : si vous sélectionnez les trois cases, le total
          sera de 80&nbsp;$.
        </p>
        <div className='space-y-4 bg-white p-4 rounded shadow'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Checkbox id='acq' checked={acq} onCheckedChange={() => setAcq(!acq)} />
              <label htmlFor='acq' className='text-sm'>
                Frais d’adhésion à l’ACQ (annuel)
              </label>
            </div>
            <span className='font-medium'>50&nbsp;$</span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Checkbox id='transition' checked={transition} onCheckedChange={() => setTransition(!transition)} />
              <label htmlFor='transition' className='text-sm'>
                Frais de transition numérique (annuel)
              </label>
            </div>
            <span className='font-medium'>10&nbsp;$</span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Checkbox id='rpn' checked={rpn} onCheckedChange={() => setRpn(!rpn)} />
              <label htmlFor='rpn' className='text-sm'>
                Frais minimum d’adhésion au RPN (par personne)
              </label>
            </div>
            <span className='font-medium'>20&nbsp;$</span>
          </div>
          <div className='text-right font-bold'>Total&nbsp;: {total}&nbsp;$</div>
          <Button
            className='w-full'
            disabled={total === 0}
            onClick={continueHandler}
          >
            Continuer vers le paiement
          </Button>
        </div>
      </div>
    )
}

export default SelectFees
