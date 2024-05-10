import AddMemberSection from '@/components/AddMemberSection'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { FamilyMember } from '@/types/User'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Pencil, Trash2, Tally1 } from 'lucide-react'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { relations, status } from '@/lib/constant'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.string(),
  status: z.string(),
})

const Dependents = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const {
    data: user,
    isPending,
    refetch,
  } = useGetUserDetailsQuery(userInfo?._id!)
  const [editingItem, setEditingItem] = useState<FamilyMember | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [getIndex, setGetIndex] = useState(0)

  const { mutateAsync: updateUser, isPending: updateLoading } =
    useUpdateUserMutation()

  const pathname = location.pathname

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: editingItem ? editingItem.firstName : '',
      lastName: editingItem ? editingItem.lastName : '',
      relationship: editingItem ? editingItem.relationship : '',
      status: editingItem ? editingItem.status : '',
    },
  })

  useEffect(() => {
    if (editingItem) {
      form.reset({
        firstName: editingItem.firstName || '',
        lastName: editingItem.lastName || '',
        relationship: editingItem.relationship || '',
        status: editingItem.status || '',
      })
    }
  }, [editingItem])

  const columns: ColumnDef<FamilyMember>[] = [
    {
      accessorKey: 'firstName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Prénom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'lastName',
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
      accessorKey: 'relationship',
      header: 'Relation',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        if (status === 'active') {
          return <Badge>{status}</Badge>
        }
        if (status === 'inactive') {
          return <Badge variant='outline'>{status}</Badge>
        }
        if (status === 'deleted') {
          return <Badge variant='destructive'>{status}</Badge>
        }
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex '>
          <Button
            disabled={row.original.status === 'deleted'}
            variant='ghost'
            size='sm'
          >
            <Pencil
              onClick={() => {
                setEditingItem(row.original)
                setModalVisibility(true)
                setGetIndex(row.index)
              }}
              className='text-[#5ec81b] mr-4'
            />
          </Button>

          <div className='font-semibold text-[#b9bdbc]'>
            <Tally1 size={30} />
          </div>
          <Button
            disabled={row.original.status === 'deleted'}
            variant='ghost'
            size='sm'
          >
            <Trash2
              onClick={() => {
                setEditingItem(row.original)
                setDeleteModal(true)
                setGetIndex(row.index)
              }}
              className='text-[#f10c0c] ml-4'
            />
          </Button>
        </div>
      ),
    },
  ]

  const deleteHandler = async () => {
    if (editingItem) {
      try {
        const deletedMember: FamilyMember = {
          ...editingItem,
          status: 'deleted',
        }
        const updatedFamilyMembers = [...user?.familyMembers!]
        updatedFamilyMembers[getIndex] = deletedMember
        await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        toast({
          variant: 'default',
          title: 'Membre supprimé avec succès',
          description: 'Votre membre de famille a été supprimé avec succès.',
        })
        form.reset()
        setDeleteModal(false)
        refetch()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Opps!',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingItem) {
        const updatedMember: FamilyMember = {
          ...editingItem,
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          status: values.status,
        }
        const updatedFamilyMembers = [...user?.familyMembers!]
        updatedFamilyMembers[getIndex] = updatedMember
        await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        toast({
          variant: 'default',
          title: 'Membre modifié avec succès',
          description: 'Votre membre de famille a été modifié avec succès.',
        })
        form.reset()
        setModalVisibility(false)
        refetch()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
    }
  }

  return (
    <>
      <div className='container mb-10'>
        <h1 className='text-center pt-10 mb-2 text-3xl font-semibold'>
          Bienvenue {userInfo?.origines?.firstName}
        </h1>
        <p className='text-center text-xl font-light mb-10'>
          Ensemble, nous sommes plus forts.
        </p>

        <AddMemberSection />
        <div className='mt-10'>
          <div className='flex justify-between'>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/profil',
              })}
              to='/profil'
            >
              Mon profile
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/dependents',
              })}
              to='/dependents'
            >
              Personnes à charge
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/sponsorship',
              })}
              to='/sponsorship'
            >
              Parrainage
            </Link>
          </div>
          <Separator className=' mt-3 mb-1 bg-primary' />
          <Card className='bg-[#e9f5eb] min-h-[70vh]'>
            <CardContent className='p-8'>
              <div className='flex items-center justify-between mb-8'>
                <h2 className='text-xl font-medium '>
                  Liste des personnes à charge
                </h2>
              </div>

              {isPending ? (
                <Loading />
              ) : (
                <>
                  <DataTable columns={columns} data={user?.familyMembers!} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {deleteModal ? (
        <CustomModal
          setOpen={() => setDeleteModal(false)}
          open={deleteModal}
          title='Supprimer Membre'
          description='Voulez-vous vraiment supprimer ce membre?'
        >
          <Button
            variant='outline'
            onClick={() => setDeleteModal(false)}
            className='mx-6'
          >
            Annuler
          </Button>
          <Button disabled={updateLoading} onClick={() => deleteHandler()}>
            Ok
          </Button>
        </CustomModal>
      ) : (
        ''
      )}

      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Modifier membre'
          description={`Modifier les informations dun membre de votre famille `}
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
                      <Input placeholder='Son prénom' {...field} />
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
                      <Input placeholder='Son nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='relationship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Relation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Votre relation' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation.name} value={relation.name}>
                            {relation.name}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {status.map((stat) => (
                          <SelectItem key={stat.name} value={stat.name}>
                            {stat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isPending || updateLoading ? (
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

export default Dependents
