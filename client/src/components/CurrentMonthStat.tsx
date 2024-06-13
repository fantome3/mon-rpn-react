import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

const CurrentMonthStat = ({ data }: { data: number }) => {
  return (
    <Card className='mt-10'>
      <CardHeader>
        <CardTitle>Décès</CardTitle>
        <CardDescription>Ce mois-ci</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>{data}</div>
      </CardContent>
    </Card>
  )
}

export default CurrentMonthStat
