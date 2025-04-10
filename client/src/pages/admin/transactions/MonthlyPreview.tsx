/* eslint-disable @typescript-eslint/no-explicit-any */
import Loading from '@/components/Loading'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { formatCurrency } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const MonthlyPreview = ({
  isPending,
  monthlyChartData,
}: {
  isPending: boolean
  monthlyChartData: any
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Aperçu mensuel</CardTitle>
            <CardDescription>
              Montant total des transactions par mois
            </CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Montant',
                    ]}
                    labelFormatter={(label) => `Période: ${label}`}
                  />
                  <Bar dataKey='montant' fill='#6366f1' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default MonthlyPreview
