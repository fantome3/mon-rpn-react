import CreditCardPayment from '@/components/CreditCardPayment'
import InteracPayment from '@/components/InteracPayment'
import SelectFees from './SelectFees'
import { useContext, useState } from 'react'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Store } from '@/lib/Store'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import UpdateInteracPayment from '@/components/UpdateInteracPayment'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

const FirmNotice = () => (
  <Alert variant="destructive" role="alert" className="mb-6 max-w-3xl mx-auto">
    <ShieldAlert className="h-5 w-5" />
    <AlertTitle>Action requise</AlertTitle>
    <AlertDescription>
      Le règlement du montant minimum requis pour votre profil est obligatoire pour conserver votre statut de membre.
      En cas de <strong>non-paiement</strong> ou de <strong>déclaration inexacte</strong> du montant versé, des <strong>pénalités</strong> pourront être appliquées.
    </AlertDescription>
  </Alert>
)

const PaymentMethod = () => {
  const [totalPayment, setTotalPayment] = useState(0)
  const { state } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const { data: accounts } = useGetAccountsByUserIdQuery(userInfo?._id)
  const account = accounts?.[0]

  const handleSuccess = () =>  {
    console.log(`Payment successful: ${totalPayment}`);
    navigate('/summary')
  }

  return (
    <>
      <SearchEngineOptimization
        title="Mode de paiement ACQ"
        description="Page de sélection du mode de paiement de l'association des camerounais du Québec ACQ"
      />
      
      <div className="form flex-col sm:m-0 m-20" id="payment-block" style={{ minHeight: '60vh', justifyContent: 'unset' }}>
        <div className="text-center mt-8">
          <h1 className="text-3xl font-bold">Mode de paiement</h1>
          <p>Choisissez par quel moyen vous souhaitez payer votre cotisation</p>
          <p className="text-sm text-muted-foreground">
            Les frais de service seront calculés et affichés avant la confirmation du paiement.
          </p>
        </div>

        <FirmNotice />

        <div className="flex md:flex-row flex-col gap-10 text-center">
          <CreditCardPayment />
          {account?.isAwaitingFirstPayment ? (
             <UpdateInteracPayment minAmount={totalPayment} onSuccess={handleSuccess} />
          ) : (
             <InteracPayment key={totalPayment} total={totalPayment} />
          )}
        </div>
      </div>

      <SelectFees updateTotal={setTotalPayment} />
    </>
  )
}

export default PaymentMethod
