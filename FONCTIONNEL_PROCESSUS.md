# FONCTIONNEL_PROCESSUS — `mon-rpn-react`

> Documentation processus par processus de chaque traitement **non-UI** du serveur
> (`server/src`). Complète [FONCTIONNEL_GLOBAL.md](FONCTIONNEL_GLOBAL.md) (§6) et fait pendant à
> [FONCTIONNEL_PAGES.md](FONCTIONNEL_PAGES.md) (qui documente le front). Les règles non triviales
> sont référencées par `fichier:ligne`. Lorsqu'un point ne peut être établi avec certitude à partir
> du code seul, il est marqué **« à confirmer »** et repris en section « Angles morts ».
>
> **Rappels transverses**
> - **Tout est déclenché côté serveur.** Aucun webhook entrant : les paiements Interac sont confirmés
>   manuellement par un admin ; toute communication externe (notrerpn.org, Cloudinary, SMTP) est
>   **sortante**.
> - **Aucune file de traitement n'est persistée.** La seule file (prélèvement décès) vit en mémoire
>   dans une variable de module ; elle est **perdue au redémarrage** du process.
> - **Crons chargés à l'import.** `server/src/index.ts:13` fait `import './cron/membershipReminder'` :
>   les `cron.schedule(...)` s'enregistrent au démarrage du serveur. Aucun `{timezone}` n'est passé →
>   les tâches tournent **à l'heure locale du serveur** (voir comportement reformulé).
> - **Emails inline.** Il n'existe **pas** de worker d'envoi de courriels : `mailer/core.ts::sendEmail`
>   envoie de façon synchrone, sans file ni retry (documenté en fin de document).

---

## [Cron] Tâches planifiées

