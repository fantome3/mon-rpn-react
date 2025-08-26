import CreditCardPayment from '@/components/CreditCardPayment'
import InteracPayment from '@/components/InteracPayment'
import SelectFees from './SelectFees'
import { useState } from 'react'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const PaymentMethod = () => {
  const [totalPayment, setTotalPayment] = useState(0)

  return (
    <>
      <SearchEngineOptimization title='Mode de paiement ACQ' description="Page de sélection du mode de paiement de l'association des camerounais du Québec ACQ" />
      <SelectFees updateTotal={setTotalPayment} />

      <div className='form flex-col sm:m-0 m-20' id='payment-block' style={{ minHeight: '60vh', justifyContent: 'unset' }}>
        <div className='text-center mt-8'>
          <h1 className=' text-3xl font-bold'>Mode de paiement</h1>
          <p>Choisissez par quel moyen vous souhaitez payer votre cotisation</p>
        </div>
        <div className='flex md:flex-row flex-col gap-8 text-center'>
          <CreditCardPayment />
          <InteracPayment key={totalPayment} total={totalPayment} />
        </div>
      </div>
    </>
  )
}

export default PaymentMethod
