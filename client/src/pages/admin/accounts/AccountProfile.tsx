import { useMemo } from 'react'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { useGetAccountsByUserIdQuery, useGetAccountsQuery } from '@/hooks/accountHooks'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { useGetUserDetailsQuery } from '@/hooks/userHooks'
import { useGetSettingsQuery } from '@/hooks/settingHooks'
import { toastAxiosError } from '@/lib/utils'
import { Account } from '@/types'
import { Link, useParams } from 'react-router-dom'
import AccountProfileHeader from './AccountProfileHeader'
import AccountBalancesCard from './AccountBalancesCard'
import AccountInfoCard from './AccountInfoCard'
import AccountPaymentAssistant from './AccountPaymentAssistant'
import AccountFamilyCard from './AccountFamilyCard'
import AccountTransactionsCard from './AccountTransactionsCard'

const getUserIdFromAccount = (account?: Account) =>
  String(account?.userId?._id ?? account?.userId ?? '')

const AccountProfile = () => {
  const { userId = '' } = useParams()

  const { data: allAccounts, isPending: isPendingAccounts } = useGetAccountsQuery()
  const { data: userAccounts, isPending: isPendingUserAccount } = useGetAccountsByUserIdQuery(userId)
  const { data: user, isPending: isPendingUser, error: userError } = useGetUserDetailsQuery(userId)
  const { data: transactions, isPending: isPendingTransactions } = useGetTransactionsByUserIdQuery(userId)
  const { data: settings } = useGetSettingsQuery()

  const accountsList: Account[] = Array.isArray(allAccounts) ? allAccounts : []
  const userAccountsList: Account[] = Array.isArray(userAccounts) ? userAccounts : []
  const currentAccount = userAccountsList.length > 0
    ? userAccountsList[userAccountsList.length - 1]
    : undefined

  const currentIndex = accountsList.findIndex(
    (account: Account) => getUserIdFromAccount(account) === userId,
  )
  const previousAccount = currentIndex > 0 ? accountsList[currentIndex - 1] : undefined
  const nextAccount =
    currentIndex >= 0 && currentIndex < accountsList.length - 1
      ? accountsList[currentIndex + 1]
      : undefined

  const lastTransactions = useMemo(
    () =>
      [...(transactions ?? [])]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 4),
    [transactions],
  )

  if (isPendingAccounts || isPendingUserAccount || isPendingUser || isPendingTransactions) {
    return <Loading />
  }

  if (userError || !user) {
    toastAxiosError(userError)
    return (
      <div className='container mt-16 mb-10'>
        <Button asChild variant='outline'>
          <Link to='/admin/accounts'>Retour aux comptes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='container mt-14 mb-10'>
      <AccountProfileHeader
        user={user}
        previousAccount={previousAccount}
        nextAccount={nextAccount}
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5'>
        <AccountBalancesCard
          membershipBalance={currentAccount?.membership_balance ?? 0}
          rpnBalance={currentAccount?.rpn_balance ?? 0}
        />
        <AccountInfoCard user={user} />
      </div>

      <AccountPaymentAssistant
        userId={userId}
        currentAccount={currentAccount}
        user={user}
        settings={settings}
      />

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'>
        <AccountFamilyCard familyMembers={user.familyMembers} />
        <AccountTransactionsCard transactions={lastTransactions} />
      </div>
    </div>
  )
}

export default AccountProfile
