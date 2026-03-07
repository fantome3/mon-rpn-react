/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import {
  useConfirmTransactionMutation,
  useDeleteTransactionMutation,
  useGetAllTransactionsQuery,
  useRefundTransactionMutation,
  useRejectTransactionMutation,
  useUpdateTransactionMutation,
} from '@/hooks/transactionHooks'
import { functionReverse, toastAxiosError } from '@/lib/utils'
import {
  getTransactionStatusBadgeClass,
  getTransactionStatusLabel,
  normalizeTransactionStatus,
} from '@/lib/transactionStatus'
import { Transaction } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import BilanTransactions from './BilanTransactions'
import TransactionsSetttings from './TransactionsSetttings'
import TransactionPageSubmenu from './TransactionPageSubmenu'
import ManualUserPaymentButton from '@/components/ManualUserPaymentButton'
import ManualBalanceReminderButton from '@/components/ManualBalanceReminderButton'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'

const isRefundable = (tx: Transaction) => {
  const normalizedStatus = normalizeTransactionStatus(tx.status)
  const fundType = tx.fundType
  return (
    normalizedStatus === 'completed' &&
    (fundType === 'rpn' || fundType === 'both')
  )
}

const isTransactionPending = (tx: Transaction) =>
  normalizeTransactionStatus(tx.status) === 'pending'

