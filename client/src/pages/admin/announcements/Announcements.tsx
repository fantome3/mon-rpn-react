import { Calendar } from '@/components/CustomCalendar'
import CustomModal from '@/components/CustomModal'
import { DataTable } from '@/components/CustomTable'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
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
import {
  getAnnouncementStatusBadgeClass,
  getAnnouncementStatusLabel,
  normalizeAnnouncementStatus,
} from '@/lib/announcementStatus'
import { cn, formatCurrency, functionReverse, toastAxiosError } from '@/lib/utils'
import { DeathAnnouncement } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarIcon,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  firstName: z.string(),
  deathPlace: z.string(),
  deathDate: z.date(),
})

const Announcements = () => {
  const [processingAnnouncementId, setProcessingAnnouncementId] =
    useState<string | null>(null)
  const [processingAnnouncementDraft, setProcessingAnnouncementDraft] =
    useState<DeathAnnouncement | null>(null)
  const [shouldPoll, setShouldPoll] = useState(false)

  const {
    data: announcements,
    isPending,
    error,
    refetch,
  } = useGetAnnouncementsQuery({
    refetchInterval: shouldPoll ? 4000 : false,
  })
  const { mutateAsync: newAnnouncement, isPending: loadindNew } =
    useNewDeathAnnouncementMutation()
  const { mutateAsync: updateAnnouncement, isPending: loadingUpdate } =
    useUpdateAnnouncementMutation()
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<DeathAnnouncement | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)

  const currentProcessingAnnouncement =
    announcements?.find((item : any) => item._id === processingAnnouncementId) ??
    processingAnnouncementDraft

  const processingStatus = normalizeAnnouncementStatus(
    currentProcessingAnnouncement?.processingStatus
  )
  const isProcessing =
    processingStatus === 'pending' || processingStatus === 'processing'
  const isCompleted = processingStatus === 'completed'
  const isFailed = processingStatus === 'failed'

  useEffect(() => {
    if (!currentProcessingAnnouncement) {
      if (shouldPoll) setShouldPoll(false)
      return
    }

    const nextShouldPoll =
      processingStatus === 'pending' || processingStatus === 'processing'
    if (nextShouldPoll !== shouldPoll) {
      setShouldPoll(nextShouldPoll)
    }
  }, [currentProcessingAnnouncement, processingStatus, shouldPoll])

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
      header: "Date d'annonce",
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
      accessorKey: 'processingStatus',
      header: 'Traitement',
      cell: ({ row }) => (
        <Badge
          className={`text-xs ${getAnnouncementStatusBadgeClass(
            row.original.processingStatus
          )}`}
        >
          {getAnnouncementStatusLabel(row.original.processingStatus)}
        </Badge>
      ),
    },
    {
      accessorKey: 'expectedAmount',
      header: 'Montant attendu',
      cell: ({ row }) => {
        const summary = row.original.processingSummary
        if (!summary) return <span>-</span>
        return <span>{formatCurrency(summary.expectedAmount ?? 0)}</span>
      },
    },
    {
      accessorKey: 'collectedAmount',
      header: 'Montant reçu',
      cell: ({ row }) => {
        const summary = row.original.processingSummary
        if (!summary) return <span>-</span>
        return <span>{formatCurrency(summary.collectedAmount ?? 0)}</span>
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex '>
          <IconButtonWithTooltip
            icon={<Pencil size={20} className='text-green-800 ' />}
            tooltip='Modifier'
            onClick={() => {
              setEditingAnnouncement(row.original)
              setModalVisibility(true)
            }}
          />

          <div className='font-semibold text-[#b9bdbc] mx-2'>|</div>

          <IconButtonWithTooltip
            icon={<Trash2 size={20} className='text-red-600' />}
            tooltip='Supprimer'
            onClick={() => {}}
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
        deathPlace: '',
        deathDate: new Date(),
      })
    }
  }, [editingAnnouncement, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!editingAnnouncement) {
      try {
        const response = await newAnnouncement(values)
        setModalVisibility(false)
        setEditingAnnouncement(null)

        setProcessingAnnouncementId(response.announcement._id ?? null)
        setProcessingAnnouncementDraft(response.announcement)

        const nextStatus = normalizeAnnouncementStatus(
          response.announcement.processingStatus
        )
        setShouldPoll(nextStatus === 'pending' || nextStatus === 'processing')

        toast({
          variant: 'default',
          title: 'Annonce enregistrée',
          description: response.message,
        })
        refetch()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Oups !',
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
          title: 'Oups !',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    }
  }

  const processingTitle = isFailed
    ? 'Traitement interrompu'
    : isCompleted
      ? 'Traitement terminé'
      : 'Annonce enregistrée'

  const processingDescription = isFailed
    ? "Le traitement n'a pas pu être complété. Corrigez puis relancez si besoin."
    : isCompleted
      ? 'Le traitement est terminé. Le récapitulatif est disponible.'
      : 'Les prélèvements et notifications se font en arrière-plan. Vous pouvez continuer.'

  const processingSummary = currentProcessingAnnouncement?.processingSummary
  const processingFailureReason =
    currentProcessingAnnouncement?.processingFailureReason

  return (
    <>
      <div className='container mt-16 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Les annonces</h1>
        <Button onClick={() => setModalVisibility(true)}>
          Publier un décès
        </Button>
      </div>

      {currentProcessingAnnouncement && (
        <div className='container mt-6'>
          <div className='rounded-2xl border bg-white p-4 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-base font-semibold'>
                  {processingTitle}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {processingDescription}
                </p>
              </div>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted/40'>
                {isProcessing && (
                  <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
                )}
                {isCompleted && (
                  <CheckCircle2 className='h-5 w-5 text-green-600' />
                )}
                {isFailed && (
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                )}
              </div>
            </div>

            <div className='mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2'>
              <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Statut
              </span>
              <Badge
                className={`text-xs ${getAnnouncementStatusBadgeClass(
                  processingStatus
                )}`}
              >
                {getAnnouncementStatusLabel(processingStatus)}
              </Badge>
            </div>

            {processingFailureReason && (
              <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
                <p className='font-semibold'>Raison</p>
                <p>{processingFailureReason}</p>
              </div>
            )}

            {processingSummary && (
              <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Membres ciblés</p>
                  <p className='text-lg font-semibold'>
                    {processingSummary.totalUsers ?? 0}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Débits réussis</p>
                  <p className='text-lg font-semibold'>
                    {processingSummary.debitedCount ?? 0}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Montant attendu</p>
                  <p className='text-lg font-semibold'>
                    {formatCurrency(processingSummary.expectedAmount ?? 0)}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Montant reçu</p>
                  <p className='text-lg font-semibold'>
                    {formatCurrency(processingSummary.collectedAmount ?? 0)}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Solde insuffisant</p>
                  <p className='text-lg font-semibold'>
                    {processingSummary.insufficientFundsCount ?? 0}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Comptes manquants</p>
                  <p className='text-lg font-semibold'>
                    {processingSummary.missingAccountCount ?? 0}
                  </p>
                </div>
                <div className='rounded-lg bg-muted/40 p-3'>
                  <p className='text-xs text-muted-foreground'>Erreurs système</p>
                  <p className='text-lg font-semibold'>
                    {processingSummary.systemErrorCount ?? 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isPending ? (
        <Loading />
      ) : error ? (
        toastAxiosError(error)
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
                    <FormLabel>Prénoms et nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Prénoms et nom' {...field} />
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
                    <FormLabel>Lieu du décès (ville et province)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Exemple: 12 rue Charlotte, Montréal, Canada'
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
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
                              <span>Choisir une date</span>
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
                            date > new Date() || date < new Date('1930-01-01')
                          }
                          initialFocus
                          fromYear={1930}
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
