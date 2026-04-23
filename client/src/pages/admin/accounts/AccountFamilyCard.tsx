import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FamilyMember } from '@/types'

type Props = {
  familyMembers?: FamilyMember[]
}

const AccountFamilyCard = ({ familyMembers }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Personnes à charge</CardTitle>
    </CardHeader>
    <CardContent>
      {familyMembers && familyMembers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMembers.map((member, index) => (
              <TableRow key={`${member.firstName}-${member.lastName}-${index}`}>
                <TableCell>
                  {member.firstName} {member.lastName}
                </TableCell>
                <TableCell>{member.relationship || '-'}</TableCell>
                <TableCell>
                  <Badge variant='outline' className='font-normal'>
                    {member.status || '-'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Aucune personne à charge enregistrée.
        </p>
      )}
    </CardContent>
  </Card>
)

export default AccountFamilyCard
