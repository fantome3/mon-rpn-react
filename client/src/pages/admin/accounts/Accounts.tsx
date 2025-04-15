import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
import Loading from '@/components/Loading'
import ManualBalanceReminderButton from '@/components/ManualBalanceReminderButton'
import ManualUserPaymentButton from '@/components/ManualUserPaymentButton'
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
import { toast } from '@/components/ui/use-toast'
import {
  useGetAccountsQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { ToLocaleStringFunc, functionReverse } from '@/lib/utils'
import { Account } from '@/types/Account'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  firstName: z.string(),
  userTel: z.string(),
  userResidenceCountry: z.string(),
  solde: z.number(),
  paymentMethod: z.string(),
  userId: z.string().optional(),
})

const Accounts = () => {
  const { data: accounts, isPending, error, refetch } = useGetAccountsQuery()
  const { mutateAsync: updateAccount, isPending: loadingUpdate } =
    useUpdateAccountMutation()
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: editingAccount ? editingAccount.firstName : '',
      userTel: editingAccount ? editingAccount.userTel : '',
      userResidenceCountry: editingAccount
        ? editingAccount.userResidenceCountry
        : '',
      solde: editingAccount ? editingAccount.solde : 0,
      paymentMethod: editingAccount ? editingAccount.paymentMethod : '',
      userId: editingAccount?.userId || '',
    },
  })

  useEffect(() => {
    if (editingAccount) {
      form.reset({
        firstName: editingAccount.firstName || '',
        userTel: editingAccount.userTel || '',
        userResidenceCountry: editingAccount.userResidenceCountry || '',
        solde: editingAccount.solde || 0,
        paymentMethod: editingAccount.paymentMethod || '',
        userId: editingAccount.userId,
      })
    }
  }, [editingAccount, form])

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Créé le',
      cell: ({ row }) => {
        const created: string = row.getValue('createdAt')
        return <div> {functionReverse(created.substring(0, 10))} </div>
      },
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
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
    },
    {
      accessorKey: 'solde',
      header: 'Solde',
      cell: ({ row }) => {
        const solde: number = row.getValue('solde')
        return <div> {ToLocaleStringFunc(solde)} </div>
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Méthode de paiement',
      cell: ({ row }) => {
        const paymentMethod = row.original.paymentMethod

        if (paymentMethod === 'credit_card') {
          return <Badge className='bg-fuchsia-500'>{paymentMethod}</Badge>
        } else {
          return <Badge className='bg-sky-400'>{paymentMethod}</Badge>
        }
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
              setEditingAccount(row.original)
              setModalVisibility(true)
            }}
          />
          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
          <ManualUserPaymentButton userId={row.original.userId} />
          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>
          <ManualBalanceReminderButton userId={row.original.userId} />
        </div>
      ),
    },
  ]

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateAccount({
        ...values,
        userId: editingAccount?.userId ?? '',
        _id: editingAccount?._id,
      })
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
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Quelque chose ne va pas.',
        })
      ) : (
        <>
          <div className='container'>
            <DataTable columns={columns} data={accounts} />
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
                      <Input placeholder='Méthode de paiement' {...field} />
                    </FormControl>
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
    </>
  )
}

export default Accounts
