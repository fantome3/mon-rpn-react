/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import {
  useDeleteTransactionMutation,
  useGetAllTransactionsQuery,
  useUpdateTransactionMutation,
} from '@/hooks/transactionHooks'
import { transactionStatus, transactionType } from '@/lib/constant'
import {
  functionReverse,
  ToLocaleStringFunc,
  toastAxiosError,
} from '@/lib/utils'
import { Transaction } from '@/types/Transaction'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import BilanTransactions from './BilanTransactions'
import TransactionsSetttings from './TransactionsSetttings'
import TransactionPageSubmenu from './TransactionPageSubmenu'
import ManualUserPaymentButton from '@/components/ManualUserPaymentButton'
import ManualBalanceReminderButton from '@/components/ManualBalanceReminderButton'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
import { TransactionState } from '@/domain/transaction/TransactionState'
import { createTransactionState } from '@/domain/transaction/states'

const formSchema = z.object({
  userId: z.union([z.string(), z.any()]),
  amount: z.number().min(0, { message: 'Le montant doit être positif' }),
  type: z.enum(['debit', 'credit']),
  reason: z.string().min(1, { message: 'La raison est requise' }),
  state: z.enum(['completed', 'failed', 'pending', 'awaiting_payment']),
})

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
  const [modalVisibility, setModalVisibility] = useState(false)
  const [bilanModalVisibility, setBilanModalVisibility] = useState(false)
  const [settingModalVisibility, setSettingModalVisibility] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: editingTransaction ? editingTransaction.userId : '',
      amount: editingTransaction ? editingTransaction.amount : 0,
      type: editingTransaction ? editingTransaction.type : 'debit',
      reason: editingTransaction ? editingTransaction.reason : '',
      state: editingTransaction
        ? editingTransaction.state.status
        : 'completed',
    },
  })

  useEffect(() => {
    if (editingTransaction) {
      form.reset({
        userId: editingTransaction.userId || '',
        amount: editingTransaction.amount || 0,
        type: editingTransaction.type || 'debit',
        reason: editingTransaction.reason || '',
        state: editingTransaction.state.status || 'completed',
      })
    }
  }, [editingTransaction, form])

  const transactionData = Array.isArray(transactions)
    ? transactions?.map((tx) => ({
        ...tx,
        fullName: `${tx.userId?.origines?.lastName ?? ''} ${
          tx.userId?.origines?.firstName ?? ''
        }`,
      }))
    : []

  if (error) {
    toastAxiosError(error)
    return null
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const created: string = row.getValue('createdAt')
        return <div> {functionReverse(created.substring(0, 10))} </div>
      },
    },
    {
      accessorKey: 'fullName',
      header: 'Utilisateur',
      cell: ({ row }) => <div>{row.getValue('fullName')}</div>,
    },
    {
      accessorKey: 'state',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Statut
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
      cell: ({ row }) => {
        const state = row.getValue('state') as TransactionState
        return (
          <Badge className={state.applyStyle()}>{state.getLabel()}</Badge>
        )
      },
    },
    {
      accessorKey: 'reason',
      header: 'Raison',
      cell: ({ row }) => {
        const reason: string = row.getValue('reason')
        return <div> {reason} </div>
      },
    },
    {
      accessorKey: 'refInterac',
      header: 'RefInterac',
      cell: ({ row }) => {
        const ref: string | undefined = row.getValue('refInterac')
        return <div> {ref ?? '-'} </div>
      },
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => {
        const amount: number = row.getValue('amount')
        return <div> {amount} </div>
      },
    },

    {
      accessorKey: 'action',
      header: 'Action',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex '>
          <IconButtonWithTooltip
            icon={<Pencil size={20} className='text-green-800' />}
            tooltip='Modifier'
            onClick={() => {
              setEditingTransaction(row.original)
              setModalVisibility(true)
            }}
          />
          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
          <IconButtonWithTooltip
            icon={<Trash2 size={20} className='text-red-600' />}
            tooltip='Supprimer'
            onClick={() => {
              setEditingTransaction(row.original)
              setDeleteModal(true)
            }}
          />
          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
          <ManualUserPaymentButton userId={row.original.userId?._id} />
          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
          <ManualBalanceReminderButton userId={row.original.userId?._id} />
        </div>
      ),
    },
  ]

  const deleteHandler = async () => {
    if (editingTransaction) {
      try {
        await deleteTransaction(editingTransaction?._id)
        toast({
          variant: 'default',
          title: 'Suppression Réussie',
          description: 'Vous avez supprimé la transaction avec succès.',
        })
        refetch()
        setEditingTransaction(null)
        setDeleteModal(false)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateTransaction({
        ...values,
        state: createTransactionState(values.state),
        userId: editingTransaction?.userId,
        _id: editingTransaction?._id,
      })
      toast({
        variant: 'default',
        title: 'Modification Transaction',
        description: 'La transaction a été modifié avec succès.',
      })
      setEditingTransaction(null)
      setModalVisibility(false)
      refetch()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Il semble que quelque chose cloche.',
      })
    }
  }

  return (
    <>
      <div className='container mt-16 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Les Transactions</h1>
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
          title='Supprimer Transaction'
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
              onClick={() => deleteHandler()}
              className='mx-12'
            >
              {loadingDelete ? <Loading /> : 'OK'}
            </Button>
          </div>
        </CustomModal>
      ) : (
        ''
      )}
      {modalVisibility ? (
        <CustomModal
          setOpen={() => setModalVisibility(false)}
          open={modalVisibility}
          title='Modifier transaction'
          description='Modifier les informations de la transaction'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionType?.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='Montant'
                        value={ToLocaleStringFunc(field.value)}
                        onChange={(event) => {
                          const rawValue = event.target.value.replace(/\s/g, '')
                          if (/^\d*$/.test(rawValue)) {
                            field.onChange(Number(rawValue))
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison</FormLabel>
                    <FormControl>
                      <Input placeholder='Raison' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='state'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionStatus?.map((status) => (
                          <SelectItem key={status.status} value={status.status}>
                            {status.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {loadingUpdate ? (
                <Loading />
              ) : (
                <Button type='submit'>Valider</Button>
              )}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}

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
    </>
  )
}

export default Transactions
