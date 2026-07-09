# FONCTIONNEL_GLOBAL — `mon-rpn-react`

> Document d'analyse fonctionnelle rétro-conçu à partir du code existant, destiné à guider une
> réécriture à iso-fonctionnalité. Les règles non triviales sont référencées par `fichier:ligne`.
> Lorsqu'un point ne peut être établi avec certitude à partir du code seul, il est marqué
> **« à confirmer »** et repris en section 8 (Angles morts).

## 1. Description en une phrase

Application web d'une **association d'entraide communautaire** (ACQ / « RPN » — la communauté
camerounaise du Québec, plateforme partenaire `notrerpn.org`) permettant à des membres de s'inscrire
(adhérer à l'association) avec leurs personnes à charge, en payant une **cotisation annuelle d'adhésion** 
via les transferts interact et d'alimenter un **fonds de solidarité décès (RPN)** prélevé lors des annonces de décès, avec gestion 
administrative des comptes, le traitements des paiements (Interac) et gérer la couverture décès par personne.

## 0. Décisions du propriétaire (cadrage de la réécriture)

> Décisions confirmées le 2026-07-03. Elles **priment** sur toute description « telle qu'implémentée »
> plus bas et définissent le périmètre voulu de la nouvelle application.

**Structure de frais (par personne active — principal + chaque personne à charge active ; tous les montants sont configurables côté serveur)**
- **À la création du compte** : `10$` de frais de traitement + **adhésion selon la profession**
  (`étudiant = 25$`, `sans emploi = 25$`, `parent/beau-parent résident au Canada = 25$`,
  `travailleur = 50$`, `mineur (<18 ans) ou autre = 0$`) + **provision RPN** (`20$` **minimum imposé
  par personne**, davantage possible si le membre le souhaite).
- **Au renouvellement annuel** : `5$` de frais de gestion **+ l'adhésion selon la profession** (mêmes
  tarifs), **par personne active**. **(Décision 2026-07-05 — correction : l'adhésion EST refacturée
  au renouvellement.** Seuls diffèrent de la création : le frais fixe `5$` au lieu de `10$` et
  l'absence de nouvelle provision RPN obligatoire.)
- **Le renouvellement est facturé, PAS prépayé** : il repose sur une **facture annuelle réellement
  payée** (Interac), précédée d'une **période de rappels d'environ 2 mois** (janvier → mi-février). Le
  système **ne prélève pas** un solde d'adhésion constitué d'avance. L'année n'est accordée que sur
  **paiement réel** (ou exonération explicitement tracée par l'administration).
- **RPN** : n'est pas un poste annuel fixe ; le solde RPN est **réalimenté à la demande** (`20$`/personne
  minimum pour être couvert). Le montant prélevé par décès = `nombre de personnes couvertes × montant
  par personne`, **défini par l'admin, sans plafond**. **Une grande famille contribue davantage à
  chaque décès** — équité « par personne couverte » **assumée**.
- **Couverture RPN conditionnée au paiement** : seule une personne ayant **payé** (ou exemptée
  d'adhésion) peut bénéficier de la couverture RPN.
- **Seuils RPN distincts (rôles précisés)** : **`5$`/personne = alerte** — informer le membre que son
  solde est **trop bas et à risque en cas de décès multiples** (pas de sanction). **`≤ 1$` =
  désinscription immédiate** (courriel) — car **au prochain décès, ce serait l'association qui paierait
  à sa place**.
- **Rôle du fonds (clarifié)** : l'association est **une cellule parmi plusieurs** souscrites au RPN
  via `notrerpn.org`. Elle **collecte** les contributions et tient à jour les adhésions, puis
  **reverse** les montants à l'administrateur de `notrerpn.org`, qui **verse la prestation à la
  famille endeuillée** (mutualisation de toutes les cellules à l'échelle du Canada). Le **solde RPN
  local** gère notre cellule ; **`notrerpn.org` fait foi** pour le droit réel à prestation.
- Les enfants mineurs (< 18 ans) ne paient pas d'adhésion (voir règles §4.4).
- Une **personne à charge peut devenir titulaire** de son propre compte plus tard (couple séparé,
  enfant devenu adulte) — besoin **confirmé**, voir §0bis.

**À RETIRER de la nouvelle application (fonctionnalités non désirées)**
- **Paiement par carte de crédit** (schéma `Card`, `accountModel.ts:15-33`) — supprimer entièrement ;
  ne conserver que le paiement **Interac**.
- **Statut d'abonnement `expired`** — supprimer de l'énumération et de toute logique.
- **Module Événements** — Fête de Noël, menu mariage et toutes les réservations
  (`feteNoel2025Model.ts`, `feteNoel2025Router.ts`, `reservationFeteNoel2025Service.ts`,
  `reservationEvenementMailer.ts`, routes `/api/reservations/*`, pages `/reserver-fete-fin-annee`,
  `/liste-reservations`, `/menu-mariage`) — hors périmètre, à ne pas reporter.
- **Inscription externe automatique par Puppeteer** — définitivement abandonnée au profit de l'API
  `notrerpn.org` ; retirer tout vestige.
- **Fenêtre d'auto-déconnexion sur inactivité (30 min)** côté client (`lib/Store.tsx`) — retirer.
  (L'auto-déconnexion à l'expiration réelle du JWT est conservée.)

**À CONSERVER / comportements confirmés**
- **Cotisation annuelle** : exécution planifiée **tous les dimanches de janvier tant que la cotisation
  de l'année n'est pas payée** (le garde d'idempotence saute les comptes déjà payés).
- **Rappels de solde RPN bas** (courriels + cron, actuellement désactivés) : **à réactiver tels quels**.
- **Prélèvement décès** : la facturation est unique pour une famille car en générale ce sont les **membres principaux** qui renfloue les fonds de toutes
  ses personnes couvertes.
- **Multilingue** : conserver l'infrastructure i18n ; langue par défaut le **français**, avec la
  possibilité de **traduire l'application ultérieurement**.
- **Règles de résidence / statut d'immigration** influençant la facturation (parents facturés seulement
  s'ils résident au Canada, distinction résident/visiteur) : conservées telles que décrites en §4.4.
- **Devise** : CAD ; on doit pouvoir accpeter 12,5$ de paiement ou de facturation par exemple.
- **Réinitialisation de mot de passe** : lier le jeton à l'utilisateur cible, **mais NE PAS imposer de
  règles de robustesse** du mot de passe (public peu habitué).
- **Hébergement** : MongoDB **Atlas**.

## 0bis. Décisions produit additionnelles (2026-07-05)

> Décisions confirmées par le propriétaire dans BESOIN_AFFAIRE.md. Elles **priment** également sur le
> « tel qu'implémenté » et complètent §0. Les rares points encore ouverts sont marqués **« à valider »**.

- **Validation des paiements Interac** : voie **principale = automatique** — le membre fournit la
  **preuve de paiement** reçue de sa banque (capture/courriel) ; **Claude Vision** l'analyse et valide
  comme le ferait un admin. **Voie de secours = validation manuelle** par un admin en cas de problème.
- **Contrôle du montant Interac** : le montant envoyé doit être **≥ total attendu**, sinon **refusé**.
  Tout **surplus est affecté au solde RPN**. *(Ex. attendu 45$ = 25$ adhésion + 20$ RPN ; le membre
  envoie 55$ → 25$ adhésion + 30$ RPN.)*
- **Vérification d'identité** : si le membre fournit une pièce, **Claude Vision** confirme l'exactitude
  du nom ; sinon **déclaration sur l'honneur** (motif : noms souvent mal saisis, difficiles à
  identifier).
- **Mot de passe** : généré automatiquement à l'inscription (le membre ne le choisit pas), **pour
  l'instant** ; réinitialisable ensuite.
- **Ajout d'une personne à charge en cours d'année** : facturée au **tarif de création**.
- **Retrait d'une personne à charge** (suppression / désactivation / non-renouvellement) :
  désinscription sur `notrerpn.org` ; le **montant RPN restant est conservé** dans le fonds du foyer
  s'il reste des membres actifs (ou pour le titulaire), **sinon remboursé**.
- **Remboursement du solde RPN provisionné** : uniquement **sur demande verbale** du titulaire au
  **trésorier**. Une **désinscription entraîne la perte immédiate** de la couverture.
- **Réinscription au RPN après désinscription pour insuffisance** : nécessite de reconstituer
  **`20$` minimum par personne**.
- **Renouvellement — mise à jour des professions** : à **2 ans**, revalider le statut des étudiants
  (toujours aux études ou devenus travailleurs) ; après **5 ans**, un étudiant devient
  **automatiquement travailleur**, **sauf** étudiant en **médecine ou doctorat**.
- **Rappel de solde RPN bas** : **chaque samedi** (hebdomadaire). Le seuil `5$`/personne est une
  sécurité en cas de décès multiples.
- **Annonce de décès** : **aucune preuve** à joindre côté application — les décès proviennent du **RPN
  central `notrerpn.org`**. Un foyer au solde insuffisant est **désinscrit** (personnes à charge
  comprises) mais peut **se régulariser rétroactivement**. Un solde négatif après un décès fait
  **office de dette** à rembourser. **À valider** : mécanique exacte de la « dette » (qui, quand,
  comment).
- **Parrainage** : un membre qui parraine un adhérent **réellement devenu actif (payé)** obtient
  **-50 % sur sa cotisation d'adhésion** au **renouvellement de l'année suivante**. Réductions
  **cumulables** par filleul actif, applicables jusqu'au **maximum des adhésions de son foyer**
  (personnes à charge incluses), **non reportables** au-delà d'un an, **non rétroactives**,
  **horodatées** ; l'administration peut corriger/annuler un parrainage. Détail complet en §4.10.
- **Rôles** : ajout du rôle **« Membre du bureau »** (exempté d'adhésion pour lui et sa famille,
  **mais PAS du RPN** ; peut publier rapports/activités ; attribué par un admin). **Admins et membres
  du bureau contribuent au RPN** comme tout le monde et perdent la couverture si leur solde RPN < `1$`.
- **Suppression de compte** : effet **cascade** + désinscription `notrerpn.org`, mais **archivage**
  des données financières à des fins d'**audit** (conservation légale). Un admin ne peut être supprimé.
- **Promotion d'une personne à charge en titulaire** : opération **réservée à l'admin et effectuée par
  l'admin**. Elle **conserve son matricule `notrerpn.org` et sa couverture si active**, **mais son solde
  RPN NE suit PAS** : le nouveau foyer **repart à 0 $** et doit **re-provisionner 20 $ minimum**. Son
  **historique n'est pas transféré** ; le titulaire d'origine **cesse de payer pour elle**. Voir §4.10.
- **Reversement au RPN central** : l'application **ne reverse rien** à `notrerpn.org` ; le **comptable
  effectue le virement depuis la banque**. L'app fournit seulement, à chaque annonce de décès, une
  **estimation du montant à envoyer**.
- **Synchronisation `notrerpn.org`** : la plateforme **fait foi** ; **réconciliation automatique**, et
  en cas d'échecs répétés, **correction manuelle** (inscription directe sur `notrerpn.org` puis saisie
  manuelle du **matricule** et de la **référence** dans l'application).

## 2. Stack technique actuelle

Monorepo à deux packages : `client/` (SPA) et `server/` (API + tâches planifiées). Servi en
production comme une seule appli (le serveur Express sert le build statique du client depuis
`../dist`, `server/src/index.ts:53-62`).

### Frontend (`client/package.json`)
| Domaine | Techno | Version |
|---|---|---|
| Langage | TypeScript | ^5.2.2 |
| Framework UI | React | ^18.2.0 |
| Build/dev | Vite | ^6.2.6 |
| Routage | react-router-dom | ^6.22.3 (`createBrowserRouter`) |
| Données serveur | @tanstack/react-query | ^5.28.6 |
| État global | **React Context + useReducer** (`lib/Store.tsx`) — `redux`^5.0.1 / `react-redux`^9.1 sont installés mais **non utilisés** comme store principal (**à confirmer** : usage résiduel) |
| Tables | @tanstack/react-table | ^8.16.0 |
| Formulaires | react-hook-form ^7.51 + @hookform/resolvers ^3.3 + zod ^3.22 | |
| UI kit | shadcn/ui sur Radix UI (accordion, dialog, etc.), tailwindcss ^3.4.1, tailwind-merge, class-variance-authority, lucide-react, framer-motion ^11.2 | |
| i18n | i18next ^23.10 + react-i18next ^14.1 + language-detector + http-backend | |
| HTTP | axios ^1.6.8 (`apiClient.ts`) | |
| Dates | date-fns ^3.6, react-day-picker ^8.10 | |
| Graphiques | recharts ^2.15, react-google-charts ^4.0 | |
| Divers | react-helmet-async (SEO), sonner (toasts), embla-carousel, **jsonwebtoken ^9** (décodage JWT côté client) | |
| Tests | `node --test ./test/*.test.js` (runner natif Node) | |

### Backend (`server/package.json`)
| Domaine | Techno | Version |
|---|---|---|
| Langage / exécution | TypeScript ^5.4.3, ts-node-dev (dev) | |
| Framework HTTP | Express | ^4.19.2 (+ express-async-handler) |
| Base de données | MongoDB (**version à confirmer**) via Mongoose ^8.2.4 | |
| ORM / ODM | @typegoose/typegoose ^12.2.0 (modèles par classes décorées) | |
| Auth | jsonwebtoken ^9.0.2, bcryptjs ^2.4.3 | |
| Cache | cache-manager ^5.5.1 (mémoire, cf. bogue §7) | |
| Emails | nodemailer ^8.0.1 (SMTP Gmail) | |
| Fichiers/images | cloudinary ^2.5.1, multer ^1.4.5, streamifier ^0.1.1 | |
| Planification | node-cron ^3.0.3 | |
| Logs | winston ^3.14 + winston-daily-rotate-file ^5.0 | |
| Config | dotenv ^16.4.5 | |
| CORS | cors ^2.8.5 | |
| Tests | `node --loader ts-node/esm --test ./test/*.test.ts` | |

### Intégrations externes
- **notrerpn.org** (`api.notrerpn.org`) — plateforme mutualiste tierce où chaque personne couverte
  est inscrite comme membre (REST + JWT). Client bas niveau : `infrastructure/notrerpn/rpnHttpClient.ts`.
- **Claude Vision** — pour la lecture d'images (pièces d'identité, preuve de paiement).
- **SMTP Gmail** via nodemailer — envoi de tous les courriels.
- **Interac e-Transfer** — moyen de paiement (référence saisie manuellement, validation par un admin ;
  pas d'API ni de webhook mais je veux l'automatiser si possible).

## 3. Rôles / types d'utilisateurs

| Rôle | Détection | Ce qu'il peut faire |
|---|---|---|
| **Visiteur** (non connecté) | Absence de `userInfo` en `localStorage` | Pages publiques (accueil, à propos, contact, conditions, FAQ), assistant d'inscription complet (4 étapes), connexion, mot de passe oublié/réinitialisation. |
| **Membre** (connecté, `isAdmin=false`) | `userInfo` présent | Tableau de bord, profil, gestion des personnes à charge, gerer couverture RPN de lui et ses personnes à charge, parrainage de nouveau membre qui applique une réduction de 50% pour l'année suivante, facturation (complète + partielle), moyen de paiement, historique de ses transactions et des annonces de décès. Le champ `primaryMember` (défaut `true`, `userModel.ts:254`) distingue le titulaire ; les personnes à charge ne sont PAS des utilisateurs (sous-documents `familyMembers`). |
| **Membre du bureau** *(rôle NOUVEAU — absent du code actuel ; attribué par un admin)* | à créer | Toutes les capacités membre **+** publication de rapports/activités du bureau. **Exempté de la cotisation d'adhésion** pour lui et sa famille, **mais PAS du RPN** (il contribue aux décès et perd la couverture si son solde RPN < `1$`). N'a pas les pouvoirs d'administration. |
| **Admin** (`isAdmin=true`, `userModel.ts:248`) | `userInfo.isAdmin` côté client (`AdminRoute.tsx`), `isAdmin` middleware côté serveur (`utils.ts:119`) | Toutes les capacités **membre du bureau** + validation des paiements, publication des décès, gestion des comptes, transactions (confirmer/rejeter/rembourser/éditer), paramètres, synchronisation RPN manuelle, activation/désactivation/suppression de comptes, bascule des rôles. **Exempté d'adhésion** pour lui et sa famille, **PAS du RPN** (contribue aux décès comme tout membre). |
| **Compte administrateur externe** (notrerpn.org) | `EXTERNAL_APP_EMAIL/PASSWORD`, réf. via `RPN_ADMIN_REFERENCE` ou `/users/me` | Non un rôle applicatif interne : compte de service utilisé par le backend pour inscrire/activer/désactiver les membres sur la plateforme tierce. |

> Note sécurité (détaillée §7) : le rôle admin est fixé par un booléen accepté à l'inscription et
> porté dans le JWT ; plusieurs contrôles d'accès sont absents ou commentés.

## 4. Modules / domaines fonctionnels

### 4.1 Authentification & inscription
- **But** : créer un compte via un assistant en 4 étapes, se connecter, récupérer/réinitialiser un
  mot de passe, gérer le parrainage.
- **Entités** : `User.register` (email unique en minuscules, password bcrypt, `conditions`,
  `occupation` student|worker, institution, studentNumber, studentStatus, workField —
  `userModel.ts:74-104`) ; `User.origines` (firstName, lastName, birthDate, nativeCountry, sex,
  id_image — `:54-72`) ; `User.infos` (residenceCountry, residenceCountryStatus, postalCode, address,
  tel, hasInsurance, emergencyContacts[] — `:9-52`).
- **Flux d'inscription (client)** : étape 1 `Register` (email + occupation, génération auto d'un mot
  de passe aléatoire, acceptation des conditions) → étape 2 `Origines` (identité, **âge ≥ 18 requis**,
  `Origines.tsx:151-160`, pays natal par défaut Cameroun) → étape 3 `Infos` (coordonnées, code postal
  validé par regex) → étape 4 `Urgence` (jusqu'à 2 contacts d'urgence ; à la soumission : création du
  compte serveur, compte « en attente de premier paiement », transaction en attente, envoi du mot de
  passe par courriel, notification admin).
- **Règles métier** :
  - Email stocké/comparé en minuscules (`userModel.ts:75`, login `userRouter.ts:266`).
  - **Détection de conflit d'inscription** (`registrationConflictService.ts`) : email déjà utilisé →
    `EMAIL_ALREADY_USED` ; sinon même `nom + téléphone` sous un autre email →
    `ACCOUNT_ALREADY_EXISTS_WITH_OTHER_EMAIL` (`:83-104`). Nom comparé en exact insensible à la casse ;
    téléphone comparé brut (non normalisé).
  - Code de parrainage unique généré : `2 lettres nom + 1 lettre prénom + 4 chiffres`, jusqu'à 10
    tentatives (`utils.ts:135-162`).
  - Token JWT : `30 jours` si `rememberMe`, sinon `30 min` (`utils.ts:34`) ; token de réinitialisation
    de mot de passe : `1 h` (`utils.ts:20-31`).
- **Intégrations** : email (mot de passe oublié, mot de passe temporaire, notification nouveau
  membre). L'inscription automatique par Puppeteer sur la plateforme externe est **désactivée**
  (commentée, `userRouter.ts:342-346`) et à retirer (§0).

### 4.2 Profil & personnes à charge
- **But** : consulter/mettre à jour ses informations et gérer les personnes à charge (`familyMembers`).
- **Entité `FamilyMember`** (`userModel.ts:106-177`) : firstName, lastName, relationship, `status`
  (défaut `active`), residenceCountryStatus, birthDate, sex (M/F pour notrerpn.org), tel, occupation,
  studentStatus, institution, studentNumber, livesInCanada, `rpnStatus`
  (not_enrolled|pending|enrolled|unsubscribed), `rpnExternalReference`, `rpnMatricule`,
  `membershipCoveredThisYear` (null = ajouté après le paiement annuel / non encore couvert ; année =
  couvert ; undefined = donnée antérieure à la fonctionnalité).
- **Règles métier** :
  - Mise à jour via `PUT /api/users/:id` : les champs RPN gérés côté serveur
    (`rpnExternalReference`, `rpnMatricule`) sont **préservés** lors du merge (`userRouter.ts:412-446`).
  - Un membre facturable devenu actif après le paiement annuel est marqué `membershipCoveredThisYear
    = null` (« en attente de couverture ») pour être facturé en facturation partielle
    (`userRouter.ts:432-434`).
  - Statut RPN rétro-compatible : si `rpnExternalReference` existe mais `rpnStatus` est absent, il est
    dérivé du statut membership (`userRouter.ts:439-441`).
  - Les changements de `status` et de `rpnStatus` d'une personne à charge déclenchent la synchro
    notrerpn.org (voir 4.5).

### 4.3 Comptes & soldes
- **But** : porter les soldes financiers et le moyen de paiement d'un membre principal.
- **Entité `Account`** (`accountModel.ts`) : `membership_balance` (défaut 0), `rpn_balance` (défaut 0),
  `paymentMethod`, `card[]` (réseau, cvv, expiry, numéro — **à retirer, cf. §0**),
  `interac[]` (montant, réf, date), `isAwaitingFirstPayment`, dénormalisation firstName/lastName/
  userTel/userResidenceCountry, `userId`. Le compte représente uniquement les **membres principaux**
  (commentaire `accountModel.ts:76`).
- **Règles métier** :
  - Un compte est créé automatiquement au besoin avec soldes à 0 et `isAwaitingFirstPayment=true`
    (`transactionService.ts:825-850`).
  - **Barème d'unicité Interac** : une même référence Interac ne peut exister deux fois (comptes +
    transactions), insensible à la casse (`interacReferenceService.ts`).
  - **Barrière anti-alimentation RPN sans adhésion payée** (`rpnPaymentEligibilityService.canIncreaseRpnBalance`) :
    un membre principal ne peut augmenter son solde RPN que si (a) l'acteur est admin, ou (b) ce n'est
    pas un membre principal, ou (c) il n'y a pas d'augmentation RPN, ou (d) le paiement inclut aussi
    une hausse membership, ou (e) l'adhésion de l'année est déjà payée (`rpnPaymentEligibilityService.ts:35-55`).
  - Route `POST /:id/balance-correction` : outil admin de migration fixant les soldes et créant une
    transaction de correction (`accountRouter.ts:219`).

### 4.4 Cotisation annuelle (adhésion / « membership »)
- **But** : calculer et prélever la cotisation annuelle de chaque unité familiale, et gérer le cycle
  de vie de l'abonnement.
- **Entité `Subscription`** (`userModel.ts:179-222`) : `startDate`, `status`
  (registered|active|inactive|expired — `expired` à retirer §0), `endDate`, `missedRemindersCount`,
  `scheduledDeactivationDate`, `lastMembershipPaymentYear`, `membershipPaidThisYear`, + champs RPN
  (voir 4.5). **Paramètres** (`settingsModel.ts`) : `membershipUnitAmount=50`,
  `studentMembershipUnitAmount=25`, `amountPerDependent=10`, `minimumBalanceRPN=5`,
  `maxMissedReminders=5`.
- **Règles de calcul** (`membershipService.calculateMembershipAmount:30-75`) :
  - Seules les personnes **≥ 18 ans** sont facturées ; âge = `annéeCourante − annéeNaissance`
    (approximation à l'année, `:39,:50`).
  - Une personne à charge doit être **`status === 'active'`** pour être facturée (`:51`).
  - **Étudiant** = `occupation==='student'` ET `studentStatus !== 'part-time'` → tarif étudiant ;
    un étudiant à temps partiel est facturé comme travailleur (`:24-28`).
  - **Parents** (`Père, Mère, Beau-père, Belle-mère`) : facturés au **tarif étudiant**, et seulement
    s'ils résident au Canada (`livesInCanada`, sinon `residenceCountryStatus !== 'visitor'`) (`:55-63`).
  - **Conjoint(e)/enfant adulte** : étudiant ou travailleur selon `occupation` (fallback legacy
    `residenceCountryStatus==='student'`) (`:64-71`).
  - **⚠ Modèle cible (voir §0, décision 2026-07-05)** : distinguer **création** et **renouvellement**.
    **Création** = 10$ traitement + adhésion profession + provision RPN ≥ 20$. **Renouvellement** =
    **5$ de gestion + adhésion selon profession**, par personne active, **sur facture réelle** (pas un
    auto-prélèvement d'un solde prépayé), avec **rappels sur ~2 mois** (janvier → mi-février). Ajouter
    la profession **« sans emploi »** (25$), applicable au titulaire **et** aux personnes à charge.
- **Cycle de vie** :
  - Prélèvement réussi si `membership_balance >= totalDû` → débit du solde, transaction `debit/completed`,
    email de succès, `subscription.status='active'`, `membershipPaidThisYear=true`,
    `lastMembershipPaymentYear=année`, `endDate=+1 an`, compteurs remis à 0, chaque personne active
    marquée `membershipCoveredThisYear=année` (`membershipService.ts:104-141`).
  - Prélèvement échoué (`handleFailedPrelevement`) : incrément `missedRemindersCount` ; au **1er**
    échec, transaction `debit/failed`, `scheduledDeactivationDate = +25 jours`, email d'avertissement ;
    à chaque échec, email « prélèvement échoué » (`subscriptionService.ts`).
  - Idempotence annuelle : on saute si déjà payé pour l'année (`membershipService.ts:85-89`).
  - Réactivation manuelle (`reactivateUserAccount`) : marque l'adhésion **payée pour l'année sans
    paiement réel** (`membershipService.ts:285-286`).
- **Intégrations** : email (succès, avertissement, désactivation).

### 4.5 Fonds RPN (couverture décès) & synchronisation notrerpn.org
- **But** : gérer l'adhésion de chaque personne (principal + personnes à charge, **indépendamment**)
  au fonds de solidarité décès, la maintenir en phase avec la plateforme notrerpn.org, et gérer les
  soldes insuffisants.
- **Entités** : `Subscription.rpnStatus`, `rpnEnrollmentDate`, `missedRpnRemindersCount` (compteur
  indépendant du membership), `rpnExternalReference`, `rpnMatricule` (`userModel.ts:205-221`) ; mêmes
  champs par `FamilyMember`.
- **Personnes couvertes** (`utils.calculateTotalPersons:175-188`) : le principal compte pour 1 sauf
  `rpnStatus ∈ {not_enrolled, unsubscribed}` ; chaque personne à charge compte sauf ces deux statuts ;
  les données legacy (`rpnStatus` undefined) sont **comptées** comme couvertes. C'est la base de calcul
  de tous les montants RPN (seuil minimum, prélèvement décès).
- **Cycle de vie** (`rpnLifecycleService.ts`, autorité unique) :
  - Après tout crédit RPN (`onRpnPaymentConfirmed`) : ne rien faire si `nouveauSolde < totalPersonnes ×
    minimumBalanceRPN` (`:136-139`) ; sinon selon `rpnStatus` → inscription initiale / réactivation /
    inscription des personnes à charge en attente.
  - Inscription atomique du principal (`enrollRpnMember`), puis pré-marquage `pending` des personnes à
    charge actives sans référence, puis appel externe `enrollOnExternalPlatform` et persistance de la
    référence/matricule (`:164-215`).
  - Solde insuffisant (`onRpnBalanceInsufficient`) : incrément `missedRpnRemindersCount` ; au 1er échec,
    transaction `debit/failed`, `scheduledDeactivationDate = +7 jours`, email d'avertissement ;
    désinscription (`unsubscribeFromRpn`) quand le compteur atteint `maxMissed` (`:263-316`).
  - La désinscription du principal **n'affecte pas** les personnes à charge (couverture indépendante,
    `:297-301`).
  - Opt-out / opt-in RPN volontaire du principal : `PATCH /api/users/:userId/rpn-primary`
    (`userRouter.ts:721-770`) ; des personnes à charge : détecté par comparaison avant/après dans
    `onFamilyMemberRpnStatusChanged` / `onFamilyMemberStatusChanged`.
- **Intégration notrerpn.org** (`rpnExternalPlatformService.ts` + `rpnHttpClient.ts`) :
  - Auth `POST /users/login` (`EXTERNAL_APP_EMAIL/PASSWORD`), token JWT mis en cache jusqu'à
    expiration.
  - `GET /users/me` (réf. admin si `RPN_ADMIN_REFERENCE` absent), `POST /members` (créer un membre),
    `PUT /members/admin/activate` (activer/désactiver).
  - Tables de correspondance : genre (défaut MALE), relation (`Conjoint(e)`→HUSBAND_WIFE,
    parents→PARENT, autre→SON_DAUGHTER), pays FR→ISO alpha-2, code postal→province/ville (défaut
    QC/Montréal), type RESIDENT/VISITOR. `identification_type` figé à `PASSPORT`, relation du principal
    = `RPN_DEFAULT_RELATIONSHIP` (défaut `FRIEND`). Les personnes à charge héritent pays/ville/email du
    principal.
  - Appels externes en **fire-and-forget** (`.catch` de log) ; en cas d'échec d'inscription, email à
    l'admin. Échecs de (dé)réactivation seulement journalisés.
- **Outils admin** : `GET /api/users/admin/rpn-pending` (membres bloqués), `POST /api/users/admin/rpn-sync/:userId`
  (réinscription manuelle principal/famille), `POST /api/users/:userId/retry-rpn-family/:memberId`,
  `POST /api/users/admin/backfill-rpn-status` (migration).

### 4.6 Transactions & facturation
- **But** : orchestrer, côté serveur, tout le cycle de vie financier (dépôts Interac, validation admin,
  échec, rejet, remboursement) et appliquer les effets sur les comptes.
- **Entité `Transaction`** (`transactionModel.ts`) : userId, amount, `type` (debit|credit),
  `fundType` (membership|rpn|both), membershipAmount, rpnAmount, reason, refInterac,
  `status` (pending|awaiting_payment|completed|success[legacy]|failed|rejected|refunded, défaut
  `completed`), balanceApplied, refundedAmount, horodatages, processedBy,
  `partialCoverage[]` ({memberId, services:('membership'|'rpn')[]}).
- **Machine à états** (`transactionService.ts`, `TransactionDomainService`) :
  - Statut initial (`resolveStatusOnCreate:726-737`) : débit → `completed` ; crédit avec `amount>0` et
    `refInterac` → `pending` ; sinon crédit → `awaiting_payment`.
  - Transitions autorisées : `pending` → confirm(`completed`) / reject / fail ; `completed` → refund ;
    `awaiting_payment` bloque `process` ; états finaux (failed/rejected/refunded) → aucune transition
    (409).
  - `apply` (confirmation) : crédite `membership_balance` et/ou `rpn_balance`, `paymentMethod='interac'`,
    `isAwaitingFirstPayment=false`, ajoute la ligne Interac si absente, active l'adhésion si
    `membershipAmount>0`, déclenche l'inscription RPN si `rpnAmount>0`, marque `balanceApplied`
    (`:508-568`). Idempotent (`balanceApplied===true` → skip).
  - Invariant `fundType=both` : `membershipAmount + rpnAmount == amount` (tolérance 0,001)
    (`:1023-1034`).
  - **Remboursement** (`refundCompletedTransaction:621-686`) : **partie RPN uniquement**, total ou
    partiel, plafonné à `rpnAmount − déjàRemboursé` ; la partie adhésion n'est jamais remboursable.
  - Rejet → email « paiement rejeté » ; `rollbackAppliedCredit` décrémente les soldes.
- **Facturation (client)** :
  - `Billing` (`/billing`) : sélection par personne des services (adhésion + RPN, RPN désactivé si
    adhésion non sélectionnée), soumission d'un crédit Interac avec `fundType` + `partialCoverage`.
  - `BillingPartiel` (`/billing-partiel`) : facturation complémentaire des membres ajoutés en cours
    d'année (`membershipCoveredThisYear === null`).
  - **Barème (voir §0 pour la règle confirmée)** — à la **création**, par personne active : `10$`
    traitement + adhésion profession (`étudiant/sans emploi 25$`, `travailleur 50$`, `mineur 0$`) +
    RPN (min `20$`). Au **renouvellement** (facturé, **non prépayé**), par personne active : `5$` de
    gestion **+ adhésion selon profession** *(correction 2026-07-05, cf. §0)*. Le barème client actuel (`lib/fees.ts` : 80$/55$/30$ décomposés 50-10-20 /
    25-10-20 / 0-10-20) ne modélise que le cas **création** et devra être remplacé par un barème unique
    piloté par les paramètres serveur, distinguant création vs renouvellement. La nouvelle app doit
    ajouter la catégorie de profession **« sans emploi »** (facturée au tarif étudiant `25$`).
- **Intégrations** : email (succès adhésion, rejet).

### 4.7 Annonces de décès (prélèvement du fonds RPN)
- **But** : lors d'un décès communautaire, prélever le montant de solidarité sur le solde RPN de tous
  les membres principaux et les notifier.
- **Entité `DeathAnnouncement`** (`deathAnnouncement.ts`) : firstName, deathPlace, deathDate,
  `processingStatus` (pending|processing|completed|failed), horodatages, `processingSummary`
  (totalUsers, debitedCount, expectedAmount, collectedAmount, insufficientFundsCount,
  missingAccountCount, systemErrorCount), `processingErrors[]` (≤ 20 échantillons).
- **Traitement** (`deathAnnouncementService.processDeathAnnouncement`) :
  - Montant par personne = `settings.amountPerDependent` (> 0 requis, sinon annonce `failed`).
  - Population : `primaryMember:true` et non supprimés ; `totalDû = totalPersonnes × montant`.
  - Solde suffisant → débit en masse (`$inc rpn_balance`) + transaction `debit` (statut par défaut
    `completed`) ; solde insuffisant → `onRpnBalanceInsufficient` (compteur, désinscription
    éventuelle), concurrence limitée à 5.
  - File d'attente **sérialisée en mémoire** (`_processingChain`) ; idempotence via `processingStatus`.
  - Notification email à tous les membres (concurrence 10).
- **Intégrations** : email (annonce), notrerpn.org (désinscription indirecte via solde insuffisant).

### 4.8 Paramètres, parrainage, événements, upload
- **Paramètres** (`Settings`, singleton) : montants et seuils ci-dessus ; `GET /api/settings/current`,
  `PUT /api/settings/:id`.
- **Parrainage** : `referralCode` / `referredBy` sur `User` ; liste des filleuls
  `GET /api/users/:referredBy/referral` ; écran `Sponsorship`.
- **Événement Fête de Noël 2025 + Menu mariage — 🚫 À RETIRER (voir §0)** : documentés ici pour
  mémoire uniquement. `ReservationEntity` (`feteNoel2025Model.ts`) : forfait, titulaire +
  accompagnateurs, code Interac, montants ; CRUD + emails. Prix entièrement fournis par le client
  (aucune validation serveur). Module hors périmètre de la réécriture.
- **Upload** : `POST /api/upload` streame un fichier vers Cloudinary (aucune auth, aucune validation
  de type/taille).

### 4.9 Emails (transversal)
Tous via `mailer/core.ts::sendEmail` (nodemailer/SMTP). Types : réinitialisation & mot de passe
temporaire, notification nouveau membre (admin), avertissement de désactivation, compte désactivé,
désinscription/réactivation RPN, solde bas, annonce de décès, succès d'adhésion, paiement rejeté,
prélèvement échoué (adhésion / décès), échec d'inscription externe (admin), réservation créée/remboursée
(module événement à retirer).
Chaque email inclut 3 images inline (drapeau, logo, armoiries). Liens pointant vers
`https://www.acq-rpn.org/...`.

### 4.10 Parrainage-réduction & promotion d'une personne à charge (NOUVEAU — à implémenter)

> Fonctionnalités **décidées** (BESOIN_AFFAIRE §9 et §11) mais **absentes du code actuel** (le
> parrainage n'y stocke qu'un `referredBy`/`referralCode` sans aucune réduction).

- **Parrainage-réduction** :
  - Déclencheur : un visiteur s'inscrit via le **lien** du parrain ou saisit son **code** au
    formulaire → le parrainage est **enregistré et horodaté**.
  - Éligibilité : le filleul doit **payer sa cotisation et devenir actif** ; sinon **aucune réduction**.
  - Effet : **-50 % sur la cotisation d'adhésion du parrain** au **renouvellement de l'année suivante**.
    Réductions **cumulables** par filleul actif, jusqu'au **maximum des adhésions du foyer** du parrain
    (personnes à charge incluses). **Non reportable** au-delà d'un an, **non rétroactive** (un filleul
    qui paie après le renouvellement du parrain reporte l'avantage à l'année d'après).
  - Concrètement : -50 % de l'adhésion selon profession = **12,5$ / 12,5$ / 25$** (étudiant-sans
    emploi-parent résident / … / travailleur) par filleul actif.
  - UI : le parrain **voit la liste de ses filleuls** et le **montant de réduction prévu** pour son
    prochain renouvellement. Réduction **appliquée automatiquement** à la génération de la facture.
    L'administration peut **corriger/annuler** un parrainage.
- **Promotion d'une personne à charge en titulaire** :
  - Déclencheur : **un administrateur** promeut une personne à charge (enfant devenu adulte, conjoint
    séparé) en titulaire (opération **réservée à l'admin**).
  - Règles : elle **conserve son matricule `notrerpn.org` et sa couverture si elle est active**, **mais
    son solde RPN NE suit PAS** — le nouveau foyer **repart à 0 $** et doit **re-provisionner 20 $
    minimum** ; son **historique n'est pas transféré** ; le **titulaire d'origine cesse de payer/porter**
    cette personne.

## 5. Routes / URLs

### 5.1 Frontend (SPA — `client/src/main.tsx`)
**Publiques** : `/` (accueil), `/login`, `/forgot-password`, `/reset-password/:id/:token`,
`/register` + `/register/:id/:ref`, `/origines`, `/infos`, `/urgence`, `/about`, `/contact-us`,
`/conditions`, `/account-deactivated`, `/menu-mariage` (à retirer), `/reserver-fete-fin-annee`
(à retirer), `/liste-reservations` (**non protégée — anomalie §7 ; à retirer**), `*` (404).
**Membre connecté** (`ProtectedRoute`) : `/profil`, `/profil/couverture`, `/profil/dependents`,
`/profil/sponsorship`, `/summary`, `/payment-method`, `/billing`, `/billing-partiel`, `/faq`,
`/change-method`, `/transactions/:id/all`, `/announcements`.
**Admin** (`AdminRoute`) : `/admin/accounts`, `/admin/accounts/:userId/profile`, `/admin/announcements`,
`/admin/transactions`, `/admin/relancer-rpn-en-echec`.

### 5.2 API backend (préfixe `/api`)

**`/api/users`** — P=public, U=isAuth, A=isAuth+isAdmin
| Méthode | Chemin | Accès |
|---|---|---|
| POST | `/generate-token` | P |
| POST | `/verify-token` | P |
| POST | `/reset-password/:id/:token` | P |
| POST | `/send-password` | P |
| POST | `/new-user-notification` | P |
| POST | `/forgot-password` | P |
| POST | `/login` | P |
| POST | `/register` | P |
| GET | `/all` | A |
| PUT | `/:id` | **U** (met à jour n'importe quel user — anomalie §7) |
| GET | `/:referredBy/referral` | U |
| GET | `/:id` | U |
| DELETE | `/:id` | A |
| PUT | `/deactivate/:id`, `/reactivate/:id`, `/admin/:id` | A |
| POST | `/admin/backfill-rpn-status`, `/:userId/retry-rpn-family/:memberId`, `/admin/rpn-sync/:userId` | A |
| PATCH | `/:userId/rpn-primary` | U |
| GET | `/admin/rpn-pending` | A |

**`/api/accounts`** : POST `/new` (**P**), GET `/all` (**P** — auth commentée), GET `/:userId/all`
(**P**), PUT `/:id` (U), POST `/:id/balance-correction` (U), GET `/:id` (U).
**`/api/transactions`** : POST `/new` (**P**), POST `/manual-reminders` (A), GET `/all` (A),
GET `/summary` (A), DELETE `/delete-zero-amount` (**P**), GET `/:userId/all` (**P**), PUT `/:id` (A),
POST `/:id/confirm|reject|fail|process|refund` (A), DELETE `/:id` (A), POST `/manual-payment/:id` (A),
POST `/manual-balance-reminder/:id` (A).
**`/api/settings`** : PUT `/:id` (**P** — auth commentée), GET `/current` (**P**).
**`/api/upload`** : POST `/` (**P**, multer).
**`/api/announcements`** : POST `/new` (A), POST `/batch` (A), GET `/all` (**P**), PUT `/:id` (**P**),
GET `/summary` (**P**).
**`/api/reservations`** (module à retirer) : POST `/new`, GET `/all`, POST `/:id/confirm`,
PATCH `/:id/amount`, DELETE `/:id` — **toutes publiques**.
**Divers** : `GET /api/ping`, `/robots.txt`, `/sitemap.xml`, catch-all `*` → SPA.

## 6. Processus non-UI

### 6.1 Tâches planifiées (`cron/membershipReminder.ts`, node-cron, chargées à l'import)
| Job | Planification | Déclenche | Données lues/modifiées | Externe |
|---|---|---|---|---|
| Cotisation annuelle | `0 10 * 1 0` (dimanches de janvier, 10h) | `processAnnualMembershipPayment()` | Lit tous les users non supprimés + settings + comptes ; débite `membership_balance`, crée transactions, met à jour `subscription`, marque `membershipCoveredThisYear` | Email |
| Désactivation comptes inactifs | `0 5 * * *` (chaque jour 5h) | `processInactiveUsers()` | Users `status ∈ {active, registered}` avec `scheduledDeactivationDate ≤ now` → `status='inactive'` | Email |
| Rappel solde RPN | `0 9 * * 0` (dimanches 9h) | Actuellement **DÉSACTIVÉ** (commenté, `:14-19`) → **à réactiver tel quel** dans la nouvelle app (voir §0). `checkMinimumBalanceAndSendReminder()` : email si `rpn_balance ≤ personnes × minimumBalanceRPN` | Comptes, users | Email |

### 6.2 Traitement asynchrone à la demande
- **Prélèvement décès** — déclenché par `POST /api/announcements/new` et `/batch` (pas un cron) ;
  file d'attente **en mémoire** (`_processingChain`, `deathAnnouncementService.ts:382`). Débite le
  solde RPN de tous les membres principaux, insère les transactions de débit, gère les soldes
  insuffisants (compteur + désinscription), notifie tous les membres. **Perdu au redémarrage** (aucune
  persistance de la file).

### 6.3 Webhooks entrants
**Aucun.** Les paiements Interac sont confirmés manuellement par un admin ; toute communication
externe (notrerpn.org, Cloudinary, SMTP) est **sortante**.

### 6.4 Scripts de migration / correction (routes admin one-shot)
- `POST /api/users/admin/backfill-rpn-status` (dérive `rpnStatus` legacy), `POST /:id/balance-correction`
  (fixe les soldes + transaction de correction), `DELETE /api/transactions/delete-zero-amount`.

### 6.5 Journalisation
Winston + rotation quotidienne ; `initLogger()` redirige tous les `console.*` vers des fichiers
`logs/%DATE%.log` (info) et `.error.log`, rétention 24 mois.

## 7. Besoins reformulés

> Reformulation **positive** (ce que le système DOIT faire), avec la référence au comportement actuel.

**Sécurité & contrôle d'accès**
1. Le système DOIT interdire toute auto-attribution du rôle administrateur : le rôle ne peut être
   défini qu'explicitement par un admin, jamais accepté dans le corps d'une requête d'inscription.
   *(réf. `userRouter.ts:298,335`)*
2. Un utilisateur connecté ne DOIT pouvoir modifier que **son propre** profil, et uniquement des
   champs autorisés (jamais `isAdmin`, `subscription`, soldes, références RPN) ; les modifications de
   comptes tiers sont réservées aux admins. *(réf. `PUT /api/users/:id` isAuth seul + `Object.assign(user, req.body)`, `userRouter.ts:396-411`)*
3. Le secret JWT DOIT être obligatoire et provenir exclusivement de la configuration ; aucune valeur
   par défaut codée en dur ne doit exister. *(réf. `'ddlfjssdmsmdkskm'`, `userRouter.ts:114,129,147`)*
4. Les identifiants SMTP et tout secret DOIVENT provenir de variables d'environnement ; aucun mot de
   passe ne doit être présent dans le code source. *(réf. mot de passe Gmail en dur, `mailer/core.ts`)*
5. La réinitialisation de mot de passe DOIT lier le jeton à l'utilisateur cible (le `_id` du jeton
   doit correspondre à l'`:id` de l'URL). **Aucune règle de robustesse du mot de passe ne doit être
   imposée** (décision propriétaire : public peu habitué). *(réf. `userRouter.ts:140-167`)*
6. Toutes les routes de gestion (comptes, transactions, paramètres, annonces, réservations, upload)
   DOIVENT être protégées par authentification et, le cas échéant, par le rôle admin ; aucune route
   d'administration ne doit être publique. *(réf. middlewares commentés/absents : `settingRouter`,
   `uploadRouter`, `reservationRouter`, `accountRouter` `/all` et `/new`, `transactions/new`,
   `announcements` lecture/écriture, page `/liste-reservations`)*
7. Le contrôle du rôle admin DOIT s'appuyer sur l'état courant en base, pas uniquement sur le contenu
   du JWT, afin qu'une révocation prenne effet immédiatement. *(réf. `isAdmin` lit `req.user.isAdmin`
   du token, `utils.ts:119-133`)*
8. Le système NE DOIT PAS journaliser les jetons d'authentification en clair. *(réf. `utils.ts:63`)*
9. Le cache d'authentification DOIT être partagé entre les requêtes et NE DOIT PAS prolonger la durée
   de vie réelle d'un jeton au-delà de son expiration. *(réf. cache ré-instancié par requête et
   expiration recalculée, `utils.ts:57-86`)*
10. L'upload de fichiers DOIT être authentifié et valider le type et la taille des fichiers.
    *(réf. `uploadRouter.ts`)*
11. Le CORS DOIT autoriser l'origine de production configurable, pas seulement `localhost`.
    *(réf. `index.ts:34`)*
12. Le paiement par carte de crédit DOIT être **entièrement retiré** (décision propriétaire) ; seul
    Interac est conservé. Le schéma `Card` et tout stockage de numéro/CVV disparaissent.
    *(réf. `accountModel.ts:15-33`)*

**Cohérence métier**
13. Un seul barème de montants (adhésion travailleur/étudiant, part de solidarité par personne, seuil
    minimum RPN, nombre maximal de rappels) DOIT faire autorité, partagé entre serveur et client, avec
    une **valeur par défaut unique** en l'absence de configuration. *(réf. `maxMissedReminders` = 5
    dans le modèle mais `?? 3` / `|| 3` dans les services — `deathAnnouncementService.ts:481`,
    `checkMinimumBalanceAndSendReminder.ts:41` ; et divergence barème client `lib/fees.ts` vs serveur)*
14. La lecture d'un paramètre numérique DOIT distinguer « non configuré » d'une valeur `0` (utiliser
    une coalescence nulle, pas `||`). *(réf. mélange `??` / `||`, ex. `membershipService.ts:159`)*
15. Le délai de désactivation après un prélèvement échoué DOIT être défini par une règle unique et
    explicite (et séparé entre adhésion et RPN de façon intentionnelle et documentée). *(réf. 25 jours
    adhésion `subscriptionService.ts:31` vs 7 jours RPN `rpnLifecycleService.ts:283`, partageant le
    **même** champ `scheduledDeactivationDate`)*
16. Une insuffisance du fonds RPN NE DOIT PAS entraîner la désactivation de l'adhésion, et
    inversement : les deux cycles de vie étant indépendants, ils DOIVENT utiliser des champs/dates de
    désactivation distincts. *(réf. champ unique `subscription.scheduledDeactivationDate` écrit par les
    deux chemins ; `processInactiveUsers` désactive tout le compte)*
17. La détermination des personnes couvertes par le RPN (`calculateTotalPersons`) et des personnes
    facturées pour l'adhésion DOIVENT reposer sur des critères cohérents et explicites concernant le
    `status` (actif/inactif) **et** le `rpnStatus`. *(réf. `calculateTotalPersons` ignore `status` et
    ne regarde que `rpnStatus`, `utils.ts:175-188`, alors que la facturation adhésion exige
    `status==='active'`)*
18. Le montant d'une transaction/paiement DOIT être recalculé et validé côté serveur à partir du
    barème officiel ; le montant fourni par le client ne doit jamais être approuvé tel quel. *(réf.
    prix client non validés, `reservationFeteNoel2025Service.ts` — module retiré, mais principe à
    appliquer à toute la facturation)*
19. Les données de contexte (dates, montants de référence) DOIVENT provenir de la configuration ou des
    données, pas de constantes figées dans le code. *(réf. `eventDate` codé en dur au 2025-12-20)*
20. La réactivation d'un compte NE DOIT accorder une année d'adhésion payée que si un paiement a
    réellement été enregistré (ou selon une règle explicite d'exonération admin tracée). *(réf.
    `reactivateUserAccount` marque `membershipPaidThisYear=true` sans paiement, `membershipService.ts:285-286`)*

**Intégrité transactionnelle**
21. Tous les mouvements d'argent DOIVENT passer par un chemin unique et transactionnel appliquant les
    mêmes invariants (comptabilisation `balanceApplied`, machine à états) ; le prélèvement décès NE
    DOIT PAS contourner ce chemin. *(réf. `deathAnnouncementService.applyDebitCandidates` fait un
    `$inc` direct + transactions `completed` par défaut)*
22. L'annulation (rejet/échec) d'un crédit déjà appliqué DOIT annuler **tous** ses effets, y compris
    l'activation de l'adhésion et l'inscription RPN, pas seulement les soldes. *(réf.
    `rollbackAppliedCredit` ne touche que les soldes, `transactionService.ts:578-611`)*