const Transactions = () => {
  const {
    data: transactions,
    isPending,
    error,
    refetch,
  } = useGetAllTransactionsQuery()

  const { mutateAsync: deleteTransaction, isPending: loadingDelete } =
    useDeleteTransactionMutation()
  const { mutateAsync: updateTransaction, isPending: loadingUpdate } =
    useUpdateTransactionMutation()
  const { mutateAsync: confirmTransaction, isPending: loadingConfirm } =
    useConfirmTransactionMutation()
  const { mutateAsync: rejectTransaction, isPending: loadingReject } =
    useRejectTransactionMutation()
  const { mutateAsync: refundTransaction, isPending: loadingRefund } =
    useRefundTransactionMutation()

  const [deleteModal, setDeleteModal] = useState(false)
  const [editModalVisibility, setEditModalVisibility] = useState(false)
  const [refundModalVisibility, setRefundModalVisibility] = useState(false)
  const [bilanModalVisibility, setBilanModalVisibility] = useState(false)
  const [settingModalVisibility, setSettingModalVisibility] = useState(false)

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editReason, setEditReason] = useState('')
  const [editRefInterac, setEditRefInterac] = useState('')
  const [refundAmount, setRefundAmount] = useState<number | ''>('')

  if (error) {
    toastAxiosError(error)
    return null
  }

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx)
    setEditReason(tx.reason || '')
    setEditRefInterac(tx.refInterac || '')
    setEditModalVisibility(true)
  }

  const openRefundModal = (tx: Transaction) => {
    setEditingTransaction(tx)
    setRefundAmount('')
    setRefundModalVisibility(true)
  }

  const transactionData = Array.isArray(transactions)
    ? transactions.map((tx) => ({
        ...tx,
        fullName: `${tx.userId?.origines?.lastName ?? ''} ${
          tx.userId?.origines?.firstName ?? ''
        }`,
      }))
    : []

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const created: string = row.getValue('createdAt')
        return <div>{functionReverse(created.substring(0, 10))}</div>
      },
    },
    {
      accessorKey: 'fullName',
      header: 'Utilisateur',
      cell: ({ row }) => <div>{row.getValue('fullName')}</div>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Statut
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge className={getTransactionStatusBadgeClass(status)}>
            {getTransactionStatusLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'reason',
      header: 'Raison',
      cell: ({ row }) => <div>{row.getValue('reason')}</div>,
    },
    {
      accessorKey: 'refInterac',
      header: 'Ref Interac',
      cell: ({ row }) => {
        const ref: string | undefined = row.getValue('refInterac')
        return <div>{ref ?? '-'}</div>
      },
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => <div>{row.getValue('amount')}</div>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableHiding: false,
      cell: ({ row }) => {
        const tx = row.original

        return (
          <div className='flex'>
            <IconButtonWithTooltip
              icon={<Pencil size={20} className='text-green-800' />}
              tooltip='Modifier motif'
              onClick={() => openEditModal(tx)}
            />

            {isTransactionPending(tx) ? (
              <>
                <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
                <IconButtonWithTooltip
                  icon={<Check size={20} className='text-green-700' />}
                  tooltip='Confirmer'
                  onClick={async () => {
                    try {
                      await confirmTransaction(String(tx._id))
                      toast({
                        variant: 'success',
                        title: 'Transaction confirmee',
                      })
                      refetch()
                    } catch (error) {
                      toastAxiosError(error)
                    }
                  }}
                />
                <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
                <IconButtonWithTooltip
                  icon={<X size={20} className='text-red-700' />}
                  tooltip='Rejeter'
                  onClick={async () => {
                    try {
                      await rejectTransaction(String(tx._id))
                      toast({
                        variant: 'default',
                        title: 'Transaction rejetee',
                      })
                      refetch()
                    } catch (error) {
                      toastAxiosError(error)
                    }
                  }}
                />
              </>
            ) : null}

            {isRefundable(tx) ? (
              <>
                <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
                <IconButtonWithTooltip
                  icon={<RotateCcw size={20} className='text-slate-700' />}
                  tooltip='Rembourser'
                  onClick={() => openRefundModal(tx)}
                />
              </>
            ) : null}

            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <IconButtonWithTooltip
              icon={<Trash2 size={20} className='text-red-600' />}
              tooltip='Supprimer'
              onClick={() => {
                setEditingTransaction(tx)
                setDeleteModal(true)
              }}
            />

            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualUserPaymentButton userId={tx.userId?._id} />
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualBalanceReminderButton userId={tx.userId?._id} />
          </div>
        )
      },
    },
  ]

  const deleteHandler = async () => {
    if (!editingTransaction?._id) return

    try {
      await deleteTransaction(String(editingTransaction._id))
      toast({
        variant: 'default',
          title: 'Suppression Réussie',
          description: 'Vous avez supprimé la transaction avec succès.',
      })
      refetch()
      setEditingTransaction(null)
      setDeleteModal(false)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const saveEditHandler = async () => {
    if (!editingTransaction?._id) return

    try {
      await updateTransaction({
        ...editingTransaction,
        reason: editReason,
        refInterac: editRefInterac,
      })
      toast({
        variant: 'default',
        title: 'Transaction mise à jour',
      })
      setEditModalVisibility(false)
      setEditingTransaction(null)
      refetch()
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const confirmRefundHandler = async () => {
    if (!editingTransaction?._id) return

    try {
      await refundTransaction({
        transactionId: String(editingTransaction._id),
        amount:
          refundAmount === '' || Number.isNaN(refundAmount)
            ? undefined
            : Number(refundAmount),
      })
      toast({
        variant: 'default',
        title: 'Remboursement effectue',
      })
      setRefundModalVisibility(false)
      setEditingTransaction(null)
      refetch()
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const anyActionLoading =
    loadingConfirm || loadingReject || loadingRefund || loadingDelete || loadingUpdate

  return (
    <>
      <div className='container mt-16 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Les transactions</h1>
        <TransactionPageSubmenu
          setBilanModalVisibility={setBilanModalVisibility}
          setSettingModalVisibility={setSettingModalVisibility}
        />
      </div>

      {isPending ? (
        <Loading />
      ) : (
        <div className='my-5 container'>
          <DataTable data={transactionData ?? []} columns={columns} />
        </div>
      )}

      {deleteModal ? (
        <CustomModal
          setOpen={() => setDeleteModal(false)}
          open={deleteModal}
          title='Supprimer transaction'
          description='Voulez-vous vraiment supprimer cette transaction?'
        >
          <div>
            <Button
              onClick={() => setDeleteModal(false)}
              className='bg-secondary text-primary mx-6'
            >
              Annuler
            </Button>

            <Button
              disabled={loadingDelete}
              onClick={deleteHandler}
              className='mx-12'
            >
              {loadingDelete ? <Loading /> : 'OK'}
            </Button>
          </div>
        </CustomModal>
      ) : null}

      {editModalVisibility ? (
        <CustomModal
          setOpen={() => setEditModalVisibility(false)}
          open={editModalVisibility}
          title='Modifier transaction'
          description='Modifier le motif et la référence Interac.'
        >
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Motif</label>
              <Input
                value={editReason}
                onChange={(event) => setEditReason(event.target.value)}
                placeholder='Motif transaction'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Numéro réference Interac: </label>
              <Input
                value={editRefInterac}
                onChange={(event) => setEditRefInterac(event.target.value)}
                placeholder='C2KM0'
              />
            </div>
            <Button disabled={loadingUpdate} onClick={saveEditHandler}>
              {loadingUpdate ? <Loading /> : 'Enregistrer'}
            </Button>
          </div>
        </CustomModal>
      ) : null}

      {refundModalVisibility ? (
        <CustomModal
          setOpen={() => setRefundModalVisibility(false)}
          open={refundModalVisibility}
          title='Rembourser transaction'
          description='Montant optionnel. Laisser vide pour remboursement total de la partie RPN.'
        >
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Montant à rembourser</label>
              <Input
                type='number'
                min={0}
                value={refundAmount}
                onChange={(event) => {
                  const nextValue = event.target.value
                  if (nextValue === '') {
                    setRefundAmount('')
                    return
                  }
                  setRefundAmount(Number(nextValue))
                }}
                placeholder='Ex: 25'
              />
            </div>
            <Button disabled={loadingRefund} onClick={confirmRefundHandler}>
              {loadingRefund ? <Loading /> : 'Confirmer remboursement'}
            </Button>
          </div>
        </CustomModal>
      ) : null}

      {bilanModalVisibility && (
        <CustomModal
          setOpen={() => {
            setBilanModalVisibility(false)
            refetch()
          }}
          open={bilanModalVisibility}
          title='Bilan des transactions'
          description='Découvrez le bilan des différentes transactions effectuées.'
          size='full'
        >
          <BilanTransactions />
        </CustomModal>
      )}

      {settingModalVisibility && (
        <CustomModal
          setOpen={() => {
            setSettingModalVisibility(false)
            refetch()
          }}
          open={settingModalVisibility}
          title='Les montants par prélèvement'
          description='Modifiez les différents montants par prélèvements.'
        >
          <TransactionsSetttings
            onSuccess={() => {
              setSettingModalVisibility(false)
              refetch()
            }}
          />
        </CustomModal>
      )}

      {anyActionLoading ? <div className='sr-only'>chargement</div> : null}
    </>
  )
}

export default Transactions
