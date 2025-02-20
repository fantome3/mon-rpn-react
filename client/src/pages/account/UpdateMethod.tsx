import UpdateCreditCardPayment from '@/components/UpdateCreditCardPayment'
import UpdateInteracPayment from '@/components/UpdateInteracPayment'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import { Store } from '@/lib/Store'
import { useContext } from 'react'

const UpdateMethod = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: accountByUserId } = useGetAccountsByUserIdQuery(
    userInfo?._id ?? ''
  )

  return (
    <>
      <div className='form flex-col sm:m-0 m-20'>
        <div className='flex md:flex-row flex-col gap-8 text-center'>
          {accountByUserId &&
          accountByUserId[0]?.paymentMethod === 'interac' ? (
            <>
              <UpdateCreditCardPayment />
            </>
          ) : (
            <UpdateInteracPayment />
          )}
        </div>
        <div className='text-center mt-8'>
          <h1 className=' text-3xl font-bold'>Modifier Mode de paiement</h1>
          <p>Changer la méthode de paiement</p>
        </div>
      </div>
    </>
  )
}

export default UpdateMethod
