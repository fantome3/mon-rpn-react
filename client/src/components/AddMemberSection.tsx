import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, UserPlus } from 'lucide-react'
import copy from 'copy-to-clipboard'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Form } from './ui/form'
import { toast } from './ui/use-toast'
import CustomModal from './CustomModal'
import Loading from './Loading'
import { FamilyMemberFormFields } from './family/FamilyMemberFormFields'

import { Store } from '@/lib/Store'
import { toastAxiosError } from '@/lib/utils'
import { getMemberFeeConfig } from '@/lib/familyMemberRules'
import {
  familyMemberFormSchema,
  familyMemberFormDefaultValues,
  type FamilyMemberFormValues,
} from '@/lib/familyMemberFormSchema'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import type { User } from '@/types'

type ModalStep = 'form' | 'success'

const AddMemberSection = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [referralModalOpen, setReferralModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('form')
  const [lastAddedName, setLastAddedName] = useState('')
  const [anyBillingNeeded, setAnyBillingNeeded] = useState(false)

  const { state, dispatch } = useContext(Store)
  const { userInfo } = state
  const { data: user } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const textRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: updateUser, isPending } = useUpdateUserMutation()

  const form = useForm<FamilyMemberFormValues>({
    mode: 'onChange',
    resolver: zodResolver(familyMemberFormSchema),
    defaultValues: familyMemberFormDefaultValues,
  })

  const relationship = form.watch('relationship')
  const occupation = form.watch('occupation')

  useEffect(() => {
    form.setValue('occupation', undefined)
    form.setValue('studentStatus', undefined)
    form.setValue('institution', undefined)
    form.setValue('studentNumber', undefined)
    form.setValue('livesInCanada', true)
    form.setValue('tel', '')
    form.clearErrors()
  }, [relationship, form])

  useEffect(() => {
    if (occupation !== 'student') {
      form.setValue('studentStatus', undefined)
      form.setValue('institution', undefined)
      form.setValue('studentNumber', undefined)
    }
  }, [occupation, form])

  const openModal = useCallback(() => {
    form.reset(familyMemberFormDefaultValues)
    setStep('form')
    setAnyBillingNeeded(false)
    setLastAddedName('')
    setModalOpen(true)
  }, [form])

  const closeModal = useCallback(
    (hasBilling: boolean) => {
      setModalOpen(false)
      if (hasBilling) {
        navigate('/billing-partiel')
      }
    },
    [navigate],
  )

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (open) return
      // Fermeture via X ou fond — meme comportement que "Terminer"
      closeModal(anyBillingNeeded)
      if (!anyBillingNeeded && step === 'success') {
        toast({
          variant: 'default',
          title: 'Membre ajoute avec succes',
          description: 'Votre membre de famille a ete ajoute.',
        })
      }
    },
    [anyBillingNeeded, step, closeModal],
  )

  const onSubmit = async (values: FamilyMemberFormValues) => {
    try {
      const response = await updateUser({
        ...user!,
        familyMembers: [...(user?.familyMembers ?? []), { ...values, status: 'active' }],
        _id: user?._id,
      })

      const nextUserInfo: User = {
        ...(userInfo as User),
        ...response.user,
      }
      dispatch({ type: 'USER_LOGIN', payload: nextUserInfo })
      localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
      await queryClient.invalidateQueries({ queryKey: ['user', userInfo?._id ?? ''] })

      // Utiliser les données fraîches de l'API (user), pas le cache localStorage (userInfo)
      // userInfo.subscription peut être incomplet si l'utilisateur s'est connecté avant
      // l'ajout de certains champs (ex: rpnStatus).
      const membershipAlreadyPaid = user?.subscription?.membershipPaidThisYear === true
      const primaryRpnEnrolled = user?.subscription?.rpnStatus === 'enrolled'
      const feeConfig = getMemberFeeConfig(values)
      const hasBillingNeeds =
        (membershipAlreadyPaid && feeConfig.isMembershipActive) ||
        primaryRpnEnrolled

      if (hasBillingNeeds) setAnyBillingNeeded(true)

      setLastAddedName(`${values.firstName} ${values.lastName}`)
      form.reset(familyMemberFormDefaultValues)
      setStep('success')
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const handleAddAnother = () => {
    setStep('form')
  }

  const handleTerminer = useCallback(() => {
    const billing = anyBillingNeeded
    setModalOpen(false)
    setStep('form')
    if (billing) {
      navigate('/billing-partiel')
    } else {
      toast({
        variant: 'default',
        title: 'Membre(s) ajoute(s) avec succes',
        description: 'Votre famille a ete mise a jour.',
      })
    }
  }, [anyBillingNeeded, navigate])

  const copyToClipboard = () => {
    if (textRef.current) {
      const isCopy = copy(textRef.current.value)
      if (isCopy) {
        toast({ variant: 'default', title: 'Copie', description: '' })
      }
    }
  }

  return (
    <>
      <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
        <div>
          <Button
            onClick={() => setReferralModalOpen(true)}
            className='px-8 py-4'
            disabled={true}
          >
            Parrainer
          </Button>
        </div>
        <div>
          <Button
            onClick={openModal}
            variant='outline'
            className='text-primary border-primary'
          >
            Ajouter une personne a charge
          </Button>
        </div>
      </div>

      {/* Modal parrainage */}
      {referralModalOpen && (
        <CustomModal
          setOpen={() => setReferralModalOpen(false)}
          open={referralModalOpen}
          title='Inviter un ami et gagner sans limite'
          description='Invitez vos amis a profiter de 30% de reduction sur leur premier cours, et gagnez 20% de notre commission sur chacun de leurs cours !'
        >
          <div className='flex flex-col items-center space-y-2'>
            <Input
              readOnly
              ref={textRef}
              type='text'
              value={`http://localhost:5173/register/${user?._id}/${user?.referralCode}`}
            />
            <Button onClick={copyToClipboard} type='submit'>
              Copier
            </Button>
          </div>
        </CustomModal>
      )}

      {/* Modal ajout membre */}
      {modalOpen && (
        <CustomModal
          open={modalOpen}
          setOpen={handleModalOpenChange}
          title={step === 'form' ? 'Ajouter une personne a charge' : 'Membre ajoute'}
          description={
            step === 'form'
              ? 'Renseignez les informations du membre de votre famille.'
              : undefined
          }
        >
          {step === 'form' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FamilyMemberFormFields control={form.control} />
                {isPending ? (
                  <Loading />
                ) : (
                  <Button type='submit' className='w-full'>
                    Valider
                  </Button>
                )}
              </form>
            </Form>
          ) : (
            <div className='space-y-6'>
              {/* Banniere succes */}
              <div className='flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
                <div>
                  <p className='font-semibold text-green-800'>
                    {lastAddedName} a ete ajoute(e)
                  </p>
                  {anyBillingNeeded && (
                    <p className='mt-1 text-sm text-green-700'>
                      Ce membre sera inclus dans la facturation complementaire.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  variant='outline'
                  className='w-full gap-2'
                  onClick={handleAddAnother}
                >
                  <UserPlus className='h-4 w-4' />
                  Ajouter un autre membre
                </Button>
                <Button className='w-full' onClick={handleTerminer}>
                  {anyBillingNeeded ? 'Proceder au paiement' : 'Terminer'}
                </Button>
              </div>
            </div>
          )}
        </CustomModal>
      )}
    </>
  )
}

export default AddMemberSection
