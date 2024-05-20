import { useContext, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Store } from '@/lib/Store'
import { functionReverse } from '@/lib/utils'
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
import { Checkbox } from './ui/checkbox'

const formSchema = z.object({
  residenceCountry: z.string(),
  postalCode: z
    .string()
    .regex(postalCodeRegex, { message: 'Champ Obligatoire' }),
  address: z.string().min(3, { message: 'Champ Obligatoire' }),
  tel: z.string().regex(telRegex, { message: `Entrer numéro correct` }),
  hasInsurance: z.boolean(),
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
  const { data: userDetail } = useGetUserDetailsQuery(userInfo?._id!)
  const { mutateAsync: editUserInfo, isPending } = useUpdateUserMutation()
  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      residenceCountry: infos ? infos.residenceCountry : '',
      postalCode: infos ? infos.postalCode : '',
      address: infos ? infos.address : '',
      tel: infos ? infos.tel : '',
      hasInsurance: infos ? infos.hasInsurance : false,
    },
  })

  useEffect(() => {
    if (userInfo) {
      form.reset({
        residenceCountry: infos?.residenceCountry,
        postalCode: infos?.postalCode,
        address: infos?.address,
        tel: infos?.tel,
        hasInsurance: infos?.hasInsurance,
      })
    }
  }, [userInfo])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedData = {
        _id: _id,
        origines: origines,
        infos: { ...values },
        rememberMe: rememberMe,
        cpdLng: cpdLng,
        isAdmin: isAdmin,
        register: {
          ...userRegister,
          password: userDetail?.register.password!,
          confirmPassword: userDetail?.register.confirmPassword!,
        },
        primaryMember: primaryMember,
        familyMembers: familyMembers,
      }
      await editUserInfo(updatedData)
      toast({
        title: 'Modification',
        description: 'Adresse modifiée',
      })
      setAddEditModalVisibility(false)
      ctxDispatch({ type: 'USER_LOGIN', payload: updatedData })
    } catch (error) {
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
              <p className='text-sm text-muted-foreground'>{infos?.tel}</p>
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
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Êtes-vous assurés?
              </p>
              <p className='text-sm text-muted-foreground'>
                {infos?.hasInsurance ? 'Oui' : 'Non'}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Langue de correspondance
              </p>
              <p className='text-sm text-muted-foreground'>
                {cpdLng === 'fr' ? 'Français' : 'English'}
              </p>
            </div>
          </div>
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
          description='Modifier votre adresse'
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
                    <FormLabel className='text-sm'>Tél</FormLabel>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              <FormField
                control={form.control}
                name='hasInsurance'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-sm'>
                      Êtes-vous assurés?
                    </FormLabel>
                  </FormItem>
                )}
              />
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
