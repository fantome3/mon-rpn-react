import { Button } from '@/components/ui/button'
import { Account } from '@/types'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { User } from '@/types'

const getUserIdFromAccount = (account?: Account) =>
  String(account?.userId?._id ?? account?.userId ?? '')

type Props = {
  user: User
  previousAccount?: Account
  nextAccount?: Account
}

const AccountProfileHeader = ({ user, previousAccount, nextAccount }: Props) => {
  const navigate = useNavigate()

  return (
    <div className='rounded-xl border bg-gradient-to-r from-slate-50 via-white to-emerald-50 p-5 md:p-7'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <p className='text-xs uppercase tracking-widest text-muted-foreground'>
            Profil membre
          </p>
          <h1 className='text-2xl md:text-3xl font-semibold'>
            {user.origines?.firstName} {user.origines?.lastName}
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            ID utilisateur: {user._id}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={!previousAccount}
            onClick={() =>
              navigate(`/admin/accounts/${getUserIdFromAccount(previousAccount)}/profile`)
            }
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Précédent
          </Button>
          <Button
            variant='outline'
            disabled={!nextAccount}
            onClick={() =>
              navigate(`/admin/accounts/${getUserIdFromAccount(nextAccount)}/profile`)
            }
          >
            Suivant
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
          <Button asChild>
            <Link to='/admin/accounts'>Retour comptes</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountProfileHeader
