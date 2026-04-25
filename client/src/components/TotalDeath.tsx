import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

const TotalDeath = ({ data }: { data: number }) => {
  const currentYear = new Date().getFullYear()

  return (
    <Card className='mt-10'>
      <CardHeader>
        <CardTitle>Deces {currentYear}</CardTitle>
        <CardDescription>Total des deces de l'annee en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>{data}</div>
      </CardContent>
    </Card>
  )
}

export default TotalDeath
