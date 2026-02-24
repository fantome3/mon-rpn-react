import { useContext, useEffect, useMemo, useState } from 'react'
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
import { Button } from './ui/button'
import UpdateInteracPayment from './UpdateInteracPayment'
import UpdateCreditCardPayment from './UpdateCreditCardPayment'

type TopUpTarget = 'membership' | 'rpn'

const UserAccountInfo = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const userId = userInfo?._id ?? ''
  const { data: account } = useGetAccountsByUserIdQuery(userId)

  const [modalVisibility, setModalVisibility] = useState(false)
  const [activeTarget, setActiveTarget] = useState<TopUpTarget>('rpn')
  const [membershipBalance, setMembershipBalance] = useState<number>(0)
  const [rpnBalance, setRpnBalance] = useState<number>(0)

  const paymentMethod = account?.[0]?.paymentMethod
  const subscriptionStatus = userInfo?.subscription?.status

  const membershipStatusLabel = useMemo(() => {
    if (subscriptionStatus === 'active') return 'A jour'
    if (subscriptionStatus === 'registered') return 'En retard'
    return 'Renouvellement bientot'
  }, [subscriptionStatus])

  const membershipMinAmount = useMemo(() => {
    if (subscriptionStatus === 'active') return 25
    if (subscriptionStatus === 'registered') return 50
    return 50
  }, [subscriptionStatus])

  const handleTransactionSuccess = async (_amount: number) => {
    setModalVisibility(false)
    refresh()
  }

  useEffect(() => {
    if (account?.[0]) {
      const nextMembership =
        account[0].membership_balance ??
        (account[0].solde ?? 0)
      const nextRpn = account[0].rpn_balance ?? 0
      setMembershipBalance(nextMembership)
      setRpnBalance(nextRpn)
    }
  }, [account])

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setModalVisibility(false)
    }
  }

  return (
    <>
      <div className='col-span-1 sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-10'>
        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>{membershipStatusLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center'>
              <div className='text-2xl font-bold'>
                $&nbsp;{ToLocaleStringFunc(membershipBalance)}
              </div>
              <Button
                onClick={() => {
                  setActiveTarget('membership')
                  setModalVisibility(true)
                }}
                variant='outline'
                size='sm'
                className='ml-4 text-primary border-primary text-xs'
              >
                Renouveller
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fonds RPN</CardTitle>
            <CardDescription>Contribution volontaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center'>
              <div className='text-2xl font-bold'>
                $&nbsp;{ToLocaleStringFunc(rpnBalance)}
              </div>
              <Button
                onClick={() => {
                  setActiveTarget('rpn')
                  setModalVisibility(true)
                }}
                variant='outline'
                size='sm'
                className='ml-4 text-primary border-primary text-xs'
              >
                Ajouter au fonds RPN
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {modalVisibility && (
        <div
          className='fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-50 flex justify-center items-center'
          onClick={handleClickOutside}
        >
          {paymentMethod === 'credit_card' ? (
            <UpdateCreditCardPayment />
          ) : (
            <UpdateInteracPayment
              onSuccess={handleTransactionSuccess}
              minAmount={activeTarget === 'membership' ? membershipMinAmount : 20}
              topUpTarget={activeTarget}
            />
          )}
        </div>
      )}
    </>
  )
}

export default UserAccountInfo
