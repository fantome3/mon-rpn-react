import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { Store } from '@/lib/Store'
import { useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import Loading from './Loading'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { formatCurrency, functionReverse } from '@/lib/utils'
import { Badge } from './ui/badge'

const LastUserTransactions = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: transactions, isPending } = useGetTransactionsByUserIdQuery(
    userInfo?._id
  )

  return (
    <Card className='mt-4'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Mes dernières transactions</CardTitle>
        <Button variant='link' className='text-sm p-0 h-auto' asChild>
          <a href={`/transactions/${userInfo?._id}/all`}>Voir tout →</a>
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Loading />
        ) : transactions && transactions.length > 0 ? (
          <Table>
            <TableCaption>
              Historique de vos transactions récentes.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>
                    {tx.createdAt
                      ? functionReverse(
                          tx.createdAt.toString().substring(0, 10)
                        )
                      : 'Date inconnue'}
                  </TableCell>
                  <TableCell className='capitalize'>{tx.type}</TableCell>
                  <TableCell
                    className={
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${
                        tx.status === 'completed'
                          ? 'bg-green-500'
                          : tx.status === 'pending'
                          ? 'bg-yellow-500'
                          : tx.status === 'awaiting_payment'
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {tx.status === 'completed'
                        ? 'Réussie'
                        : tx.status === 'pending'
                        ? 'En attente approbation'
                        : tx.status === 'awaiting_payment'
                        ? 'En attente paiement'
                        : 'Échouée'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className='text-muted-foreground py-4'>
            Aucune transaction enregistrée.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default LastUserTransactions
