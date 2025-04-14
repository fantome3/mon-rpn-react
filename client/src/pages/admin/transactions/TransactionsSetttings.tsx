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
import { toast } from '@/components/ui/use-toast'
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from '@/hooks/settingHooks'
import { ToLocaleStringFunc } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  membershipUnitAmount: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  amountPerDependent: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  minimumBalanceRPN: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
})

type TransactionSettingsProps = {
  onSuccess?: () => void
}

const TransactionsSetttings = ({ onSuccess }: TransactionSettingsProps) => {
  const { data: settings, isPending } = useGetSettingsQuery()
  const { mutateAsync: updateSettings, isPending: loadingUpdate } =
    useUpdateSettingMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipUnitAmount: 0,
      amountPerDependent: 0,
      minimumBalanceRPN: 0,
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        membershipUnitAmount: settings.membershipUnitAmount || 0,
        amountPerDependent: settings.amountPerDependent || 0,
        minimumBalanceRPN: settings.minimumBalanceRPN || 0,
      })
    }
  }, [settings, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!settings?._id)
        return toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de trouver l’identifiant du paramètre.',
        })
      await updateSettings({ ...values, _id: settings._id })
      toast({
        variant: 'default',
        title: 'Modification réussie',
        description: 'Les paramètres ont été mis à jour avec succès.',
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Il semble que quelque chose cloche.',
      })
    }
  }

  if (isPending || !settings) return <Loading />
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='membershipUnitAmount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotisation annuelle</FormLabel>
              <FormControl>
                <Input
                  type='text'
                  placeholder='Cotisation annuelle'
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
          name='amountPerDependent'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prélèvement décès</FormLabel>
              <FormControl>
                <Input
                  type='text'
                  placeholder='Prélèvement décès'
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
          name='minimumBalanceRPN'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solde minimum</FormLabel>
              <FormControl>
                <Input
                  type='text'
                  placeholder='Solde minimum'
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
        {loadingUpdate ? <Loading /> : <Button type='submit'>Valider</Button>}
      </form>
    </Form>
  )
}

export default TransactionsSetttings
