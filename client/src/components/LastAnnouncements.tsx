/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Button } from './ui/button'
import Loading from './Loading'

const LastAnnouncements = () => {
  const { data: announcements, isPending } = useGetAnnouncementsQuery()

  return (
    <Card className='mt-4'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Dernières Annonces</CardTitle>
        <Button variant='link' className='text-sm p-0 h-auto' asChild>
          <a href='/announcements'>Voir tout →</a>
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Loading />
        ) : announcements && announcements.length > 0 ? (
          <Table>
            <TableCaption>Dernières annonces de décès.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Annoncé</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Lieu de décès</TableHead>
                <TableHead>Date de décès</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.slice(0, 5).map((announcement: any) => (
                <TableRow key={announcement.createdAt}>
                  <TableCell>
                    {functionReverse(
                      announcement.createdAt.toString().substring(0, 10)
                    )}
                  </TableCell>
                  <TableCell>{announcement.firstName}</TableCell>
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
        ) : (
          <p className='text-muted-foreground py-4'>
            Aucune annonce enregistrée.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default LastAnnouncements
