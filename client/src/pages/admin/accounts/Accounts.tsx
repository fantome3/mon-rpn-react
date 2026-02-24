import apiClient from '@/apiClient'
import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
import Loading from '@/components/Loading'
import ManualBalanceReminderButton from '@/components/ManualBalanceReminderButton'
import ManualDeactivateButton from '@/components/ManualDeactivateButton'
import ManualReactivateButton from '@/components/ManualReactivateButton'
import ManualUserPaymentButton from '@/components/ManualUserPaymentButton'
import ManualToggleAdminButton from '@/components/ManualToggleAdminButton'
import ManualDeleteUserButton from '@/components/ManualDeleteUserButton'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import {
  useGetAccountsQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { Store } from '@/lib/Store'
import {
  ToLocaleStringFunc,
  formatCanadianPhone,
  functionReverse,
  toastAxiosError,
} from '@/lib/utils'
import { Account } from '@/types'
import { User } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  userTel: z.string(),
  userResidenceCountry: z.string(),
  solde: z.number(),
  membership_balance: z.number(),
  rpn_balance: z.number(),
  paymentMethod: z.string(),
  userId: z.string().optional(),
  isAwaitingFirstPayment: z.boolean().optional(),
})

const Accounts = () => {
  const { data: accounts, isPending, error, refetch } = useGetAccountsQuery()

  const { mutateAsync: updateAccount, isPending: loadingUpdate } =
    useUpdateAccountMutation()
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)
  const { dispatch: ctxDispatch } = useContext(Store)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: editingAccount ? editingAccount.firstName : '',
      lastName: editingAccount ? editingAccount.lastName : '',
      userTel: editingAccount ? editingAccount.userTel : '',
      userResidenceCountry: editingAccount
        ? editingAccount.userResidenceCountry
        : '',
      solde: editingAccount ? editingAccount.solde : 0,
      membership_balance: editingAccount ? editingAccount.membership_balance : 0,
      rpn_balance: editingAccount ? editingAccount.rpn_balance : 0,
      paymentMethod: editingAccount ? editingAccount.paymentMethod : '',
      userId: editingAccount?.userId || '',
      isAwaitingFirstPayment: editingAccount
        ? editingAccount.isAwaitingFirstPayment
        : false,
    },
  })

  useEffect(() => {
    if (editingAccount) {
      form.reset({
        firstName: editingAccount.firstName || '',
        lastName: editingAccount.lastName || '',
        userTel: editingAccount.userTel || '',
        userResidenceCountry: editingAccount.userResidenceCountry || '',
        solde: editingAccount.solde || 0,
        membership_balance: editingAccount.membership_balance || 0,
        rpn_balance: editingAccount.rpn_balance || 0,
        paymentMethod: editingAccount.paymentMethod || '',
        userId: editingAccount.userId,
        isAwaitingFirstPayment: editingAccount.isAwaitingFirstPayment || false,
      })
    }
  }, [editingAccount, form])

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Créé le',
      cell: ({ row }) => {
        const created: string = row.getValue('createdAt')
        const status = row.original.userId.subscription.status
        return (
          <div className={status === 'inactive' ? 'text-gray-400' : ''}>
            {' '}
            {functionReverse(created.substring(0, 10))}{' '}
          </div>
        )
      },
    },
    {
      id: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Prénoms & Nom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
      accessorFn: (row) => `${row.firstName} ${row.lastName}`, // Génère dynamiquement le champ
      cell: ({ row }) => {
        const status = row.original.userId.subscription.status
        const userId = row.original.userId?._id ?? row.original.userId
        return (
          <div className={status === 'inactive' ? 'text-gray-400' : ''}>
            <Link
              to={`/admin/accounts/${userId}/profile`}
              className='underline-offset-2 underline hover:text-primary transition-colors'
            >
              {row.original.firstName} {row.original.lastName}
            </Link>
          </div>
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const nameA = String(rowA.getValue(columnId)).toLowerCase()
        const nameB = String(rowB.getValue(columnId)).toLowerCase()
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: 'userTel',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Téléphone
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isInactive =
          row.original.userId.subscription.status === 'inactive'
        const userTel: string = row.getValue('userTel')
        return (
          <div className={isInactive ? 'text-gray-400' : ''}>
            {formatCanadianPhone(userTel)}
          </div>
        )
      },
    },
    {
      accessorKey: 'userResidenceCountry',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Pays de résidence
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isInactive =
          row.original.userId.subscription.status === 'inactive'
        const residenceCountry: string = row.getValue('userResidenceCountry')
        return (
          <div className={isInactive ? 'text-gray-400' : ''}>
            {residenceCountry}
          </div>
        )
      },
    },
    {
      accessorKey: 'solde',
      header: 'Solde',
      cell: ({ row }) => {
        const solde: number = row.getValue('solde')
        const status = row.original.userId.subscription.status
        return (
          <div className={status === 'inactive' ? 'text-gray-400' : ''}>
            {' '}
            {ToLocaleStringFunc(solde)}{' '}
          </div>
        )
      },
    },
    {
      accessorKey: 'isAwaitingFirstPayment',
      header: 'En attente paiement',
      cell: ({ row }) => {
        const awaiting: boolean = row.getValue('isAwaitingFirstPayment')
        const status = row.original.userId.subscription.status
        return (
          <div className={status === 'inactive' ? 'text-gray-400' : ''}>
            {awaiting ? 'Oui' : 'Non'}
          </div>
        )
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Méthode paiement',
      cell: ({ row }) => {
        const paymentMethod = row.original.paymentMethod
        const status = row.original.userId.subscription.status
        if (paymentMethod === 'credit_card') {
          return (
            <Badge
              className={
                status === 'inactive' ? 'bg-gray-400' : 'bg-fuchsia-500'
              }
            >
              {paymentMethod}
            </Badge>
          )
        } else {
          return (
            <Badge
              className={status === 'inactive' ? 'bg-gray-400' : 'bg-sky-400'}
            >
              {paymentMethod}
            </Badge>
          )
        }
      },
    },
    {
      accessorKey: 'action',
      header: () => <div className="text-center w-full">Action</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const isInactive =
          row.original.userId.subscription.status === 'inactive'
        return (
          <div className={`flex `}>
            <IconButtonWithTooltip
              icon={<Pencil size={20} className='text-green-800' />}
              tooltip='Modifier'
              onClick={() => {
                setEditingAccount(row.original)
                setModalVisibility(true)
              }}
              disabled={isInactive}
            />
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualUserPaymentButton
              userId={row.original.userId._id}
              disabled={isInactive}
            />
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualBalanceReminderButton
              userId={row.original.userId._id}
              disabled={isInactive}
            />
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualToggleAdminButton
              userId={row.original.userId._id}
              isAdmin={row.original.userId.isAdmin}
              refetch={refetch}
            />
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            {row.original.userId.subscription.status === 'inactive' ? (
              <ManualReactivateButton
                userId={row.original.userId._id}
                refetch={refetch}
              />
            ) : (
              <ManualDeactivateButton
                userId={row.original.userId._id}
                refetch={refetch}
              />
            )}
            <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
            <ManualDeleteUserButton
              userId={row.original.userId._id}
              refetch={refetch}
              disabled={row.original.userId.isAdmin}
            />
          </div>
        )
      },
    },
  ]

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateAccount({
        ...values,
        userId: editingAccount?.userId ?? '',
        _id: editingAccount?._id,
      })

      // 🔁 Rafraîchir le Store si c'est l'utilisateur connecté
      if (editingAccount?.userId) {
        const updatedUser = await apiClient.get<User>(
          `api/users/${editingAccount.userId}`
        )

        // Mettre à jour le Store et le localStorage avec les nouvelles données
        ctxDispatch({ type: 'USER_LOGIN', payload: updatedUser.data })
        localStorage.setItem('userInfo', JSON.stringify(updatedUser.data))
      }
      toast({
        variant: 'default',
        title: 'Modification Compte',
        description: 'Le compte a été modifié avec succès.',
      })
      setEditingAccount(null)
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

  const { register } = form

  return (
    <>
      <div className='container mt-16'>
        <h1 className='text-2xl font-semibold'>Les Comptes</h1>
      </div>
      {isPending ? (
        <Loading />
      ) : error ? (
        toastAxiosError(error)
      ) : (
        <>
          <div className='container'>
            <DataTable
              columns={columns}
              data={accounts}
              initialColumnVisibility={{
                userResidenceCountry: false,
                isAwaitingFirstPayment: false,
                paymentMethod: false,
              }}
            />
          </div>
        </>
      )}
      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Modifier Compte'
          description={`Modifier les informations d'un compte `}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Prénoms</FormLabel>
                    <FormControl>
                      <Input placeholder='Nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='userTel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder='Tél' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='userResidenceCountry'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Pays de résidence</FormLabel>
                    <FormControl>
                      <Input placeholder='Pays de résidence' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='solde'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Solde</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Son solde'
                        {...field}
                        {...register('solde', { valueAsNumber: true })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='paymentMethod'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>
                      Méthode de paiement
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Méthode de paiement'
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isAwaitingFirstPayment'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-sm'>
                      En attente 1er paiement
                    </FormLabel>
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
    </>
  )
}

export default Accounts
