import cron from 'node-cron'
import { processAnnualMembershipPayment } from '../services/membershipService'

//Chaque dimanche de janvier à 10h du matin
cron.schedule('0 10 * 1 0', async () => {
  console.log('Lancement du rappel de cotisation annuelle...')
  await processAnnualMembershipPayment()
})

//Test sur la marche ou non du cron
//cron.schedule('*/30 * * * * *', async () => {
//  try {
//    console.log('🚀 Cron lancé !'), await processAnnualMembershipPayment()
//  } catch (error) {
//    console.error('❌ Erreur dans le cron :', error)
//  }
//})
