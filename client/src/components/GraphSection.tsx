/* eslint-disable @typescript-eslint/no-explicit-any */
/*import Loading from './Loading'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import Chart from 'react-google-charts'

const GraphSection = ({ data }: any) => {
  /**Ignore google charts warning */
/*const originalWarn = console.warn
  console.warn = function (...args) {
    const arg = args && args[0]
    if (arg && arg.includes("Attempting to load version '51' of Google Charts"))
      return
    originalWarn(...args)
  }
  /**End ignore google charts warnings */

/*const monthStrings = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ]

  const date = 'date'
  const count = 'décès'

  //const month = new Date().getMonth() + 1

  return (
    <Card className='mt-4'>
      <CardHeader className='flex flex-row justify-between items-center'>
        <CardTitle>Graphique annuel</CardTitle>
        <div>
          <Select disabled>
            <SelectTrigger className='w-[80px]'>
              <SelectValue placeholder='2024' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>2024</SelectLabel>
                <SelectItem value='2024'>2024</SelectItem>
                <SelectItem value='2025'>2025</SelectItem>
                <SelectItem value='2026'>2026</SelectItem>
                <SelectItem value='2027'>2027</SelectItem>
                <SelectItem value='2028'>2028</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Chart
          width='100%'
          height='400px'
          chartType='Bar'
          loader={<Loading />}
          data={[
            [date, count],
            ...data.map(({ x, y }: { x: number; y: number }) => [
              monthStrings[x - 1],
              y,
            ]),
          ]}
        />
      </CardContent>
    </Card>
  )
}

export default <GraphSection></GraphSection>*/

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Types pour les données
interface DataPoint {
  x: number // Mois (1-12)
  y: number // Nombre de décès
}

interface GraphSectionProps {
  data: DataPoint[]
  title?: string
  currentYear?: number
  availableYears?: number[]
  onYearChange?: (year: string) => void
}

const GraphSection = ({
  data,
  title = 'Graphique annuel',
  currentYear = new Date().getFullYear(),
  availableYears = [2024, 2025, 2026, 2027, 2028],
  onYearChange,
}: GraphSectionProps) => {
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  // Noms des mois en français
  const monthStrings = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ]

  // Transformer les données pour Recharts
  const chartData = data.map(({ x, y }) => ({
    mois: monthStrings[x - 1],
    décès: y,
    moisNum: x, // Conserver le numéro du mois pour le tri
  }))

  // Trier les données par mois
  chartData.sort((a, b) => a.moisNum - b.moisNum)

  // Gérer le changement d'année
  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    if (onYearChange) {
      onYearChange(year)
    }
  }

  // Formater les nombres avec séparateurs de milliers
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value)
  }

  return (
    <Card className='mt-4 overflow-hidden'>
      <CardHeader className='flex flex-row justify-between items-center bg-muted/20 pb-4'>
        <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        <div>
          <Select
            value={selectedYear}
            onValueChange={handleYearChange}
            disabled={!onYearChange}
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue placeholder={currentYear.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Année</SelectLabel>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='h-[400px] w-full p-4'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='mois'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Décès']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Bar
                dataKey='décès'
                fill='hsl(var(--primary))'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default GraphSection
