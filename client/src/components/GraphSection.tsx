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
  Cell,
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

  // Transformer les données pour Recharts (toujours 12 mois)
  const deathsByMonth = new Map<number, number>(
    data.map(({ x, y }) => [x, y])
  )
  const chartData = monthStrings.map((label, index) => {
    const moisNum = index + 1
    const value = deathsByMonth.get(moisNum) ?? 0
    return {
      mois: label,
      décès: value,
      moisNum,
      isZero: value === 0,
    }
  })

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
                domain={[0, 'dataMax + 2']}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Décès']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Bar
                dataKey='décès'
                fill='hsl(var(--primary))'
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.moisNum}`}
                    fill={entry.isZero ? 'hsl(var(--muted))' : 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default GraphSection
