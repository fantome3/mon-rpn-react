import { useContext, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import CustomModal from './CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { relations, status } from '@/lib/constant'
import { Store } from '@/lib/Store'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import Loading from './Loading'
import { refresh } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import copy from 'copy-to-clipboard'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.string(),
  status: z.string(),
})

const AddMemberSection = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const [referralModalVisibility, setReferralModalVisibility] = useState(false)

  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: user } = useGetUserDetailsQuery(userInfo?._id!)
  const navigate = useNavigate()
  const pathname = location.pathname

  const { mutateAsync: updateUser, isPending } = useUpdateUserMutation()
  const textRef = useRef<any>()

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: '',
      status: '',
    },
  })

  useEffect(() => {
    form.reset({
      firstName: '',
      lastName: '',
      relationship: '',
      status: '',
    })
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateUser({
        ...user!,
        familyMembers: [...user?.familyMembers!, values],
        _id: user?._id,
      })
      if (pathname === '/dependents') {
        refresh()
      } else {
        navigate('/dependents')
      }
      toast({
        variant: 'default',
        title: 'Membre ajouté avec succès',
        description: 'Votre membre de famille a été ajouté avec succès.',
      })
      form.reset()
      setModalVisibility(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
    }
  }

  const copyToClipboard = () => {
    let copyText = textRef.current.value
    let isCopy = copy(copyText)
    if (isCopy) {
      toast({
        variant: 'default',
        title: 'Copié',
        description: '',
      })
    }
  }

  return (
    <>
      <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
        <div>
          <Button
            onClick={() => setReferralModalVisibility(true)}
            className='px-8 py-4'
          >
            Parrainer
          </Button>
        </div>
        <div>
          <Button
            onClick={() => setModalVisibility(true)}
            variant='outline'
            className=' text-primary border-primary'
          >
            Ajouter une personne
          </Button>
        </div>
      </div>
      {referralModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setReferralModalVisibility(false)
          }}
          open={referralModalVisibility}
          title='Inviter un ami et gagner sans limite'
          description='Invitez vos amis à profiter de 30% de réduction sur leur premier cours, et gagnez 20% de notre commission sur chacun de leurs cours !'
        >
          <div className='flex flex-col  items-center space-y-2'>
            <Input
              readOnly
              ref={textRef}
              type='text'
              value={`http://localhost:5173/register/${user?._id}/${user?.referralCode}
              `}
            />
            <Button onClick={copyToClipboard} type='submit'>
              Copier
            </Button>
          </div>
        </CustomModal>
      ) : (
        ''
      )}
      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Ajouter Personne'
          description='Ajouter un membre de votre famille'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Prénoms</FormLabel>
                    <FormControl>
                      <Input placeholder='Son prénom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Son nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='relationship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Relation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Votre relation' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation.name} value={relation.name}>
                            {relation.name}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {status.map((stat) => (
                          <SelectItem key={stat.name} value={stat.name}>
                            {stat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
    </>
  )
}

export default AddMemberSection
