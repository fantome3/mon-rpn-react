import { Calendar } from '@/components/CustomCalendar'
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
import { useNewDeathAnnouncementBatchMutation } from '@/hooks/deathAnnouncementHook'
import { cn, toastAxiosError } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, X } from 'lucide-react'
import { Control, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const singleDeathSchema = z.object({
  firstName: z.string().min(1, 'Prénoms et nom requis'),
  deathPlace: z.string().min(1, 'Lieu du décès requis'),
  deathDate: z.date({ required_error: 'Date du décès requise' }),
})

const batchSchema = z.object({
  deaths: z.array(singleDeathSchema).min(1),
})

type BatchFormValues = z.infer<typeof batchSchema>

const EMPTY_DEATH = (): z.infer<typeof singleDeathSchema> => ({
  firstName: '',
  deathPlace: 'Canada',
  deathDate: new Date(),
})

type DeathCardProps = {
  index: number
  control: Control<BatchFormValues>
  onRemove: () => void
  canRemove: boolean
}

function DeathCard({ index, control, onRemove, canRemove }: DeathCardProps) {
  return (
    <div className="relative rounded-lg border bg-card p-4 pt-8">
      <div className="absolute left-4 top-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Décès {index + 1}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Supprimer"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-4">
        <FormField
          control={control}
          name={`deaths.${index}.firstName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénoms et nom</FormLabel>
              <FormControl>
                <Input placeholder="Prénoms et nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`deaths.${index}.deathPlace`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu du décès (ville et province)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Exemple: Montréal, Québec, Canada"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`deaths.${index}.deathDate`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-0.5 text-sm">Date du décès</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
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
      </div>
    </div>
  )
}

type BatchDeathAnnouncementFormProps = {
  onSuccess: () => void
  onClose: () => void
}

export function BatchDeathAnnouncementForm({
  onSuccess,
  onClose,
}: BatchDeathAnnouncementFormProps) {
  const { mutateAsync, isPending } = useNewDeathAnnouncementBatchMutation()

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { deaths: [EMPTY_DEATH()] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'deaths',
  })

  const onSubmit = async (values: BatchFormValues) => {
    try {
      const response = await mutateAsync(values.deaths)
      toast({
        variant: 'default',
        title: 'Annonces enregistrées',
        description: response.message,
      })
      onSuccess()
    } catch (error) {
      toastAxiosError(error, 'Erreur lors de la publication')
    }
  }

  const count = fields.length

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4 pb-20">
          {fields.map((field, index) => (
            <DeathCard
              key={field.id}
              index={index}
              control={form.control}
              onRemove={() => remove(index)}
              canRemove={count > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append(EMPTY_DEATH())}
          >
            + Ajouter un autre décès
          </Button>
        </div>

        <div className="sticky bottom-0 border-t bg-background pt-3 pb-2 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Publier {count} décès
          </Button>
        </div>
      </form>
    </Form>
  )
}
