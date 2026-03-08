/*import { getTransactionStatusLabel } from "@/lib/transactionStatus";
import { Transaction } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { useState } from "react";


type TransactionStatusFilter = ReturnType<typeof normalizeTransactionStatus> | 'all'

const STATUS_FILTER_OPTIONS: TransactionStatusFilter[] = [
  'all',
  'pending',
  'awaiting_payment',
  'completed',
  'failed',
  'rejected',
  'refunded',
]

const getStatusFilterLabel = (status: TransactionStatusFilter) => {
  if (status === 'all') return 'Tous les statuts'
  return getTransactionStatusLabel(status)
}

function AfficheFiltreStatut(transactions: Transaction[] | undefined, setStatusFilter: (statut: TransactionStatusFilter) => void) {
  
  
    const transactionData = useMemo(
      () =>
        Array.isArray(transactions)
          ? transactions.map((tx) => ({
              ...tx,
              fullName: `${tx.userId?.origines?.lastName ?? ''} ${
                tx.userId?.origines?.firstName ?? ''
              }`,
            }))
          : [],
      [transactions]
    )
  
    const filteredTransactionData = useMemo(() => {
      if (statusFilter === 'all') {
        return transactionData
      }
  
      return transactionData.filter(
        (tx) => normalizeTransactionStatus(tx.status) === statusFilter
      )
    }, [statusFilter, transactionData])*
  
    return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>Filtrer par statut</span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as TransactionStatusFilter)
                }
              >
                <SelectTrigger className='w-[230px]'>
                  <SelectValue placeholder='Tous les statuts' />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusFilterLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className='text-sm text-muted-foreground'>
              {filteredTransactionData.length} / {transactionData.length}{' '}
              transactions
            </p>
          </div>
          );
}

export default AfficheFiltreStatut;*/
