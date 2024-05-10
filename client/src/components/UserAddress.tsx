import { useContext } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Store } from '@/lib/Store'

import { functionSponsorship } from '@/lib/utils'

const UserAddress = () => {
  const { state } = useContext(Store)
  const { userInfo } = state

  return (
    <>
      <Card className='border-primary'>
        <CardHeader className='text-xl font-medium'>
          Code de Parrainage
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Code de parrainge
              </p>
              <p className='text-sm text-muted-foreground'>
                {functionSponsorship(userInfo?._id!)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserAddress
