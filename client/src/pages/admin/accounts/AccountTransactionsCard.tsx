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
import {
  getTransactionStatusBadgeClass,
  getTransactionStatusLabel,
} from '@/lib/transactionStatus'
import { formatCurrency, functionReverse } from '@/lib/utils'
import { Transaction } from '@/types'

const toDisplayDate = (value?: string | Date) => {
  if (!value) return '-'
  const dateStr = value.toString().substring(0, 10)
  return functionReverse(dateStr) || '-'
}

type Props = {
  transactions: Transaction[]
}

const AccountTransactionsCard = ({ transactions }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>4 dernières transactions</CardTitle>
    </CardHeader>
    <CardContent>
      {transactions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id}>
                <TableCell>{toDisplayDate(tx.createdAt)}</TableCell>
                <TableCell>{tx.type === 'credit' ? 'Recharge' : 'Dépense'}</TableCell>
                <TableCell
                  className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}
                >
                  {tx.type === 'credit' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={getTransactionStatusBadgeClass(tx.status)}>
                    {getTransactionStatusLabel(tx.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Aucune transaction trouvée.
        </p>
      )}
    </CardContent>
  </Card>
)

export default AccountTransactionsCard
