import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Loading from '@/components/Loading'
import { TrendingDown, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Props = {
  totalCredit: number
  deltaPercent: number | null
  isPending: boolean
  periodLabel: string
}

const MembershipCard = ({
  totalCredit,
  deltaPercent,
  isPending,
  periodLabel,
}: Props) => {
  if (isPending) return <Loading />

  const isPositive = deltaPercent !== null && deltaPercent >= 0

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>
          Membership - Entrees
        </CardTitle>
        <Users className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{formatCurrency(totalCredit)}</div>
        <p className='text-xs text-muted-foreground mb-1'>{periodLabel}</p>
        {deltaPercent !== null ? (
          <p
            className={`text-xs flex items-center gap-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {isPositive ? (
              <TrendingUp className='h-3 w-3' />
            ) : (
              <TrendingDown className='h-3 w-3' />
            )}
            {isPositive ? '+' : ''}
            {deltaPercent.toFixed(1)}% vs periode precedente
          </p>
        ) : (
          <p className='text-xs text-muted-foreground'>
            Aucune donnee pour la periode precedente
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default MembershipCard
