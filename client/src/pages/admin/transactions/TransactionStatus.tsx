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
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { COLORS } from '@/lib/constant'

const TransactionStatus = ({
  isPending,
  statusChartData,
}: {
  isPending: boolean
  statusChartData: any
}) => {
  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Statut des transactions</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px] flex items-center justify-center'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusChartData.map((index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} transactions`,
                      'Nombre',
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default TransactionStatus