> Fichier unique : [server/src/cron/membershipReminder.ts](server/src/cron/membershipReminder.ts),
> `node-cron`. Deux tâches sont **actives** (cotisation annuelle, désactivation des comptes) ; une
> troisième (rappel RPN bas) est **entièrement commentée**. Un bloc de test à 30 s est également
> commenté (`:27-33`).
>
> **Comportement attendu (reformulé) — commun aux 3 crons** (décision propriétaire) : les tâches
> planifiées DOIVENT s'exécuter **à l'heure du Québec** (`America/Toronto`) via un `{timezone}`
> **explicite** passé à `cron.schedule`, sans dépendre du fuseau local du serveur *(réf. aucun
> `{timezone}` aujourd'hui, `membershipReminder.ts:9,16,21`)*. Elles DOIVENT tourner **la nuit,
> autour de 2h du matin** (heure du Québec), période calme à faible charge, plutôt qu'aux horaires
> actuels (10h, 5h, 9h). Chaque cron rappelle cette exigence ci-dessous. Elles DEVRAIENT aussi être
> encapsulées dans un `try/catch` par exécution afin qu'un échec unitaire n'interrompe pas tout le
> lot (voir « Idempotence » de chaque cron).

### [Cron] Cotisation annuelle — `processAnnualMembershipPayment()`
- **Objectif fonctionnel** : prélever automatiquement la cotisation annuelle d'adhésion de chaque
  unité familiale sur le solde `membership_balance`, activer l'abonnement pour l'année, et relancer
  les comptes dont le solde est insuffisant.
- **Déclencheur** : cron `0 10 * 1 0` = **tous les dimanches de janvier à 10h** (heure serveur)
  *(`membershipReminder.ts:9-12`)*. Ré-exécuté chaque dimanche de janvier tant que l'année n'est pas
  payée (le garde d'idempotence saute les comptes déjà réglés). Également invocable manuellement
  *(utilisé dans `transactionRouter.ts:48`)*.
- **Données lues/modifiées** *(`membershipService.ts:77-150`)* :
  - **Lit** : tous les users non supprimés `UserModel.find({ deletedAt: { $exists: false } })`
    (`:78`) ; `SettingsModel` (`membershipUnitAmount` défaut 50, `studentMembershipUnitAmount` défaut
    25, `:79-81`) ; par user `AccountModel.findOne({ userId })` → `membership_balance`, `rpn_balance`
    (`:98-102`). Le montant dû est calculé par `calculateMembershipAmount()` (`:30-75`) à partir de
    `origines.birthDate`, `register.occupation`/`studentStatus`, et de chaque `familyMembers` (âge,
    `status`, `relationship`, `livesInCanada`/`residenceCountryStatus`, `occupation`).
  - **Modifie (solde suffisant, `:104-141`)** : décrémente `account.membership_balance`, `account.save()` ;
    crée une `Transaction` (`type:'debit'`, `fundType:'membership'`, `status:'completed'`, raison
    « Cotisation annuelle ») ; met `subscription.status='active'`, `lastMembershipPaymentYear=année`,
    `membershipPaidThisYear=true`, `startDate`, `endDate=+1 an`, `missedRemindersCount=0`,
    `scheduledDeactivationDate=undefined` ; stampe chaque personne active
    `membershipCoveredThisYear=année` ; `markModified('familyMembers')` + `user.save()`.
  - **Modifie (solde insuffisant, `:142-148`)** : délègue à `handleFailedPrelevement` (voir sous-processus
    ci-dessous).
- **Dépendances** : `SettingsModel`, `AccountModel`, `UserModel`, `TransactionModel` ;
  `calculateMembershipAmount` ; `subscriptionService.handleFailedPrelevement` ; mailer
  `sendMembershipSuccessEmail` (`:118-122`). N'appelle **pas** directement notrerpn.org.
- **Idempotence et gestion des échecs** :
  - **Idempotence annuelle** : `continue` si `lastMembershipPaymentYear === année ET
    membershipPaidThisYear` *(`:84-90`)* — un compte déjà payé cette année civile est sauté. ⚠ Le
    garde exige **les deux** drapeaux ; si un seul est positionné, le compte est retraité.
  - **Aucun `try/catch`** autour de la boucle : un throw dans une itération (ex. échec mailer)
    **interrompt tout le run** et les users suivants ne sont pas traités. Seul garde d'itération :
    `if (!account) continue` (`:99`).
- **Impact si absent ou en échec silencieux** : les adhésions ne sont pas prélevées ni activées pour
  l'année → membres non facturés, `subscription.status` non passé à `active`, personnes non stampées
  `membershipCoveredThisYear` ; les soldes insuffisants ne déclenchent ni avertissement ni date de
  désactivation. Un échec en milieu de run traite une partie seulement des membres, de façon non
  déterministe (dépend de l'ordre).
- **Comportement attendu (reformulé)** : exécuter la nuit (~2h) à l'heure du Québec avec `{timezone}`
  explicite *(réf. `:9`)* ; isoler chaque compte dans un `try/catch` pour qu'un échec unitaire
  (mailer, save) n'avorte pas tout le lot *(réf. absence de `try/catch`, `:77-150`)* ; unifier le
  garde d'idempotence sur un critère unique et cohérent *(réf. double drapeau `:84-90`)*. La logique
  d'activation d'adhésion DOIT être unifiée avec `processMembershipForUser` et
  `transactionService.activateMembership` *(cf. GLOBAL §7-25 ; near-duplicate `membershipService.ts:152-235`)*.

#### Sous-processus : `handleFailedPrelevement()` (échec de prélèvement adhésion)
- **Objectif / Déclencheur** : appelé par la cotisation annuelle quand `membership_balance < dû`
  *(`subscriptionService.ts:9-39`)*.
- **Données modifiées** : incrémente `subscription.missedRemindersCount` (`:18-19`). **Au 1er échec
  uniquement** (`missedRemindersCount == 1`, `:21-34`) : crée une transaction `debit/failed`, pose
  `scheduledDeactivationDate = now + 25 jours` (`:31`), envoie `sendDeactivationWarningEmail(email,
  "membership", date)`. Toujours : `user.save()` puis `sendPrelevementFailedMembershipEmail`.
- **Idempotence et échecs** : garde `== 1` → date de désactivation et avertissement posés **une seule
  fois** par cycle (remis à zéro au paiement réussi ou à la réactivation). Aucun `try/catch`.
- **Comportement attendu (reformulé)** : le délai de 25 jours (adhésion) partage le **même** champ
  `scheduledDeactivationDate` que le délai de 7 jours du RPN ; ces deux cycles indépendants DOIVENT
  utiliser des champs/dates **distincts** afin qu'une insuffisance RPN ne désactive pas l'adhésion et
  inversement *(cf. GLOBAL §7-15/§7-16 ; réf. `subscriptionService.ts:31` vs `rpnLifecycleService.ts:283`)*.

### [Cron] Désactivation des comptes inactifs — `processInactiveUsers()`
- **Objectif fonctionnel** : désactiver les comptes dont la date de désactivation planifiée (après un
  prélèvement échoué non régularisé) est dépassée.
- **Déclencheur** : cron `0 5 * * *` = **tous les jours à 5h** (heure serveur)
  *(`membershipReminder.ts:21-24`)*. Aussi invocable manuellement.
- **Données lues/modifiées** *(`membershipService.ts:237-257`)* :
  - **Lit** : `UserModel.find({ 'subscription.status': { $in: ['active','registered'] },
    'subscription.scheduledDeactivationDate': { $lte: today }, deletedAt: { $exists: false } })`
    (`:239-245`).
  - **Modifie** : par user, `subscription.status='inactive'`, `scheduledDeactivationDate=undefined`,
    `user.save()` (`:248-250`) ; envoie `sendAccountDeactivatedEmail` (`:252`).
- **Dépendances** : `UserModel` ; mailer `sendAccountDeactivatedEmail`. Un compte passé `inactive`
  redirige le membre vers `/account-deactivated` côté front (cf. PAGES, garde `ProtectedRoute`).
- **Idempotence et gestion des échecs** : idempotence **implicite** — en passant `inactive` et en
  effaçant la date, le user sort du jeu de résultats de la requête suivante. Aucun `try/catch` (`:237-257`) ;
  logue chaque désactivation et un total (`:253,256`).
- **Impact si absent ou en échec silencieux** : les comptes en défaut de paiement ne sont jamais
  désactivés → ils conservent l'accès membre et restent comptés/facturables alors qu'ils devraient
  être suspendus ; incohérence entre l'avertissement envoyé (J+25 / J+7) et l'absence d'effet.
- **Comportement attendu (reformulé)** : exécuter la nuit (~2h) heure du Québec avec `{timezone}`
  explicite *(réf. `:21`)*. La désactivation NE DOIT PAS suspendre l'adhésion en raison d'une seule
  insuffisance RPN (dates de désactivation distinctes, voir sous-processus ci-dessus) *(cf. GLOBAL §7-16)*.

### [Cron — DÉSACTIVÉ] Rappel de solde RPN bas — `checkMinimumBalanceAndSendReminder()`
- **Objectif fonctionnel** : prévenir par courriel les membres dont le solde RPN passe sous le seuil
  minimum (`personnes × minimumBalanceRPN`), afin qu'ils le réalimentent avant un prélèvement décès.
- **Déclencheur** : cron `0 9 * * 0` = dimanches à 9h — **actuellement DÉSACTIVÉ** : le bloc est
  **entièrement commenté** *(`membershipReminder.ts:14-19`, commentaire « désactivé courriel rpn »)*
  et ne s'enregistre jamais. **À réactiver tel quel** dans la nouvelle app (décision propriétaire,
  GLOBAL §0).
- **Données lues/modifiées** *(`checkMinimumBalanceAndSendReminder.ts:10-33`)* : **lit** `SettingsModel`
  (`minimumBalanceRPN` défaut 5, `:12`), tous les users non supprimés (`:14`), `calculateTotalPersons(user)`
  (`:16`), `AccountModel` → `rpn_balance` (`:19-23`). **N'écrit rien** : envoie seulement
  `sendLowBalanceNotification(email, rpnBalance, minRequired)` si `rpn_balance ≤ personnes ×
  minimumBalanceRPN` (`:25-30`). Skips : `totalPersons === 0` (`:17`), `!account` (`:21`).
- **Dépendances** : `SettingsModel`, `UserModel`, `AccountModel`, `calculateTotalPersons` ; mailer
  `sendLowBalanceNotification`.
- **Idempotence et gestion des échecs** : **aucun compteur, aucun garde** côté cron → à chaque
  exécution, un courriel est envoyé à **tous** les comptes sous le seuil (raison de la désactivation :
  éviter le spam). ⚠ À distinguer du **sibling API** `sendBalanceReminderIfNeeded(userId)`
  *(`:35-78`)* qui, lui, passe par `onRpnBalanceInsufficient` (compteur + désinscription) et dont le
  `sendLowBalanceNotification` direct est également commenté (`:60-65`).
- **Impact si absent ou en échec silencieux** : les membres ne sont pas prévenus d'un solde RPN bas →
  découverte de l'insuffisance seulement au moment d'un décès, avec prélèvement échoué, compteur de
  rappels manqués et risque de désinscription notrerpn.org sans avertissement préalable.
- **Comportement attendu (reformulé)** : réactiver la tâche telle quelle *(cf. GLOBAL §0)*, la faire
  tourner la nuit (~2h) heure du Québec avec `{timezone}` explicite, et introduire une garde
  anti-spam (n'alerter qu'une fois par cycle, ou s'appuyer sur `missedRpnRemindersCount`) *(réf.
  absence de compteur, `checkMinimumBalanceAndSendReminder.ts:10-33`)*.

---

## [Worker/File] Traitement asynchrone à la demande

### [File en mémoire] Prélèvement du fonds RPN sur annonce de décès — `processDeathAnnouncement()`
- **Objectif fonctionnel** : à chaque décès communautaire, prélever la part de solidarité
  (`personnes couvertes × montant par personne`) sur le solde RPN de **tous les membres principaux**,
  enregistrer les débits, gérer les soldes insuffisants, et notifier tous les membres par courriel.
- **Déclencheur** : **non un cron**. Déclenché par les routes admin `POST /api/announcements/new`
  et `POST /api/announcements/batch` *(`deathAnnoucementRouter.ts:16-52` et `:54-88`, gardes
  `isAuth`+`isAdmin`)*. La route répond immédiatement **`202 Accepted`** (`:30`) puis le traitement
  se déroule de façon asynchrone. Chaque annonce est **enfilée** via
  `queueDeathAnnouncementProcessing(id)` (`deathAnnouncementService.ts:382-390`).
- **Données lues/modifiées** *(`deathAnnouncementService.ts:417-510`)* :
  - **Lit** : l'annonce `DeathAnnouncementModel` ; `SettingsModel` → `amountPerDependent`
    (montant par personne, doit être fini et `> 0`, sinon annonce `failed`, `:75-85,433-441`) ; les
    membres principaux `UserModel.find({ primaryMember: true, deletedAt: { $exists: false } })`
    (`:102-108`) ; `AccountModel` → `rpn_balance` (`:449-451`).
  - **Modifie (candidats solvables, `applyDebitCandidates:259-286`)** : débit en masse
    `AccountModel.bulkWrite` avec `$inc: { rpn_balance: -totalDû }` (`{ ordered:false }`) ;
    `TransactionModel.insertMany` d'une transaction par candidat (`type:'debit'`, `fundType:'rpn'`,
    raison « Prélèvement décès pour N personnes ») — ⚠ **sans `status` explicite** (défaut du schéma),
    contrairement aux transactions d'échec qui sont `status:'failed'`.
  - **Modifie (soldes insuffisants, `:288-334`)** : `onRpnBalanceInsufficient` par candidat
    (concurrence **5**, `:49,316-322`) — voir listener RPN.
  - **Modifie (l'annonce)** : `processingStatus` (`pending`→`processing`→`completed`/`failed`),
    `processingStartedAt`/`FinishedAt`, `processingSummary` (`totalUsers`, `debitedCount`,
    `expectedAmount`, `collectedAmount`, `insufficientFundsCount`, `missingAccountCount`,
    `systemErrorCount`), `processingErrors[]` (≤ **20** échantillons, `:48`), `processingFailureReason`.
- **Dépendances** : `DeathAnnouncementModel`, `SettingsModel`, `UserModel`, `AccountModel`,
  `TransactionModel` ; `calculateTotalPersons` ; `onRpnBalanceInsufficient` (listener RPN) ; mailer
  `notifyUsersForDeathAnnouncement` (envoi à **tous** les membres, concurrence **10**,
  `notification.ts:85-99`).
- **Idempotence et gestion des échecs** :
  - **File sérialisée en mémoire** `_processingChain` *(`:46,382-390`)* : chaîne de promesses FIFO,
    **une annonce à la fois**, `.catch` par tâche (`:386-388`) → l'échec d'une annonce ne casse pas
    la chaîne.
  - **Idempotence** : `processDeathAnnouncement` saute si `processingStatus === 'completed'` (`:421`)
    et repositionne `processing` en début de traitement — protège contre un **double débit** sur une
    annonce déjà terminée. Les `bulkWrite`/`insertMany` sont `{ ordered:false }`.
  - **Non persistée / non reprenable** : la file est une variable de module → **perdue au
    redémarrage**, et rien ne re-scanne les annonces `pending`/`processing` au boot. Un crash en
    cours laisse l'annonce en `processing` (non re-gardée) avec des **débits partiels non annulés**
    (pas de rollback). Échec attrapé → annonce `failed` + `processingFailureReason` (`:501-509`).
- **Impact si absent ou en échec silencieux** : le fonds de solidarité n'est pas alimenté par les
  décès → aucun débit RPN, aucune transaction, aucune notification aux membres ; en cas de crash
  mid-run, une partie des membres est débitée et l'autre non, sans reprise automatique, laissant
  l'annonce bloquée en `processing` et le récapitulatif incomplet.
- **Comportement attendu (reformulé)** : la file DOIT être **persistée** et reprenable après
  redémarrage, avec idempotence et journal d'exécution, et rollback ou reprise des débits partiels en
  cas d'interruption *(cf. GLOBAL §7-24 ; réf. `_processingChain` en mémoire, `:46`)*. Tous les
  mouvements d'argent (y compris ce prélèvement) DOIVENT passer par le **chemin transactionnel
  unique** appliquant les mêmes invariants (`balanceApplied`, machine à états) et poser un `status`
  explicite sur les transactions de débit *(cf. GLOBAL §7-21 ; réf. `$inc` direct + transactions sans
  `status`, `:259-286`)*.

---

## [Écouteur d'événement] Cycle de vie RPN & synchronisation notrerpn.org

> Fichier : [server/src/services/rpnLifecycleService.ts](server/src/services/rpnLifecycleService.ts).
> ⚠ Ce **ne sont pas** de vrais événements : ce sont des fonctions `async` exportées, appelées
> directement par les services/routers. Le style « écouteur » vient du nommage (`onXxx`) et de la
> convention d'appel **fire-and-forget** (`.catch(console.error)`) sur les côtés bord. Autorité
> unique du cycle RPN.

### [Listener] Confirmation de paiement RPN — `onRpnPaymentConfirmed()`
- **Objectif fonctionnel** : après tout crédit RPN confirmé, inscrire/réactiver le membre principal
  au fonds décès et déclencher l'inscription des personnes à charge en attente, en phase avec
  notrerpn.org.
- **Déclencheur** : appelé (et `await`é) par `transactionService.apply()` *(`transactionService.ts:563`)*
  lors de la confirmation d'un **crédit** dont `rpnAmount > 0` *(guardé `:557-564`)*.
- **Données lues/modifiées** *(`rpnLifecycleService.ts:122-157`)* : lit user + `SettingsModel`
  (`minimumBalanceRPN` défaut 5, `:130`), `calculateTotalPersons`. Si `newBalance < personnes ×
  minUnit` → ne fait rien (`:136-139`). Sinon, selon `subscription.rpnStatus` :
  `not_enrolled`/null → `enrollRpnMember` (`:145,164-215`) ; `unsubscribed` → `reactivateRpnMember`
  (`:148,223-252`) ; `enrolled` avec référence → `enrollPendingFamilyMembers` (`:151-153,60-96`) ;
  `enrolled` sans référence → simple avertissement (`:155`). L'inscription persiste
  `subscription.rpnExternalReference`, `rpnMatricule`, `rpnEnrollmentDate`, `missedRpnRemindersCount=0`.
- **Dépendances** : `UserModel`, `SettingsModel` ; `rpnExternalPlatformService`
  (`enrollOnExternalPlatform`, `enrollFamilyMemberOnExternalPlatform`) → `rpnHttpClient` (notrerpn.org) ;
  mailer (réactivation).
- **Idempotence et gestion des échecs** : gardes **atomiques** `UserModel.updateOne(...)` filtrés par
  statut + vérification `modifiedCount === 0` *(`:165-176,227-237`)* → un seul appelant concurrent
  procède (anti double-inscription). Les appels externes sont **fire-and-forget** avec `.catch`
  journalisant *(`:194-214,241-243`)* ; la référence n'est persistée qu'**après** succès externe.
- **Impact si absent ou en échec silencieux** : un membre qui a payé son RPN n'est pas inscrit sur
  notrerpn.org (pas de `rpnExternalReference`/`rpnMatricule`) → sa couverture décès n'est pas
  officialisée côté plateforme tierce, et ses personnes à charge en `pending` restent bloquées (un
  principal sans référence bloque l'inscription des dépendants).
- **Comportement attendu (reformulé)** : le principal NE DOIT être marqué `enrolled` en base
  qu'**après** confirmation de la référence externe (jamais `enrolled` sans `rpnExternalReference`) ;
  les appels externes DOIVENT être fiabilisés (attente/retry/idempotence) plutôt que fire-and-forget
  *(cf. GLOBAL §7-23 ; réf. `:154-156,194-214`)*.

### [Listener] Solde RPN insuffisant — `onRpnBalanceInsufficient()`
- **Objectif fonctionnel** : gérer un prélèvement RPN qui échoue faute de solde : compter les échecs,
  avertir, poser une date de désactivation, et désinscrire du fonds après trop d'échecs.
- **Déclencheur** : appelé par le **prélèvement décès** *(`deathAnnouncementService.ts:316`,
  concurrence 5)* et par le rappel de solde API *(`checkMinimumBalanceAndSendReminder.ts:53`)*.
- **Données lues/modifiées** *(`rpnLifecycleService.ts:263-295`)* : incrémente
  `subscription.missedRpnRemindersCount` (compteur **indépendant** de l'adhésion, `:270-271`). **Au
  1er échec** (`=== 1`) : transaction `debit/rpn/failed` (`:273-282`), `scheduledDeactivationDate =
  now + 7 jours` (`:283-284`), `sendDeactivationWarningEmail(email,'rpn',date)`. Toujours :
  `user.save()` + `sendPrelevementFailedDecesEmail`. Si `missedRpnRemindersCount ≥ maxMissed`
  (`maxMissedReminders`, défaut 3 côté service, `:292`) → `unsubscribeFromRpn` (`:302-316`).
- **Dépendances** : `UserModel`, `TransactionModel` ; `unsubscribeFromRpn` →
  `deactivateOnExternalPlatform` (notrerpn.org, fire-and-forget) ; mailer (avertissement,
  prélèvement échoué, désinscription).
- **Idempotence et gestion des échecs** : garde `=== 1` pour poser la date/avertissement une fois par
  cycle. ⚠ **Non pleinement idempotent** : des appels répétés continuent d'**incrémenter** le
  compteur. `unsubscribeFromRpn` (`:302-316`) désinscrit le **principal seul** (dépendants intacts),
  remet le compteur à zéro, appelle `deactivateOnExternalPlatform` en fire-and-forget et envoie
  `sendRpnUnsubscriptionEmail`.
- **Impact si absent ou en échec silencieux** : les insuffisances RPN ne sont pas comptabilisées → ni
  avertissement, ni désinscription ; un membre sans provision reste compté comme couvert et prélevé
  aux décès suivants sans jamais être régularisé ni retiré de notrerpn.org.
- **Comportement attendu (reformulé)** : le délai de 7 jours (RPN) NE DOIT PAS partager
  `scheduledDeactivationDate` avec l'adhésion (25 j) — champs/dates distincts pour cycles indépendants
  *(cf. GLOBAL §7-15/§7-16 ; réf. `:283`)*. La valeur `maxMissed` par défaut DOIT être unique et
  cohérente avec le modèle (`5`), pas `?? 3` *(cf. GLOBAL §7-13 ; réf. `:292`, `deathAnnouncementService.ts:481`)*.

### [Listener] Changements sur les personnes à charge — `onFamilyMember*`
- **Objectif fonctionnel** : répercuter sur notrerpn.org les changements de statut d'adhésion
  (`status`) et de statut RPN (`rpnStatus`) des personnes à charge, ainsi que l'inscription des
  dépendants en attente.
- **Déclencheur** : après un `PUT /api/users/:id` qui sauvegarde le user, par comparaison
  **snapshot avant/après** *(`userRouter.ts:450,453,456`, fire-and-forget `.catch`)* :
  - `onFamilyMemberStatusChanged` *(`:402-433`)* — transitions du **membership `status`** d'un membre
    ayant déjà une `rpnExternalReference` : → `inactive`/`deleted` = désinscription + `rpnStatus:'unsubscribed'` ;
    → `active` = réactivation + `rpnStatus:'enrolled'`.
  - `onFamilyMemberRpnStatusChanged` *(`:327-362`)* — changement volontaire du **`rpnStatus`** d'un
    membre actif : `unsubscribed` (+réf.) = désinscription ; `pending` (+réf.) = réactivation puis
    `rpnStatus:'enrolled'`.
  - `onFamilyMembersUpdated` *(`:369-376`)* — si le principal est `enrolled` avec référence, inscrit
    les membres actifs encore sans référence (`enrollPendingFamilyMembers`).
- **Données lues/modifiées** : lit `familyMembers` (snapshot + courant) ; écrit `familyMembers[i].rpnStatus`,
  `rpnExternalReference`, `rpnMatricule` (via `updateOne` positionnels) ; côté externe (dé)active les
  membres sur notrerpn.org.
- **Dépendances** : `UserModel` ; `rpnExternalPlatformService` (deactivate/reactivate/enrollFamily) →
  `rpnHttpClient`.
- **Idempotence et gestion des échecs** : **fire-and-forget** avec `.catch(console.error)` — **aucun
  retry, aucune persistance des échecs** ; seule la référence/le matricule persistés témoignent du
  succès. Les membres sans `rpnExternalReference` sont **ignorés** par `onFamilyMemberStatusChanged`
  (`:407-408`).
- **Impact si absent ou en échec silencieux** : notrerpn.org se désynchronise du dépôt local — une
  personne à charge désactivée/désinscrite reste « active » côté plateforme (ou l'inverse), et les
  dépendants en `pending` ne sont jamais réellement inscrits ; incohérences non détectées faute
  d'alerte.
- **Comportement attendu (reformulé)** : la synchro notrerpn.org DOIT être fiabilisée
  (attente/retry/idempotence, alerte en cas d'échec persistant) au lieu du fire-and-forget silencieux
  *(cf. GLOBAL §7-23 ; réf. `:341-359,416-430`)*. La bascule RPN d'une personne à charge NE DOIT PAS
  passer par un `PUT /api/users/:id` réécrivant tout le document (risque de surécriture) mais par une
  API ciblée par membre *(cf. GLOBAL §7-2 ; PAGES `/profil/couverture`)*.

### [Synchronisation externe] Client notrerpn.org (`rpnExternalPlatformService` + `rpnHttpClient`)
- **Objectif fonctionnel** : inscrire, activer et désactiver chaque personne couverte comme membre
  sur la plateforme mutualiste tierce `api.notrerpn.org`, et fournir aux listeners RPN une couche
  d'adaptation (mapping des données) et d'authentification.
- **Déclencheur** : sous-processus **sortant** appelé par les listeners RPN ci-dessus (jamais
  directement par une requête entrante). Aucun webhook en retour.
- **Données lues/modifiées** :
  - `rpnExternalPlatformService.ts` — adaptateur domaine→API : mapping genre/relation/pays/code postal
    (`:27-118`), payloads principal (`:122-143`) et famille (`:145-167`) ; opérations
    `enrollOnExternalPlatform` (`:176-192`), `enrollFamilyMemberOnExternalPlatform` (`:201-221`),
    `deactivateOnExternalPlatform` (`:227-242`), `reactivateOnExternalPlatform` (`:248-263`). Ne
    modifie **pas** la base locale ; renvoie `{reference, matricule}` que les listeners persistent.
  - `rpnHttpClient.ts` — client HTTPS bas niveau (`api.notrerpn.org`, `:51`) : `POST /users/login`
    (`:117`), `GET /users/me` (`:147`), `POST /members` (`:167`), `PUT /members/admin/activate` (`:181`).
- **Dépendances** : Node `https` ; variables d'env `EXTERNAL_APP_EMAIL/PASSWORD`,
  `RPN_ADMIN_REFERENCE` (sinon `GET /users/me`), `RPN_DEFAULT_RELATIONSHIP` (défaut `FRIEND`) ; mailer
  `sendExternalRegistrationFailureEmail` (email admin sur échec d'**inscription**, `:186-191,215-218`).
- **Idempotence et gestion des échecs** : **caches en mémoire non persistants** — token JWT
  (`_tokenCache`, marge de 60 s avant `exp`, `:104-129`) et référence admin (`_adminReferenceCache`,
  `:137-156`), tous deux **ré-authentifiés au redémarrage**. Le client **jette** sur statut `≥ 400` /
  réponse non-JSON ; la gestion fire-and-forget et l'email admin vivent **une couche au-dessus**. Les
  échecs de (dé)réactivation sont **seulement journalisés** (pas d'email).
- **Impact si absent ou en échec silencieux** : les personnes couvertes ne sont pas inscrites/activées
  côté notrerpn.org → couverture décès non reconnue par la plateforme partenaire, sans trace autre
  qu'un log (et un email admin pour les seules inscriptions).
- **Comportement attendu (reformulé)** : fiabiliser les appels (attente/retry/idempotence) et
  n'écrire l'état `enrolled` en base qu'après confirmation externe *(cf. GLOBAL §7-23)*.

---

## [Script/Migration] Routes admin one-shot

> Il n'existe **aucun script CLI ni seed** : pas de dossier `scripts/` ou `seed/`, et
> `server/package.json` ne déclare que `dev`/`build`/`start`/`test`/`copy-assets`. Les « migrations »
> sont des **routes HTTP admin** invoquées manuellement.

### [Migration] Backfill du statut RPN legacy — `POST /api/users/admin/backfill-rpn-status`
- **Objectif fonctionnel** : dériver le `rpnStatus` manquant des personnes à charge historiques qui
  possèdent déjà une `rpnExternalReference`, pour rendre les données cohérentes avec le nouveau modèle.
- **Déclencheur** : **invocation manuelle** par un admin *(`userRouter.ts:628-669`, gardes `isAuth`+`isAdmin`
  actives)*. Déclenchable depuis la page `/admin/relancer-rpn-en-echec` (cf. PAGES).
- **Données lues/modifiées** : lit les users dont un `familyMembers.rpnExternalReference` existe
  (`:633-635`) ; pour chaque membre ayant une référence mais un `rpnStatus` absent/`'not_enrolled'`,
  écrit `enrolled` si `status==='active'` sinon `unsubscribed` (`:642-653`), puis `markModified` +
  `user.save()` seulement si ≥ 1 correction (`:655-657`). Ne touche **pas** le `rpnStatus` du principal.
- **Dépendances** : `UserModel`. Aucune (pas d'email, pas d'appel externe).
- **Idempotence et gestion des échecs** : **idempotent** — le garde `(!rpnStatus || rpnStatus ===
  'not_enrolled')` saute les membres déjà corrigés à la ré-exécution. Renvoie un rapport JSON
  `{ fixed, users }`.
- **Impact si absent ou en échec silencieux** : les personnes à charge historiques restent avec un
  `rpnStatus` incohérent → mauvais décompte de couverture, dépendants potentiellement non ré-inscrits,
  affichage de couverture erroné.
- **Comportement attendu (reformulé)** : — *(processus cohérent avec son objectif ; à conserver, en
  couvrant aussi le principal si nécessaire)*.

### [Migration] Correction de solde — `POST /api/accounts/:id/balance-correction`
- **Objectif fonctionnel** : outil admin fixant les soldes `membership_balance`/`rpn_balance` à des
  valeurs absolues et créant une transaction de correction traçable (usage de migration/rattrapage).
- **Déclencheur** : **invocation manuelle** *(`accountRouter.ts:219-283`)*. ⚠ Garde `isAuth`
  **seule** — **pas `isAdmin`** (`:221`).
- **Données lues/modifiées** : body `{ membershipBalance?, rpnBalance? }` (≥ 1 requis, refus des
  négatifs, `:229-240`) ; fixe les soldes absolus (`:251-253`) ; si un écart ≠ 0, crée une
  `Transaction` compensatoire (`type:'credit'`, `fundType` both|membership|rpn, `amount = |Δmembership|
  + |Δrpn|`, `status:'completed'`, `balanceApplied:true`, `:264-275`).
- **Dépendances** : `AccountModel`, `TransactionModel`.
- **Idempotence et gestion des échecs** : **non idempotent** — chaque appel recrée une transaction de
  correction (même si l'écart est nul côté solde, tant qu'un Δ existe). La transaction est toujours
  `type:'credit'` même quand la correction **abaisse** un solde (Δ négatif).
- **Impact si absent ou en échec silencieux** : impossibilité de rattraper manuellement un solde
  erroné ; à l'inverse, des appels répétés gonflent l'historique de transactions.
- **Comportement attendu (reformulé)** : la route DOIT être réservée aux **admins** *(cf. GLOBAL §7-6 ;
  réf. `:221` isAuth seul)* et distinguer un `credit`/`debit` selon le signe du Δ *(réf. `:264-275`)*.

### [Migration] Purge des transactions sans statut — `DELETE /api/transactions/delete-zero-amount`
- **Objectif fonctionnel** : supprimer en masse les transactions dépourvues de `status` (données
  résiduelles).
- **Déclencheur** : **invocation manuelle** *(`transactionRouter.ts:233-250`)*. ⚠ Gardes
  `//isAuth`/`//isAdmin` **commentées** → route **actuellement publique** (`:235-236`).
- **Données lues/modifiées** : `TransactionModel.deleteMany({ status: undefined })` (`:239`) — malgré
  son nom (« zero-amount »), le critère porte sur l'**absence de `status`**, pas sur un montant nul.
  Renvoie `deletedCount`.
- **Dépendances** : `TransactionModel`.
- **Idempotence et gestion des échecs** : idempotent (un 2e appel ne trouve plus rien) ; **aucune
  confirmation, aucune sauvegarde** — suppression définitive.
- **Impact si absent ou en échec silencieux** : opération de nettoyage ponctuelle ; son absence est
  sans effet fonctionnel. En revanche, exposée **publiquement**, elle permet à n'importe qui de
  supprimer des transactions.
- **Comportement attendu (reformulé)** : DOIT être protégée par `isAuth`+`isAdmin` *(cf. GLOBAL §7-6 ;
  réf. gardes commentées `:235-236`)* ; renommer pour refléter le critère réel (`status` absent).

---

## [Infrastructure]

### [Infrastructure] Journalisation Winston — `initLogger()`
- **Objectif fonctionnel** : centraliser tous les `console.*` de l'application dans des fichiers
  journaux avec rotation et rétention longue.
- **Déclencheur** : appelé **au démarrage** *(`index.ts:17`, juste après `dotenv.config`)* ; le
  logger est construit à l'import du module *(`logger.ts:15-39`)*.
- **Données lues/modifiées** : crée `logs/` si absent (`:42-44`) ; **monkey-patche**
  `console.log/info/warn/error/debug` pour router vers winston (`:47-61`). Écrit
  `logs/%DATE%.log` (info) et `logs/%DATE%.error.log` (erreurs), `datePattern 'YYYY-MM'` → rotation
  **mensuelle** (malgré le nom `DailyRotateFile`), rétention `maxFiles: '24m'` = **24 mois**
  (`:24-36`). Chemin relatif à `process.cwd()` (`:7`). Niveau `info` → `console.debug` supprimé.
- **Dépendances** : `winston`, `winston-daily-rotate-file`. Système de fichiers local.
- **Idempotence et gestion des échecs** : appelé une seule fois au boot ; si l'écriture disque échoue,
  winston gère en interne (pas de gestion applicative). Le monkey-patch est global et persistant pour
  la durée du process.
- **Impact si absent ou en échec silencieux** : perte de traçabilité — les logs ne sont plus
  persistés (surtout critique car **toute** la gestion d'échec fire-and-forget du RPN et des emails
  ne laisse **que** des logs comme trace). Sans journaux, les échecs de synchro notrerpn.org
  deviennent invisibles.
- **Comportement attendu (reformulé)** : ne pas journaliser les **jetons d'authentification en clair**
  *(cf. GLOBAL §7-8 ; réf. `utils.ts:63`)*.

### [Infrastructure — mineur] Cache JWT en mémoire (`isAuth`)
- **Objectif fonctionnel (visé)** : mettre en cache les jetons vérifiés pour éviter de re-vérifier le
  JWT à chaque requête.
- **Déclencheur** : middleware `isAuth` à chaque requête authentifiée *(`utils.ts:57-60`)*.
- **Données lues/modifiées** : instancie `caching('memory', { max:100, ttl:2592000 })` (30 jours) —
  ⚠ **ré-instancié à chaque requête** (`:57`), donc un cache vide neuf par appel : le cache **ne
  persiste jamais** entre requêtes et n'apporte aucun bénéfice ; il peut au contraire **prolonger** la
  durée de vie perçue d'un jeton (expiration recalculée).
- **Dépendances** : `cache-manager`, `jsonwebtoken`.
- **Idempotence et gestion des échecs** : sans effet réel (cache jetable). Aucun sweeper externe.
- **Impact si absent ou en échec silencieux** : nul en pratique (le cache n'ayant aucun effet
  fonctionnel actuel).
- **Comportement attendu (reformulé)** : le cache d'authentification DOIT être **partagé** entre les
  requêtes et NE DOIT PAS prolonger la durée de vie réelle d'un jeton au-delà de son expiration
  *(cf. GLOBAL §7-9 ; réf. `utils.ts:57-86`)*.

---

## [Webhooks entrants]

- **Aucun.** Il n'existe aucun endpoint de réception d'événement externe. Les paiements **Interac**
  sont saisis puis **confirmés manuellement par un admin** (pas d'API bancaire, pas de webhook).
  Toute communication avec notrerpn.org, Cloudinary et SMTP Gmail est **sortante**
  *(GLOBAL §6.3)*.
- **Comportement attendu (reformulé)** : le propriétaire souhaite, **si possible, automatiser la
  réception/validation des paiements Interac** *(cf. GLOBAL §2, note Interac)* — ce qui introduirait
  le premier webhook entrant ; à cadrer séparément (**à confirmer** : faisabilité côté fournisseur
  Interac).

---

## Emails — dépendance transversale (pas un worker)

- **Nature** : `mailer/core.ts::sendEmail` *(`:6-55`)* envoie de façon **synchrone et inline** :
  un **nouveau transport nodemailer est recréé à chaque envoi** (`:17-26`), un seul
  `await transporter.sendMail(...)` (`:54`), **sans file, sans retry, sans backoff**. Les appelants
  (cron, listeners, routes) `await`ent directement l'envoi. Ce n'est donc **pas** un processus de
  fond mais une dépendance appelée par les autres processus. Chaque courriel joint 3 images inline
  (drapeau, logo, armoiries) et pointe vers `https://www.acq-rpn.org/...` *(GLOBAL §4.9)*.
- **Configuration** : `service`/`host`/`port 587`/auth via env `NODEMAILER_*` *(`:18-25`)*.
- **Comportement attendu (reformulé)** (décision propriétaire) : l'envoi de courriels DOIT **gérer les
  limites d'envoi et les échecs SMTP** (Gmail) de façon robuste — file d'attente + reprise
  (retry/backoff) et réutilisation d'un **transport unique** — plutôt qu'un envoi inline sans reprise
  qui peut **perdre un courriel silencieusement** *(réf. `mailer/core.ts:6-55`)*. À défaut d'une file
  complète, au minimum tracer et réessayer les envois en échec. Par ailleurs, **aucun secret SMTP ne
  doit être codé en dur** dans la source *(cf. GLOBAL §7-4 ; identifiants Gmail présents dans
  `mailer/core.ts`)*.

---

## Tableau récapitulatif

| Processus | Déclencheur | Objectif en 5 mots | Confiance |
|---|---|---|---|
| [Cron] Cotisation annuelle | `0 10 * 1 0` (dim. janvier 10h) | Prélever et activer l'adhésion annuelle | Élevé |
| [Cron] Désactivation comptes inactifs | `0 5 * * *` (quotidien 5h) | Désactiver les comptes en défaut | Élevé |
| [Cron — désactivé] Rappel solde RPN bas | `0 9 * * 0` (commenté) | Alerter d'un solde RPN bas | Élevé |
| [Sous-proc] Échec prélèvement adhésion | Appel depuis cotisation annuelle | Compter échec, avertir, planifier désactivation | Élevé |
| [File mémoire] Prélèvement décès | `POST /announcements/new` \| `/batch` | Débiter le RPN par décès | Élevé |
| [Listener] Confirmation paiement RPN | `transactionService.apply` (crédit RPN) | Inscrire le principal au RPN | Élevé |
| [Listener] Solde RPN insuffisant | Prélèvement décès + rappel API | Compter échec RPN, désinscrire | Élevé |
| [Listener] Changements personnes à charge | `PUT /api/users/:id` (snapshot diff) | Synchroniser les dépendants sur notrerpn | Élevé |
| [Sync externe] Client notrerpn.org | Appelé par les listeners RPN | Inscrire/activer membres plateforme tierce | Élevé |
| [Migration] Backfill statut RPN | Manuel (admin) | Dériver le rpnStatus legacy | Élevé |
| [Migration] Correction de solde | Manuel (isAuth seul) | Fixer soldes + transaction correction | Élevé |
| [Migration] Purge transactions sans statut | Manuel (public — gardes commentées) | Supprimer transactions sans statut | Élevé |
| [Infra] Journalisation Winston | Démarrage (`index.ts:17`) | Journaliser console vers fichiers | Élevé |
| [Infra] Cache JWT en mémoire | Chaque requête `isAuth` | Cacher les jetons vérifiés (inefficace) | Élevé |
| [Webhooks entrants] | — | Aucun webhook entrant | Élevé |
| [Transversal] Envoi d'emails | Appelé par les processus | Envoyer courriels SMTP inline | Élevé |

> **Confiance** : *Élevé* = fichier lu intégralement, comportement confirmé dans le code ;
> *Moyen* = déduit d'une lecture partielle ; *À valider* = dépend de l'environnement / de
> l'infrastructure (voir « Angles morts »).

---

## Angles morts confirmer

> Processus ou comportements soupçonnés mais **non confirmables à partir du code seul** — présence
> d'une dépendance externe, d'une variable d'environnement ou d'une configuration d'infrastructure.
> Aucune case remplie par supposition : **« à confirmer »** partout où le code ne tranche pas.

- **Déclenchement réel des crons** : dépend du process qui reste vivant et du **fuseau de l'hôte**
  (aucun `{timezone}` aujourd'hui ; cible **voulue** = `America/Toronto`, cf. comportement reformulé).
  En déploiement **multi-instance / PM2 cluster**, chaque instance chargerait le module cron → **risque
  de double-déclenchement** des prélèvements. **réponse** aucune idée (topologie de déploiement inconnue).
- **Sauvegardes / tâches planifiées MongoDB Atlas** : hors code, gérées par l'hébergeur.
  **Confirmé hors code** par le propriétaire — non documentable ici.
- **Processus / webhooks côté notrerpn.org** : la plateforme tierce peut exécuter ses propres
  traitements et fournir les données traiter à notre application pour être consommmer; **invisibles depuis ce dépôt**. **Confirmé hors code** par
  le propriétaire.
- **Origine CORS / reverse proxy de production** : le code ne montre qu'une origine `http://localhost:5173`
  *(`index.ts:31-36`)* ; l'origine de prod repose sur une config d'infra externe.
- **Limites d'envoi SMTP Gmail** : aujourd'hui **aucune file ni retry** → risque de **perte
  silencieuse** de courriels sous quota/erreur. Le propriétaire souhaite le **gérer** (voir
  comportement reformulé « Emails »). 
- **Variables d'environnement requises** (présence/valeurs non vérifiables) : `MONGODB_URI`,
  `JWT_SECRET`, `PORT`, `NODEMAILER_*`, `EXTERNAL_APP_EMAIL/PASSWORD`, `RPN_ADMIN_REFERENCE`,
  `RPN_DEFAULT_RELATIONSHIP`, `CLOUDINARY_*`. Chargées via `.env` *(`index.ts:16`)*.
- **Chemin réel des journaux** : `logs/` est résolu contre `process.cwd()` *(`logger.ts:7`)* → dépend
  du répertoire de lancement (ex. `server/logs` en dev vs répertoire de build en prod).
- **Reprise des annonces décès après crash** : aucun re-scan des `processingStatus: 'pending'`/
  `'processing'` au démarrage n'existe dans le code ; s'il devait exister un mécanisme externe
  (supervision, relance manuelle systématique), il n'est **pas visible ici**.
