import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Wallet } from 'lucide-react'

type Props = {
  membershipBalance: number
  rpnBalance: number
}

const AccountBalancesCard = ({ membershipBalance, rpnBalance }: Props) => (
  <Card className='lg:col-span-1'>
    <CardHeader>
      <CardTitle>Soldes</CardTitle>
      <p className='text-xs text-muted-foreground mt-2'>
        Montants courants des comptes
      </p>
    </CardHeader>
    <CardContent className='space-y-4'>
      <div>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Wallet className='h-4 w-4' /> Solde RPN
        </div>
        <p className='text-3xl font-semibold'>{formatCurrency(rpnBalance)}</p>
      </div>
      <div>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Wallet className='h-4 w-4' /> Solde Membership
        </div>
        <p className='text-3xl font-semibold'>{formatCurrency(membershipBalance)}</p>
      </div>
    </CardContent>
  </Card>
)

export default AccountBalancesCard
