import { Calendar } from '@/components/CustomCalendar'
import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import {
  useGetAnnouncementsQuery,
  useNewDeathAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from '@/hooks/deathAnnouncementHook'
import { cn, functionReverse } from '@/lib/utils'
import { DeathAnnouncement } from '@/types/DeathAnnouncement'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { format } from 'date-fns'
import { ArrowUpDown, CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  firstName: z.string(),
  deathPlace: z.string(),
  deathDate: z.date(),
})

const Announcements = () => {
  const {
    data: announcements,
    isPending,
    error,
    refetch,
  } = useGetAnnouncementsQuery()
  const { mutateAsync: newAnnouncement, isPending: loadindNew } =
    useNewDeathAnnouncementMutation()
  const { mutateAsync: updateAnnouncement, isPending: loadingUpdate } =
    useUpdateAnnouncementMutation()
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<DeathAnnouncement | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: editingAnnouncement ? editingAnnouncement.firstName : '',
      deathPlace: editingAnnouncement
        ? editingAnnouncement.deathPlace
        : 'Canada',
      deathDate: editingAnnouncement
        ? editingAnnouncement.deathDate
        : new Date(),
    },
  })

  const columns: ColumnDef<DeathAnnouncement>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date Annonce',
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
      accessorKey: 'deathPlace',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Lieu du décès
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'deathDate',
      header: 'Date du décès',
      cell: ({ row }) => {
        const created: string = row.getValue('deathDate')
        return <div> {functionReverse(created.substring(0, 10))} </div>
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex '>
          <Pencil
            size={20}
            onClick={() => {
              setEditingAnnouncement(row.original)
              setModalVisibility(true)
            }}
            className='dark:text-green-500 text-green-800 mr-4 cursor-pointer'
          />
          <div className='font-semibold text-[#b9bdbc] mr-2'>|</div>
          <Trash2
            size={20}
            onClick={() => {}}
            className='text-red-800 dark:text-red-500 ml-4 cursor-pointer'
          />
        </div>
      ),
    },
  ]

  useEffect(() => {
    if (editingAnnouncement) {
      form.reset({
        firstName: editingAnnouncement?.firstName,
        deathPlace: editingAnnouncement?.deathPlace,
        deathDate: new Date(editingAnnouncement?.deathDate),
      })
    } else {
      form.reset({
        firstName: '',
        deathPlace: 'Canada',
        deathDate: new Date(),
      })
    }
  }, [editingAnnouncement, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!editingAnnouncement) {
      try {
        await newAnnouncement(values)
        toast({
          variant: 'default',
          title: `Création d'annonce`,
          description: 'Vous avez créé une nouvelle annonce.',
        })
        setModalVisibility(false)
        setEditingAnnouncement(null)
        refetch()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    } else {
      try {
        await updateAnnouncement({ ...values, _id: editingAnnouncement._id })
        setModalVisibility(false)
        setEditingAnnouncement(null)
        refetch()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    }
  }

  return (
    <>
      <div className='container mt-16 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Les Annonces</h1>
        <Button onClick={() => setModalVisibility(true)}>Ajouter</Button>
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
        <div className='mt-5 container'>
          <DataTable data={announcements} columns={columns} />
        </div>
      )}
      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setEditingAnnouncement(null)
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title={`${
            editingAnnouncement !== null
              ? 'Modifier Annonce'
              : 'Ajouter Annonce'
          }`}
          description={`${
            editingAnnouncement !== null
              ? 'Changer à votre convenance'
              : 'Créer une nouvelle annonce'
          }`}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénoms et Nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Prénoms et Nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='deathPlace'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu du décès</FormLabel>
                    <FormControl>
                      <Input placeholder='Nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='deathDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className={clsx('mb-0.5 text-sm')}>
                      Date du décès
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left text-sm',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          captionLayout='dropdown-buttons'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1960-01-01')
                          }
                          initialFocus
                          fromYear={1960}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loadindNew || loadingUpdate ? (
                <Loading />
              ) : (
                <Button className='mr-4' type='submit'>
                  Valider
                </Button>
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

export default Announcements
