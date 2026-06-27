import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { MemberServiceCard } from '@/components/billing/MemberServiceCard'
import { InteracPaymentSection } from '@/components/billing/InteracPaymentSection'
import type { InteracPaymentSectionErrors } from '@/components/billing/InteracPaymentSection'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import { usePartialBillingMembers } from '@/hooks/usePartialBillingMembers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import { toastAxiosError } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

type MemberSelection = { membership: boolean; rpn: boolean }

const BillingPartiel = () => {
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eligibleMembers = usePartialBillingMembers()

  const initialSelections = useMemo(() => {
    const map: Record<string, MemberSelection> = {}
    for (const item of eligibleMembers) {
      map[item.memberId] = { membership: item.needsMembership, rpn: item.needsRpn }
    }
    return map
  }, [eligibleMembers])

  const [selections, setSelections] = useState<Record<string, MemberSelection>>(initialSelections)
  const [amountInterac, setAmountInterac] = useState('')
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<InteracPaymentSectionErrors>({})

  const { mutateAsync: newTransaction, isPending: isSubmitting } = useNewTransactionMutation()

  const handleMembershipToggle = (memberId: string, checked: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [memberId]: {
        membership: checked,
        rpn: checked ? (prev[memberId]?.rpn ?? false) : false,
      },
    }))
  }

  const handleRpnToggle = (memberId: string, checked: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], rpn: checked },
    }))
  }

  const { membershipTotal, rpnTotal, total, partialCoverage } = useMemo(() => {
    let membership = 0
    let rpn = 0
    const coverage: { memberId: string; services: ('membership' | 'rpn')[] }[] = []

    for (const item of eligibleMembers) {
      const sel = selections[item.memberId]
      if (!sel) continue
      const services: ('membership' | 'rpn')[] = []
      if (sel.membership) { membership += item.membershipFee; services.push('membership') }
      if (sel.rpn) { rpn += item.rpnFee; services.push('rpn') }
      if (services.length > 0) coverage.push({ memberId: item.memberId, services })
    }

    return { membershipTotal: membership, rpnTotal: rpn, total: membership + rpn, partialCoverage: coverage }
  }, [eligibleMembers, selections])

  const onSubmit = async () => {
    if (total === 0) {
      toast({ variant: 'destructive', title: 'Aucun service sélectionné', description: 'Veuillez cocher au moins un service.' })
      return
    }

    const schema = createInteracFormSchema(total)
    const validation = schema.safeParse({ amountInterac, refInterac })

    if (!validation.success) {
      const nextErrors: InteracPaymentSectionErrors = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'amountInterac') nextErrors.amountInterac = issue.message
        if (issue.path[0] === 'refInterac') nextErrors.refInterac = issue.message
      }
      setErrors(nextErrors)
      return
    }

    try {
      setErrors({})
      const fundType = membershipTotal > 0 && rpnTotal > 0 ? 'both'
        : membershipTotal > 0 ? 'membership' : 'rpn'

      await newTransaction({
        userId,
        amount: total,
        type: 'credit',
        fundType,
        membershipAmount: membershipTotal,
        rpnAmount: rpnTotal,
        reason: "Facturation partielle – membres ajoutés en cours d'année",
        refInterac: validation.data.refInterac,
        status: 'pending',
        partialCoverage,
      } as any)

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['accountsByUserId', userId] })

      toast({ variant: 'success', title: 'Paiement enregistré', description: 'Merci ! Votre paiement sera vérifié dans les prochains jours.' })
      navigate('/summary?payment=submitted', { replace: true })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  if (eligibleMembers.length === 0) {
    return (
      <>
        <SearchEngineOptimization title='Facturation complémentaire' description='Membres en cours de couverture' />
        <div className='container mb-10 pt-10'>
          <h1 className='text-3xl font-semibold'>Facturation complémentaire</h1>
          <Card className='mt-8'>
            <CardContent className='pt-6 flex flex-col items-center gap-4 text-center'>
              <CheckCircle2 className='h-10 w-10 text-green-500' />
              <p className='text-lg font-medium'>Tous vos membres sont à jour</p>
              <p className='text-sm text-muted-foreground'>Il n'y a aucun membre en attente de couverture membership ou d'inscription RPN.</p>
              <Button asChild variant='outline'>
                <Link to='/profil/couverture'>Voir ma couverture</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <SearchEngineOptimization title='Facturation complémentaire' description='Membres ajoutés après votre paiement annuel' />
      <div className='container mb-10 pt-10'>
        <h1 className='text-3xl font-semibold'>Facturation complémentaire</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Ces membres ont été ajoutés après votre paiement annuel. Sélectionnez les services à couvrir.
        </p>

        <div className='mt-6 space-y-4'>
          {eligibleMembers.map((item) => {
            const sel = selections[item.memberId] ?? { membership: false, rpn: false }
            const rpnDisabled = item.needsMembership && !sel.membership
            return (
              <MemberServiceCard
                key={item.memberId}
                memberId={item.memberId}
                name={`${item.member.firstName} ${item.member.lastName}`}
                relationship={item.member.relationship}
                needsMembership={item.needsMembership}
                needsRpn={item.needsRpn}
                membershipFee={item.membershipFee}
                rpnFee={item.rpnFee}
                membershipLocked={!item.isMembershipBillable}
                selMembership={sel.membership}
                selRpn={sel.rpn}
                rpnDisabled={rpnDisabled}
                onMembershipChange={(checked) => handleMembershipToggle(item.memberId, checked)}
                onRpnChange={(checked) => handleRpnToggle(item.memberId, checked)}
              />
            )
          })}
        </div>

        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Récapitulatif & paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <InteracPaymentSection
              membershipTotal={membershipTotal}
              rpnTotal={rpnTotal}
              total={total}
              amountInterac={amountInterac}
              refInterac={refInterac}
              errors={errors}
              isSubmitting={isSubmitting}
              onAmountChange={setAmountInterac}
              onRefChange={setRefInterac}
              onSubmit={onSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default BillingPartiel
