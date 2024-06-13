import { useGetAnnouncementsQuery } from '@/hooks/deathAnnouncementHook'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { functionReverse } from '@/lib/utils'

const LastAnnouncements = () => {
  const { data: announcements } = useGetAnnouncementsQuery()

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle>Dernières Annonces</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Dernières annonces de décès.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Annoncé</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Cause de décès</TableHead>
              <TableHead>Lieu de décès</TableHead>
              <TableHead>Date de décès</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements &&
              announcements.slice(0, 5).map((announcement: any) => (
                <TableRow key={announcement.createdAt}>
                  <TableCell>
                    {functionReverse(
                      announcement.createdAt.toString().substring(0, 10)
                    )}
                  </TableCell>
                  <TableCell>{announcement.firstName}</TableCell>
                  <TableCell>{announcement.deathCause}</TableCell>
                  <TableCell>{announcement.deathPlace}</TableCell>
                  <TableCell>
                    {functionReverse(
                      announcement.deathDate.toString().substring(0, 10)
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default LastAnnouncements
