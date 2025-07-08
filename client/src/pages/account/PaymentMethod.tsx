import CreditCardPayment from '@/components/CreditCardPayment'
import InteracPayment from '@/components/InteracPayment'
import { useState } from 'react'
import SelectFees from './SelectFees'

const PaymentMethod = () => {
  const [showPayment, setShowPayment] = useState(false)

  return (
    <>
      <SelectFees onContinue={() => setShowPayment(true)} />
      {showPayment && (
        <div className='form flex-col sm:m-0 m-20' id='payment-block'>
          <div className='flex md:flex-row flex-col gap-8 text-center'>
            <CreditCardPayment />
            <InteracPayment />
          </div>
          <div className='text-center mt-8'>
            <h1 className=' text-3xl font-bold'>Mode de paiement</h1>
            <p>Choisissez par quel moyen vous souhaitez payer votre cotisation</p>
          </div>
        </div>
      )}
    </>
  )
}

export default PaymentMethod
