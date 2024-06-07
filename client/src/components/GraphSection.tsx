import Loading from './Loading'
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
  const originalWarn = console.warn
  console.warn = function (...args) {
    const arg = args && args[0]
    if (arg && arg.includes("Attempting to load version '51' of Google Charts"))
      return
    originalWarn(...args)
  }
  /**End ignore google charts warnings */

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

export default GraphSection
