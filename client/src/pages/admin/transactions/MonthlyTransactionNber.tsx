/* eslint-disable @typescript-eslint/no-explicit-any */
import Loading from '@/components/Loading'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const MonthlyTransactionNber = ({
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
            <CardTitle>Nombre de transactions par mois</CardTitle>
            <CardDescription>
              Évolution du volume de transactions
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
                      `${value} transactions`,
                      'Nombre',
                    ]}
                    labelFormatter={(label) => `Période: ${label}`}
                  />
                  <Bar
                    dataKey='transactions'
                    fill='#ec4899'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default MonthlyTransactionNber
