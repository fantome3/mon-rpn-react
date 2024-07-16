import { useContext, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Store } from '@/lib/Store'
import CustomModal from './CustomModal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
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
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import Loading from './Loading'
import { toast } from './ui/use-toast'
import { Link } from 'react-router-dom'
import { User } from '@/types/User'

const UserConnexion = () => {
  const { t } = useTranslation(['common'])

  const formSchema = z.object({
    email: z.string().email({ message: `${t('connexion.emailError')}` }),
  })

  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const {
    register,
    origines,
    infos,
    rememberMe,
    isAdmin,
    _id,
    cpdLng,
    primaryMember,
    familyMembers,
    subscription,
    referralCode,
    referredBy,
  } = userInfo!
  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)

  const { data: user } = useGetUserDetailsQuery(_id!)
  const { mutateAsync: editMail, isPending: emaiPending } =
    useUpdateUserMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: register ? register.email : '',
    },
  })

  useEffect(() => {
    if (userInfo) {
      form.reset({
        email: register.email,
      })
    }
  }, [userInfo])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { email } = values
      const updatedData: User = {
        _id: _id!,
        origines: origines,
        infos: infos,
        rememberMe: rememberMe,
        cpdLng: cpdLng,
        isAdmin: isAdmin,
        register: {
          ...register,
          email: email,
          password: user?.register.password!,
        },
        primaryMember: primaryMember,
        familyMembers: familyMembers,
        subscription: subscription,
        referralCode: referralCode,
        referredBy: referredBy,
      }
      if (email !== register.email) {
        const updated = await editMail(updatedData)
        toast({
          title: 'Modification',
          description: 'Email modifié',
        })
        setAddEditModalVisibility(false)
        ctxDispatch({ type: 'USER_LOGIN', payload: updated.user })
        localStorage.setItem('userInfo', JSON.stringify(updated.user))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Card className=' border-primary'>
        <CardHeader className='text-xl font-medium'>Inscription</CardHeader>
        <CardContent>
          <div className='mb-4 flex flex-col lg:flex-row justify-between pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Courriel</p>
              <p className='text-sm text-muted-foreground'>{register.email}</p>
            </div>
            <div className='mt-4 flex justify-end'>
              <Button
                variant='outline'
                className='border-primary text-primary'
                onClick={() => {
                  setAddEditModalVisibility(true)
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <Link
                className='text-sm text-primary hover:text-primary/80 font-medium leading-none'
                to='/forgot-password'
              >
                Changer mot de passe
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      {addEditModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setAddEditModalVisibility(false)
          }}
          open={addEditModalVisibility}
          title='Modifications'
          description='Modifier vos données de connexion'
        >
          <Form {...form}>
            <form
              id='origines'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8'
            >
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='Votre email' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {emaiPending ? (
                <Loading />
              ) : (
                <Button type='submit'>Valider</Button>
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

export default UserConnexion
