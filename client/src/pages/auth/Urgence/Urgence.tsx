import CheckoutSteps from '@/components/CheckoutSteps'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import NextStepsDialog from '@/components/NextStepsDialog'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { useUrgenceLogic } from './Urgence.logique'

const Urgence = () => {
  const { t } = useTranslation(['common'])
  const {
    form,
    isSubmitting,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    handlePreviousClick,
    handleGoToDependents,
    handleGoToPayment,
  } = useUrgenceLogic()

  return (
    <>
      <SearchEngineOptimization title="Contacts d'urgence" />
      <Header />

      <div className='auth form'>
        <Card className='auth-card'>
          <CardHeader className='text-center mb-5'>
            <CheckoutSteps step4 />
            <CardTitle className='font-bold text-2xl text-primary'>
              {t('enregistrement.emergencyContactsTitle')}
            </CardTitle>
            <CardDescription className='text-sm'>
              {t('enregistrement.emergencyContactsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className='grid gap-4 rounded-md border p-4 md:grid-cols-1'
                  >
                    <p className='font-semibold text-primary'>
                      {t('enregistrement.emergencyContactLabel', {
                        index: index + 1,
                      })}
                    </p>

                    <FormField
                      control={form.control}
                      name={`emergencyContacts.${index}.name` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            {t('enregistrement.emergencyContactNameLabel', {
                              index: index + 1,
                            })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'enregistrement.emergencyContactNamePlaceholder',
                              )}
                              autoComplete='name'
                              {...field}
                            />
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
                            {t('enregistrement.emergencyContactPhoneLabel', {
                              index: index + 1,
                            })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'enregistrement.emergencyContactPhonePlaceholder',
                              )}
                              autoComplete='tel'
                              inputMode='tel'
                              type='tel'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {isSubmitting ? (
                  <Loading />
                ) : (
                  <div>
                    <Button className='mr-4' type='submit'>
                      {t('enregistrement.enregistrer')}
                    </Button>
                    <Button
                      onClick={handlePreviousClick}
                      className='bg-white text-primary border-2 hover:bg-slate-100 hover:text-primary/80 border-primary'
                      type='button'
                    >
                      {t('enregistrement.prev')}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Footer />

      <NextStepsDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title='Inscription réussie'
        description='Un e-mail contenant votre mot de passe vous a été envoyé. Vérifiez votre boîte de réception, puis finalisez votre dossier.'
        steps={[
          'Ajoutez vos personnes à charge s\'il y a lieu.',
          'Passez ensuite au paiement de votre cotisation.',
        ]}
        actions={[
          {
            label: 'Ajouter votre famille',
            onClick: handleGoToDependents,
          },
          {
            label: 'Je suis seul',
            onClick: handleGoToPayment,
            variant: 'outline',
          },
        ]}
      />
    </>
  )
}

export default Urgence
