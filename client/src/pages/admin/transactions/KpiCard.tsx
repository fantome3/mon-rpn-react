import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Loading from '@/components/Loading'
import { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  isPending: boolean
  iconClass?: string
  valueClass?: string
}

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  isPending,
  iconClass = 'text-muted-foreground',
  valueClass = '',
}: Props) => {
  if (isPending) return <Loading />

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        <p className='text-xs text-muted-foreground'>{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export default KpiCard
