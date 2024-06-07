import { useContext } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Store } from '@/lib/Store'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import { ToLocaleStringFunc } from '@/lib/utils'

const UserAccountInfo = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: account } = useGetAccountsByUserIdQuery(userInfo?._id!)

  return (
    <Card className='mt-10'>
      <CardHeader>
        <CardTitle>Solde</CardTitle>
        <CardDescription>Montant actuel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>
          $&nbsp;
          {account && account[0]?.solde
            ? ToLocaleStringFunc(account[0].solde)
            : 0}
        </div>
      </CardContent>
    </Card>
  )
}

export default UserAccountInfo
