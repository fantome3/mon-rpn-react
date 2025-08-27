import CreditCardPayment from '@/components/CreditCardPayment'
import InteracPayment from '@/components/InteracPayment'
import SelectFees from './SelectFees'
import { useContext, useState } from 'react'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Store } from '@/lib/Store'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import UpdateInteracPayment from '@/components/UpdateInteracPayment'
import UpdateCreditCardPayment from '@/components/UpdateCreditCardPayment'
import { useNavigate } from 'react-router-dom'

const PaymentMethod = () => {
  const [totalPayment, setTotalPayment] = useState(0)
  const { state } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const { data: accounts } = useGetAccountsByUserIdQuery(userInfo?._id)
  const account = accounts?.[0]

  const handleSuccess = () => {
    navigate('/summary')
  }

  if (account?.isAwaitingFirstPayment) {
    return (
      <>
        <SearchEngineOptimization title='Mode de paiement ACQ' description="Page de sélection du mode de paiement de l'association des camerounais du Québec ACQ" />
        <div className='form flex-col sm:m-0 m-20' style={{ minHeight: '60vh', justifyContent: 'unset' }}>
          <p className='text-center text-destructive mb-6'>
            Veuillez vous acquitter du montant minimum pour être membre. sinon des pénalités vous seront appliquées
          </p>
          <div className='flex md:flex-row flex-col gap-8 text-center'>
            {account.paymentMethod === 'interac' ? (
              <UpdateInteracPayment onSuccess={handleSuccess} />
            ) : (
              <UpdateCreditCardPayment />
            )}
          </div>
        </div>
      </>
    )
  }

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