23. L'inscription du membre principal sur notrerpn.org NE DOIT être marquée `enrolled` en base
    qu'après confirmation de la référence externe, afin de ne jamais laisser un principal `enrolled`
    sans `rpnExternalReference` (ce qui bloque l'inscription des personnes à charge). Les appels
    externes DOIVENT être fiabilisés (attente/retry/idempotence) plutôt que fire-and-forget.
    *(réf. `rpnLifecycleService.ts:154-156,194-214`)*
24. La file de traitement des prélèvements décès DOIT être **persistée** et reprenable après
    redémarrage, avec idempotence et journal d'exécution. *(réf. `_processingChain` en mémoire)*

**Qualité / dette**
25. La logique d'activation d'adhésion DOIT être unifiée en un seul endroit (aujourd'hui dupliquée
    entre `processAnnualMembershipPayment`, `processMembershipForUser`, `reactivateUserAccount` et
    `transactionService.activateMembership`).
26. Les utilitaires partagés (échappement regex, calculs d'âge, règles de facturation) DOIVENT être
    factorisés et couverts par des tests unitaires ; la logique métier NE DOIT PAS être dupliquée
    entre client et serveur sans source unique. *(réf. `escapeRegex` dupliqué ; règles de facturation
    en double `membershipService.ts` / `userRouter.isMemberBillable` / `client/lib/familyMemberRules.ts`)*
27. Le code mort DOIT être supprimé *(réf. `deactivateFamilyMembers`, `getRpnBalance`, `account.solde`,
    blocs commentés)* et les traces de débogage verbeuses retirées de la production *(réf. `console.log`
    dans `transactionService.apply`/`activateMembership`)*.
28. L'âge DOIT être calculé à partir de la date de naissance complète, pas seulement de l'année.
    *(réf. `membershipService.ts:39,50`)*
