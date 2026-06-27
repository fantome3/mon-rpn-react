import Loading from '@/components/Loading'
import { MoneyFormField } from '@/components/MoneyFormField'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from '@/hooks/settingHooks'
import apiClient from '@/apiClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  membershipUnitAmount: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  studentMembershipUnitAmount: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  amountPerDependent: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  minimumBalanceRPN: z
    .number()
    .min(0, { message: 'Le montant doit être positif' }),
  maxMissedReminders: z
    .number()
    .int()
    .min(0, { message: 'La valeur doit être positive' }),
})

type TransactionSettingsProps = {
  onSuccess?: () => void
}

const TransactionsSetttings = ({ onSuccess }: TransactionSettingsProps) => {
  const { data: settings, isPending } = useGetSettingsQuery()
  const { mutateAsync: updateSettings, isPending: loadingUpdate } =
    useUpdateSettingMutation()

  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillResult, setBackfillResult] = useState<{ fixed: number; users: Array<{ name: string; members: Array<{ name: string; oldStatus: string; newStatus: string }> }> } | null>(null)

  const handleBackfillRpnStatus = async () => {
    setBackfillLoading(true)
    setBackfillResult(null)
    try {
      const { data } = await apiClient.post('api/users/admin/backfill-rpn-status')
      setBackfillResult(data)
      toast({
        variant: 'default',
        title: `Migration terminée — ${data.fixed} membre(s) corrigé(s)`,
        description: data.fixed === 0 ? 'Aucune donnée à corriger.' : `Voir le détail ci-dessous.`,
      })
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la migration.' })
    } finally {
      setBackfillLoading(false)
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipUnitAmount: 0,
      studentMembershipUnitAmount: 0,
      amountPerDependent: 0,
      minimumBalanceRPN: 0,
      maxMissedReminders: 0,
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        membershipUnitAmount: settings.membershipUnitAmount || 0,
        studentMembershipUnitAmount: settings.studentMembershipUnitAmount || 0,
        amountPerDependent: settings.amountPerDependent || 0,
        minimumBalanceRPN: settings.minimumBalanceRPN || 0,
        maxMissedReminders: settings.maxMissedReminders || 0,
      })
    }
  }, [settings, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!settings?._id)
        return toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Impossible de trouver l'identifiant du paramètre.",
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
    <div className='space-y-8'>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <MoneyFormField
            control={form.control}
            name='membershipUnitAmount'
            label='Montant cotisation annuelle travailleur'
          />
          <MoneyFormField
            control={form.control}
            name='studentMembershipUnitAmount'
            label='Montant cotisation annuelle etudiant'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <MoneyFormField
            control={form.control}
            name='amountPerDependent'
            label='Montant Prélèvement par décès'
          />
          <MoneyFormField
            control={form.control}
            name='minimumBalanceRPN'
            label='Solde minimum par personne au rpn'
          />
        </div>

        <div className='w-1/2'>
          <MoneyFormField
            control={form.control}
            name='maxMissedReminders'
            label='Max de prélèvement manqués avant désactivation'
            isInteger
          />
        </div>

        {loadingUpdate ? <Loading /> : <Button type='submit'>Valider</Button>}
      </form>
    </Form>

    <div className='border-t pt-6 space-y-3'>
      <p className='text-sm font-semibold'>Maintenance — Données RPN</p>
      <p className='text-xs text-muted-foreground'>
        Corrige le champ <code>rpnStatus</code> des membres de famille inscrits sur notrerpn.org
        avant l'ajout de ce champ en base. À exécuter une seule fois.
      </p>
      <Button
        variant='outline'
        size='sm'
        disabled={backfillLoading}
        onClick={handleBackfillRpnStatus}
        className='border-orange-400 text-orange-700 hover:bg-orange-50'
      >
        {backfillLoading ? 'Migration en cours…' : 'Corriger rpnStatus legacy'}
      </Button>

      {backfillResult !== null && (
        <div className='rounded-md border border-orange-200 bg-orange-50 p-3 text-xs space-y-1'>
          <p className='font-semibold text-orange-800'>
            {backfillResult.fixed === 0
              ? 'Aucun membre à corriger.'
              : `${backfillResult.fixed} membre(s) corrigé(s) :`}
          </p>
          {backfillResult.users.map((u) => (
            <div key={u.name}>
              <p className='font-medium text-orange-900'>{u.name}</p>
              {u.members.map((m) => (
                <p key={m.name} className='text-orange-700 pl-2'>
                  · {m.name} : {m.oldStatus} → {m.newStatus}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}

export default TransactionsSetttings
