import { useContext, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Store } from '@/lib/Store'
import { functionReverse } from '@/lib/utils'
import { formatCanadianPhone } from '@/lib/phone.validation'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { countries, postalCodeRegex, telRegex } from '@/lib/constant'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import Loading from './Loading'
import { RESIDENCE_COUNTRY_STATUSES } from '@/types'

const normalizeEmergencyContacts = (
  contacts?: Array<{ name?: string; phone?: string }>
) => {
  const fallback = [
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]

  if (!contacts?.length) return fallback

  return [0, 1].map((index) => ({
    name: contacts[index]?.name ?? '',
    phone: contacts[index]?.phone ?? '',
  }))
}

const formSchema = z.object({
  residenceCountry: z.string(),
  postalCode: z
    .string()
    .regex(postalCodeRegex, { message: 'Champ Obligatoire' }),
  address: z.string().min(3, { message: 'Champ Obligatoire' }),
  tel: z.string().regex(telRegex, { message: 'Entrer numero correct' }),
  hasInsurance: z.boolean(),
  residenceCountryStatus: z.enum(RESIDENCE_COUNTRY_STATUSES,
    {
      required_error: 'Selectionnez un status',
    }
  ),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .length(2)
    .superRefine((contacts, ctx) => {
      contacts.forEach((contact, index) => {
        const hasName = Boolean(contact.name?.trim())
        const hasPhone = Boolean(contact.phone?.trim())
        if (hasName !== hasPhone) {
          const message = 'Veuillez renseigner le nom et le numéro pour ce contact.'
          if (!hasName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'name'],
              message,
            })
          }
          if (!hasPhone) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'phone'],
              message,
            })
          }
        }
      })
    }),
})

const UserOriginInfo = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const {
    origines,
    infos,
    register: userRegister,
    rememberMe,
    isAdmin,
    _id,
    cpdLng,
    primaryMember,
    familyMembers,
  } = userInfo!

  const { data: userDetail } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const { mutateAsync: editUserInfo, isPending } = useUpdateUserMutation()
  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)

  const infosSource = userDetail?.infos ?? infos
  const emergencyContactsFromDb = (infosSource?.emergencyContacts ?? []).filter(
    (contact) => contact?.name?.trim() && contact?.phone?.trim()
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      residenceCountry: infosSource ? infosSource.residenceCountry : '',
      postalCode: infosSource ? infosSource.postalCode : '',
      address: infosSource ? infosSource.address : '',
      tel: infosSource ? infosSource.tel : '',
      hasInsurance: infosSource ? infosSource.hasInsurance : false,
      residenceCountryStatus: infosSource
        ? infosSource.residenceCountryStatus
        : 'worker',
      emergencyContacts: normalizeEmergencyContacts(
        infosSource?.emergencyContacts
      ),
    },
  })

  const infosResetSignatureRef = useRef('')

  useEffect(() => {
    if (!userInfo) return

    const nextSignature = JSON.stringify(infosSource ?? {})
    if (infosResetSignatureRef.current !== nextSignature) {
      form.reset({
        residenceCountry: infosSource?.residenceCountry,
        postalCode: infosSource?.postalCode,
        address: infosSource?.address,
        tel: infosSource?.tel,
        hasInsurance: infosSource?.hasInsurance,
        residenceCountryStatus: infosSource?.residenceCountryStatus,
        emergencyContacts: normalizeEmergencyContacts(
          infosSource?.emergencyContacts
        ),
      })
      infosResetSignatureRef.current = nextSignature
    }
  }, [userInfo, form, infosSource])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const cleanedEmergencyContacts = values.emergencyContacts
        .map((contact) => ({
          name: contact.name?.trim() ?? '',
          phone: contact.phone?.trim() ?? '',
        }))
        .filter((contact) => contact.name && contact.phone)

      const updatedData = {
        _id,
        origines,
        infos: {
          ...values,
          emergencyContacts: cleanedEmergencyContacts,
        },
        rememberMe,
        cpdLng,
        isAdmin,
        register: {
          ...userRegister,
          password: userDetail?.register.password ?? '',
        },
        primaryMember,
        familyMembers,
      }

      await editUserInfo(updatedData)
      toast({
        title: 'Modification',
        description: 'Profil mis a jour',
      })
      setAddEditModalVisibility(false)
      ctxDispatch({ type: 'USER_LOGIN', payload: updatedData })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va.',
      })
    }
  }

  return (
    <div className='flex flex-col w-full gap-y-3'>
      <Card className='border-primary'>
        <CardHeader className='text-xl font-medium'>
          Renseignements personnels
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Nom</p>
              <p className='text-sm text-muted-foreground'>
                {origines?.lastName} {origines?.firstName}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Date de naissance
              </p>
              <p className='text-sm text-muted-foreground'>
                {functionReverse(
                  origines?.birthDate.toString().substring(0, 10)
                )}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Genre</p>
              <p className='text-sm text-muted-foreground'>
                {origines?.sex === 'M' ? 'Masculin' : 'Féminin'}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Pays d'origine</p>
              <p className='text-sm text-muted-foreground'>
                {origines?.nativeCountry}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Téléphone</p>
              <p className='text-sm text-muted-foreground'>
                {formatCanadianPhone(infos?.tel)}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Adresse</p>
              <p className='text-sm text-muted-foreground'>
                {infos?.residenceCountry}
                <br />
                {infos?.address}
                <br />
                {infos?.postalCode}
              </p>
            </div>
          </div>
          {emergencyContactsFromDb.length > 0 && (
            <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
              <div className='space-y-3'>
                <p className='text-sm font-medium leading-none'>
                  Contacts d'urgence
                </p>
                {emergencyContactsFromDb.map((contact, index) => (
                  <div key={index} className='rounded-md border p-3'>
                    <p className='text-sm font-medium leading-none'>
                      Contact d'urgence {index + 1}
                    </p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Nom: {contact.name}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Téléphone: {formatCanadianPhone(contact.phone)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button
            onClick={() => {
              setAddEditModalVisibility(true)
            }}
            variant='outline'
            className='border-primary text-primary hover:text-primary/80'
          >
            Modifier
          </Button>
        </CardFooter>
      </Card>

      {addEditModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setAddEditModalVisibility(false)
          }}
          open={addEditModalVisibility}
          title='Modifications'
          description="Modifier vos coordonnees et contacts"
        >
          <Form {...form}>
            <form
              id='origines'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8'
            >
              <FormField
                control={form.control}
                name='tel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Télephone</FormLabel>
                    <FormControl>
                      <Input placeholder='Votre numéro' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder='Votre adresse' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='residenceCountry'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Pays de résidence</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select residence country' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
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
                name='postalCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Code postal</FormLabel>
                    <FormControl>
                      <Input placeholder='Votre code postal' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-4 rounded-md border p-4'>
                <p className='text-sm font-medium leading-none'>
                  Contacts d'urgence
                </p>
                {[0, 1].map((index) => (
                  <div key={index} className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`emergencyContacts.${index}.name` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Nom complet
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='Nom complet' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`emergencyContacts.${index}.phone` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Telephone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Numero de telephone'
                              type='tel'
                              inputMode='tel'
                              autoComplete='tel'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              {isPending ? <Loading /> : <Button type='submit'>Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </div>
  )
}

export default UserOriginInfo
