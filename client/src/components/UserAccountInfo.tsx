import { useContext, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Store } from '@/lib/Store'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import { refresh, ToLocaleStringFunc } from '@/lib/utils'
import { getAccountStatusLabel } from '@/lib/accountUtils'
import { Button } from './ui/button'
import UpdateInteracPayment from './UpdateInteracPayment'
import UpdateCreditCardPayment from './UpdateCreditCardPayment'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'

const UserAccountInfo = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
  const { data: account } = useGetAccountsByUserIdQuery(userId)
  const { data: transactions } = useGetTransactionsByUserIdQuery(userId)
  const [modalVisibility, setModalVisibility] = useState(false)
  const [currentSolde, setCurrentSolde] = useState<number | null>(null)

  const paymentMethod = account && account[0]?.paymentMethod
  
  const lastTransaction =
    transactions && transactions.length > 0 ? transactions[0] : undefined
  const statusLabel = getAccountStatusLabel(account?.[0], lastTransaction?.status)

  const handleTransactionSuccess = async (amount: number) => {
    setCurrentSolde((prevSolde) =>
      prevSolde !== null && prevSolde !== undefined
        ? prevSolde + amount
        : amount
    )
    setModalVisibility(false)
    refresh()
  }

  useEffect(() => {
    if (account && account[0]?.solde !== undefined) {
      setCurrentSolde(account?.[0]?.solde)
    }
  }, [account])

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setModalVisibility(false)
    }
  }
  return (
    <>
      <Card className='mt-10'>
        <CardHeader>
          <CardTitle>Mon solde</CardTitle>
          <CardDescription>Montant actuel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex justify-between items-center'>
            <div
              className={`text-2xl font-bold ${
                statusLabel ? 'text-gray-300 italic' : ''
              }`}
            >
              $&nbsp;{ToLocaleStringFunc(currentSolde ?? 0)}
              {statusLabel && (
                <span className='ml-1 text-xs text-muted-foreground'>
                  {statusLabel}
                </span>
              )}
            </div>
            <Button
              onClick={() => setModalVisibility(true)}
              variant='outline'
              size='sm'
              className='ml-4 text-primary border-primary text-xs'
            >
              Renflouer
            </Button>
          </div>
        </CardContent>
      </Card>

      {modalVisibility && (
        <div
          className='fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-50 flex justify-center items-center'
          onClick={handleClickOutside}
        >
          {paymentMethod === 'credit_card' ? (
            <>
              <UpdateCreditCardPayment />
            </>
          ) : (
            <>
              <UpdateInteracPayment onSuccess={handleTransactionSuccess} />
            </>
          )}
        </div>
      )}
    </>
  )
}

export default UserAccountInfo
