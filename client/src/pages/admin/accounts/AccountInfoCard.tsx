import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { canadianResidenceStatus } from '@/lib/constant'
import { formatCanadianPhone } from '@/lib/phone.validation'
import { functionReverse } from '@/lib/utils'
import { User } from '@/types'
import { UserRound } from 'lucide-react'

const getResidenceStatusLabel = (value?: string) =>
  canadianResidenceStatus.find((s) => s.value === value)?.label || '-'

const toDisplayDate = (value?: string | Date) => {
  if (!value) return '-'
  const dateStr = value.toString().substring(0, 10)
  return functionReverse(dateStr) || '-'
}

type Props = {
  user: User
}

const AccountInfoCard = ({ user }: Props) => (
  <Card className='lg:col-span-2'>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        <UserRound className='h-4 w-4' /> Renseignements personnels
      </CardTitle>
    </CardHeader>
    <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
      <div>
        <p className='text-muted-foreground'>Prénom</p>
        <p className='font-medium'>{user.origines?.firstName || '-'}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Nom</p>
        <p className='font-medium'>{user.origines?.lastName || '-'}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Date de naissance</p>
        <p className='font-medium'>{toDisplayDate(user.origines?.birthDate)}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Occupation</p>
        <p className='font-medium'>{user.register?.occupation}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Téléphone</p>
        <p className='font-medium'>{formatCanadianPhone(user.infos?.tel)}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Email</p>
        <p className='font-medium'>{user.register?.email || '-'}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Pays de résidence</p>
        <p className='font-medium'>{user.infos?.residenceCountry || '-'}</p>
      </div>
      <div>
        <p className='text-muted-foreground'>Statut au Canada</p>
        <Badge className='font-normal'>
          {getResidenceStatusLabel(user.infos?.residenceCountryStatus)}
        </Badge>
      </div>
      <div>
        <p className='text-muted-foreground'>Adresse</p>
        <p className='font-medium'>{user.infos?.address || '-'}</p>
      </div>
    </CardContent>
  </Card>
)

export default AccountInfoCard
