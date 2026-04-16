import cron from 'node-cron'
import {
  processAnnualMembershipPayment,
  processInactiveUsers,
} from '../services/membershipService'
import { checkMinimumBalanceAndSendReminder } from '../services/checkMinimumBalanceAndSendReminder'

//Chaque dimanche de janvier à 10h du matin
cron.schedule('0 10 * 1 0', async () => {
  console.log('Lancement du rappel de cotisation annuelle...')
  await processAnnualMembershipPayment()
})

/* désaactivé courriel rpn  Chaque dimanche à 9h du matin
// Vérification des soldes RPN insuffisants tous les dimanches à 9h
cron.schedule('0 9 * * 0', async () => {
  console.log('📢 Vérification des soldes RPN insuffisants...')
  await checkMinimumBalanceAndSendReminder()
})*/
// Tous les jours à 5h du matin
cron.schedule('0 5 * * *', async () => {
  console.log('🔄 Cron désactivation des comptes inactifs...')
  await processInactiveUsers()
})

//Test sur la marche ou non du cron
//cron.schedule('*/30 * * * * *', async () => {
// try {
//    console.log('🚀 Cron lancé !'), await processInactiveUsers()
// } catch (error) {
//    console.error('❌ Erreur dans le cron :', error)
//  }
//})
