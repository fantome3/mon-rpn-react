import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { useBalanceCorrectionMutation } from '@/hooks/accountHooks'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import { buildTopUpReason, computeTopUpAllocation } from '@/lib/billing'
import { computeFamilyFeesSummary } from '@/lib/familyFees'
import {
  TOP_UP_TARGET_OPTIONS,
  TARGET_DESCRIPTIONS,
  TARGET_LABELS,
  computeMinimumPaymentByTarget,
  computeOutstandingTopUpAmounts,
  computeRecommendedTopUpAmounts,
  computeSuggestedPaymentAmount,
  type TargetAmountMap,
} from '@/lib/paymentPlan'
import { formatCurrency, toastAxiosError } from '@/lib/utils'
import { Account, SettingType, User, type TopUpTargetWithBoth } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown } from 'lucide-react'

export const MIGRATION_MODE_ENABLED = true

type FormErrors = {
  amountInterac?: string
  refInterac?: string
  target?: string
}

type MigrationErrors = {
  membership?: string
  rpn?: string
}

type Props = {
  userId: string
  currentAccount?: Account
  user: User
  settings?: SettingType
}

const AccountPaymentAssistant = ({ userId, currentAccount, user, settings }: Props) => {
  const queryClient = useQueryClient()
  const { mutateAsync: newTransaction, isPending: isCreatingTransaction } = useNewTransactionMutation()
  const { mutateAsync: balanceCorrection, isPending: isSavingCorrection } = useBalanceCorrectionMutation()

  const feeOverrides = {
    workerAmount: settings?.membershipUnitAmount,
    studentAmount: settings?.studentMembershipUnitAmount,
  }

  const familyFeesSummary = useMemo(
    () => computeFamilyFeesSummary(user, feeOverrides),
    [user, settings?.membershipUnitAmount, settings?.studentMembershipUnitAmount],
  )

  const recommendedTopUp = useMemo(
    () =>
      computeRecommendedTopUpAmounts({
        occupation: user?.register?.occupation,
        studentStatus: user?.register?.studentStatus,
        membershipDueAmount: familyFeesSummary.membershipAmount,
        rpnDueAmount: familyFeesSummary.rpnAmount,
        workerAmount: settings?.membershipUnitAmount,
        studentAmount: settings?.studentMembershipUnitAmount,
      }),
    [
      familyFeesSummary.membershipAmount,
      familyFeesSummary.rpnAmount,
      user?.register?.occupation,
      user?.register?.studentStatus,
      settings?.membershipUnitAmount,
      settings?.studentMembershipUnitAmount,
    ],
  )

  const currentMembershipBalance = currentAccount?.membership_balance ?? 0
  const currentRpnBalance = currentAccount?.rpn_balance ?? 0

  const outstandingTopUp = useMemo(
    () =>
      computeOutstandingTopUpAmounts({
        recommendedMembershipAmount: recommendedTopUp.membershipAmount,
        recommendedRpnAmount: recommendedTopUp.rpnAmount,
        currentMembershipBalance,
        currentRpnBalance,
      }),
    [
      recommendedTopUp.membershipAmount,
      recommendedTopUp.rpnAmount,
      currentMembershipBalance,
      currentRpnBalance,
    ],
  )

  const minimumByTarget = useMemo(
    () => computeMinimumPaymentByTarget(outstandingTopUp.targetAmounts),
    [outstandingTopUp.targetAmounts],
  )

  const suggestedByTarget = useMemo<TargetAmountMap>(
    () => ({
      membership: computeSuggestedPaymentAmount({
        target: 'membership',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
      rpn: computeSuggestedPaymentAmount({
        target: 'rpn',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
      both: computeSuggestedPaymentAmount({
        target: 'both',
        outstandingByTarget: outstandingTopUp.targetAmounts,
        recommendedByTarget: recommendedTopUp.targetAmounts,
      }),
    }),
    [outstandingTopUp.targetAmounts, recommendedTopUp.targetAmounts],
  )

  const initialTarget: TopUpTargetWithBoth =
    outstandingTopUp.targetAmounts.both > 0 ? 'both' : 'membership'

  const [selectedTarget, setSelectedTarget] = useState<TopUpTargetWithBoth>(initialTarget)
  const [amountInterac, setAmountInterac] = useState<string>(String(suggestedByTarget[initialTarget]))
  const [refInterac, setRefInterac] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const [isMigrationOpen, setIsMigrationOpen] = useState(false)
  const [migrationMembershipBalance, setMigrationMembershipBalance] = useState('')
  const [migrationRpnBalance, setMigrationRpnBalance] = useState('')
  const [migrationErrors, setMigrationErrors] = useState<MigrationErrors>({})

  useEffect(() => {
    setAmountInterac(String(suggestedByTarget[selectedTarget]))
  }, [selectedTarget, suggestedByTarget])

  const invalidateQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accountsByUserId', userId] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
    ])

  const onSubmitPayment = async () => {
    const schema = createInteracFormSchema(minimumByTarget[selectedTarget])
    const validation = schema.safeParse({ amountInterac, refInterac })

    if (!validation.success) {
      const nextErrors: FormErrors = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'amountInterac') nextErrors.amountInterac = issue.message
        if (issue.path[0] === 'refInterac') nextErrors.refInterac = issue.message
      }
      setErrors(nextErrors)
      return
    }

    try {
      setErrors({})
      const validatedAmount = validation.data.amountInterac
      const allocation = computeTopUpAllocation({
        target: selectedTarget,
        amountInterac: validatedAmount,
        membershipDueAmount: outstandingTopUp.membershipAmount,
        rpnDueAmount: outstandingTopUp.rpnAmount,
      })

      await newTransaction({
        userId,
        amount: validatedAmount,
        type: 'credit',
        fundType: selectedTarget,
        membershipAmount: allocation.membershipAmount,
        rpnAmount: allocation.rpnAmount,
        reason: buildTopUpReason(selectedTarget),
        refInterac,
        status: 'pending',
      })

      await invalidateQueries()
      setRefInterac('')
      toast({
        variant: 'success',
        title: 'Paiement enregistré',
        description: "Le paiement a été ajouté. Il apparaîtra dans l'historique après vérification.",
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const onSubmitCorrection = async () => {
    const membership = migrationMembershipBalance !== '' ? parseFloat(migrationMembershipBalance) : undefined
    const rpn = migrationRpnBalance !== '' ? parseFloat(migrationRpnBalance) : undefined

    if (membership === undefined && rpn === undefined) {
      setMigrationErrors({ membership: 'Veuillez saisir au moins un montant.' })
      return
    }

    const validationErrors: MigrationErrors = {}
    if (membership !== undefined && (isNaN(membership) || membership < 0)) {
      validationErrors.membership = 'Montant invalide (doit être >= 0).'
    }
    if (rpn !== undefined && (isNaN(rpn) || rpn < 0)) {
      validationErrors.rpn = 'Montant invalide (doit être >= 0).'
    }
    if (Object.keys(validationErrors).length > 0) {
      setMigrationErrors(validationErrors)
      return
    }

    if (!currentAccount?._id) return

    try {
      setMigrationErrors({})
      await balanceCorrection({
        accountId: currentAccount._id,
        membershipBalance: membership,
        rpnBalance: rpn,
      })
      await invalidateQueries()
      setMigrationMembershipBalance('')
      setMigrationRpnBalance('')
      setIsMigrationOpen(false)
      toast({
        variant: 'success',
        title: 'Soldes corrigés',
        description: 'Les soldes ont été mis à jour selon les données Excel du comptable.',
      })
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <Card className='mt-4 border-primary/20'>
      <CardHeader className='space-y-2'>
        <CardTitle>Assistant de paiement pour utilisateur novice</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Choisissez le type, vérifiez le montant dû selon la famille, puis enregistrez le paiement Interac.
        </p>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-lg border p-3'>
            <p className='text-xs text-muted-foreground'>Membership restant à collecter</p>
            <p className='mt-1 text-lg font-semibold'>
              {formatCurrency(outstandingTopUp.membershipAmount)}
            </p>
            <p className='text-xs text-muted-foreground'>
              Total dû : {formatCurrency(recommendedTopUp.membershipAmount)} — Solde : {formatCurrency(currentMembershipBalance)}
            </p>
          </div>
          <div className='rounded-lg border p-3'>
            <p className='text-xs text-muted-foreground'>RPN restant à collecter</p>
            <p className='mt-1 text-lg font-semibold'>
              {formatCurrency(outstandingTopUp.rpnAmount)}
            </p>
            <p className='text-xs text-muted-foreground'>
              Total dû : {formatCurrency(recommendedTopUp.rpnAmount)} — Solde : {formatCurrency(currentRpnBalance)}
            </p>
          </div>
        </div>

        <div>
          <p className='mb-2 text-sm font-medium'>Type de paiement à enregistrer</p>
          <RadioGroup
            value={selectedTarget}
            onValueChange={(value) => {
              const nextTarget = value as TopUpTargetWithBoth
              if (!TOP_UP_TARGET_OPTIONS.includes(nextTarget)) return
              setSelectedTarget(nextTarget)
              setErrors((prev) => ({ ...prev, target: undefined }))
            }}
            className='grid gap-3 sm:grid-cols-3'
          >
            {TOP_UP_TARGET_OPTIONS.map((target) => {
              const isSelected = selectedTarget === target
              return (
                <Label
                  key={target}
                  htmlFor={`admin-${target}`}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-start gap-3'>
                      <RadioGroupItem value={target} id={`admin-${target}`} className='mt-1' />
                      <div>
                        <p className='text-sm font-semibold'>{TARGET_LABELS[target]}</p>
                        <p className='text-xs text-muted-foreground'>
                          {TARGET_DESCRIPTIONS[target]}
                        </p>
                      </div>
                    </div>
                  </div>
                </Label>
              )
            })}
          </RadioGroup>
          {errors.target ? (
            <p className='mt-1 text-sm text-destructive'>{errors.target}</p>
          ) : null}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <div className='flex items-center justify-between gap-2'>
              <Label htmlFor='amountInterac'>Montant reçu</Label>
            </div>
            <Input
              id='amountInterac'
              type='number'
              min={0}
              value={amountInterac}
              onChange={(event) => setAmountInterac(event.target.value)}
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              Minimum requis: {formatCurrency(minimumByTarget[selectedTarget])}
              {selectedTarget === 'both'
                ? ' (si dépassement, le surplus est ajouté au fonds RPN).'
                : '.'}
            </p>
            {errors.amountInterac ? (
              <p className='mt-1 text-sm text-destructive'>{errors.amountInterac}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor='refInterac'>
              Code Interac communiqué par sa banque
            </Label>
            <Input
              id='refInterac'
              value={refInterac}
              onChange={(event) => setRefInterac(event.target.value)}
              placeholder='CA1we0Tq90'
            />
            {errors.refInterac ? (
              <p className='mt-1 text-sm text-destructive'>{errors.refInterac}</p>
            ) : null}
          </div>
        </div>

        <div className='sticky bottom-0 z-10 -mx-2 border-t bg-background/95 px-2 py-3 backdrop-blur sm:static sm:m-0 sm:border-none sm:bg-transparent sm:p-0'>
          <Button
            type='button'
            onClick={onSubmitPayment}
            disabled={isCreatingTransaction}
            className='w-full sm:w-auto'
          >
            {isCreatingTransaction ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </div>

        {MIGRATION_MODE_ENABLED && (
          <>
            <Separator className='my-1' />
            <Collapsible open={isMigrationOpen} onOpenChange={setIsMigrationOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  className='w-full flex items-center justify-between gap-2 border border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                >
                  <span className='flex items-center gap-2 text-sm'>
                    <AlertTriangle className='h-4 w-4 shrink-0' />
                    Correction Excel (migration temporaire)
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isMigrationOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className='space-y-4 pt-4'>
                <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800'>
                  <p className='text-sm font-semibold'>Mode migration Excel</p>
                  <p className='mt-1 text-xs'>
                    Les montants saisis remplaceront directement les soldes actuels. Utilisez uniquement pour importer les données du fichier Excel du comptable. Les champs vides ne sont pas modifiés.
                  </p>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <Label htmlFor='migration-membership'>
                      Nouveau solde Membership ($)
                    </Label>
                    <Input
                      id='migration-membership'
                      type='number'
                      min={0}
                      step='0.01'
                      placeholder={String(currentMembershipBalance)}
                      value={migrationMembershipBalance}
                      onChange={(e) => {
                        setMigrationMembershipBalance(e.target.value)
                        setMigrationErrors((prev) => ({ ...prev, membership: undefined }))
                      }}
                      className='mt-1'
                    />
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Solde actuel : {formatCurrency(currentMembershipBalance)}
                    </p>
                    {migrationErrors.membership && (
                      <p className='mt-1 text-xs text-destructive'>{migrationErrors.membership}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='migration-rpn'>
                      Nouveau solde RPN ($)
                    </Label>
                    <Input
                      id='migration-rpn'
                      type='number'
                      min={0}
                      step='0.01'
                      placeholder={String(currentRpnBalance)}
                      value={migrationRpnBalance}
                      onChange={(e) => {
                        setMigrationRpnBalance(e.target.value)
                        setMigrationErrors((prev) => ({ ...prev, rpn: undefined }))
                      }}
                      className='mt-1'
                    />
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Solde actuel : {formatCurrency(currentRpnBalance)}
                    </p>
                    {migrationErrors.rpn && (
                      <p className='mt-1 text-xs text-destructive'>{migrationErrors.rpn}</p>
                    )}
                  </div>
                </div>

                <div className='sticky bottom-0 z-10 -mx-2 border-t bg-background/95 px-2 py-3 backdrop-blur sm:static sm:m-0 sm:border-none sm:bg-transparent sm:p-0'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onSubmitCorrection}
                    disabled={isSavingCorrection}
                    className='w-full border-amber-300 text-amber-800 hover:bg-amber-50 sm:w-auto'
                  >
                    {isSavingCorrection ? 'Correction en cours...' : 'Appliquer la correction'}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AccountPaymentAssistant
