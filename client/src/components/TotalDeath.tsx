import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

const TotalDeath = ({ data }: { data: number }) => {
  return (
    <Card className='mt-10'>
      <CardHeader>
        <CardTitle>Total</CardTitle>
        <CardDescription>Tous les décès</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>{data}</div>
      </CardContent>
    </Card>
  )
}

export default TotalDeath
