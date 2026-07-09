# FONCTIONNEL_PAGES — `mon-rpn-react`

> Documentation page par page de chaque URL front accessible (SPA React Router,
> `client/src/main.tsx`). Complète [FONCTIONNEL_GLOBAL.md](FONCTIONNEL_GLOBAL.md) (§5.1).
> La « Méthode » est **GET** (navigation navigateur) : le SPA charge le composant, les actions
> internes appellent ensuite l'API. La route `/payment-method` est **exclue** (retirée du produit).
>
> **Rappels transverses**
> - **Auth token** : injecté par l'intercepteur axios depuis `localStorage.userInfo.token`
>   (`apiClient.ts:11-21`). Base URL `http://localhost:5010` en dev, `/` en prod.
> - **Garde membre** `ProtectedRoute` : sans `userInfo` → `/login?redirect=<url>` ; si
>   `subscription.status === 'inactive'` → `/account-deactivated` ; rafraîchit le compte
>   (`GET /api/accounts/:userId/all`) et applique la redirection « premier paiement ».
> - **Garde admin** `AdminRoute` : rend la page si `userInfo.isAdmin`, sinon `/login?redirect=<url>`.
> - **Redirection premier paiement** (`useAwaitingFirstPaymentRedirect`) : si le compte est
>   `isAwaitingFirstPayment`, toute page hors `['/profil/dependents','/billing','/payment-method']`
>   (ou `/summary?payment=submitted`) redirige vers `/profil/dependents?onboarding=1`.

---

## Pages publiques (aucune authentification)

### GET /
- **Objectif fonctionnel** : page d'accueil marketing publique de l'association (ACQ/RPN).
- **Accès** : public. Rendue dans le layout `App` (avec `Announcement` + `Header` + `Footer`).
- **Données affichées** : contenu statique via sous-sections (`CarouselPlugin`, `InfoSection`,
  `EngagementSection`, `RejoinsSection`, `BannerSection`, `CardsSection`). Balises SEO (`title`,
  `description`). Aucune donnée API.
- **Actions possibles** : liens de navigation (via `Header`) vers connexion/inscription et pages
  publiques ; appels à l'action « Rejoindre ». Aucune mutation.
- **Règles de validation** : aucune.
- **États particuliers** : aucun (contenu statique).
- **Dépendances** : composants de présentation uniquement.
- **Comportement attendu (reformulé)** : —

### GET /login
- **Objectif fonctionnel** : authentifier un membre existant.
- **Accès** : public. Si `userInfo` déjà présent → redirection immédiate vers `redirect` (défaut
  `/summary`) via `useEffect`.
- **Données affichées** : formulaire email / mot de passe / case « Se souvenir de moi ». Lien
  « mot de passe oublié » et bouton « créer un compte » (→ `/register`).
- **Actions possibles** :
  - Soumission → `POST /api/users/login` (`useLoginMutation`). Succès : dispatch `USER_LOGIN`,
    écriture `localStorage.userInfo`, toast, navigation vers `redirect` (`?redirect=` ou `/summary`).
  - Lien `/forgot-password` ; bouton `/register`.
- **Règles de validation** : **client (zod)** email valide ; mot de passe ≥ 6 caractères.
  `rememberMe` bool. **Serveur** : email (minuscule) + bcrypt ; 401 si invalide.
- **États particuliers** : `isPending` → `<Loading/>` remplace le bouton ; échec → toast
  « Email ou Mot de passe incorrect ».
- **Dépendances** : `userHooks`, Store, i18n.
- **Comportement attendu (reformulé)** : —

### GET /forgot-password
- **Objectif fonctionnel** : demander un courriel de réinitialisation de mot de passe.
- **Accès** : public.
- **Données affichées** : champ email unique.
- **Actions possibles** : soumission → `POST /api/users/forgot-password` (`useForgotPasswordMutation`).
  Succès : toast « Consultez vos emails » (le serveur envoie le lien avec un jeton 1 h).
- **Règles de validation** : **client** email valide (zod). **Serveur** : renvoie 404 si email
  introuvable (le front affiche néanmoins un toast d'erreur générique).
- **États particuliers** : `isPending` → `<Loading/>`.
- **Dépendances** : `userHooks`, mailer serveur.
- **Comportement attendu (reformulé)** : pour ne pas révéler l'existence d'un compte, la page DOIT
  afficher un message neutre identique que l'email existe ou non (aujourd'hui un email inexistant
  renvoie 404 et un toast d'erreur distinct).

### GET /reset-password/:id/:token
- **Objectif fonctionnel** : définir un nouveau mot de passe à partir du lien reçu par courriel.
- **Accès** : public (autorisé par le jeton dans l'URL).
- **Données affichées** : champs « mot de passe » + « confirmation ». `id` et `token` proviennent de
  l'URL (`useParams`).
- **Actions possibles** : soumission → `POST /api/users/reset-password/:id/:token`
  (`useResetPasswordMutation`). Succès : `USER_SIGNOUT`, purge `localStorage.userInfo`, navigation
  `/login`, toast de réussite.
- **Règles de validation** : **client** : chaque champ ≥ 6 caractères ; égalité `password ===
  confirmPassword` (sinon toast + surlignage). **Serveur** : vérifie la signature du jeton et
  recompare password/confirm.
- **États particuliers** : `isPending` → `<Loading/>` ; mots de passe différents → toast destructif.
- **Dépendances** : `userHooks`, Store.
- **Comportement attendu (reformulé)** : le jeton DOIT être lié à l'utilisateur cible (le `_id` du
  jeton doit correspondre au `:id`) ; **aucune règle de robustesse** n'est imposée sur le mot de passe
  (décision propriétaire). (cf. FONCTIONNEL_GLOBAL §7-5)

### GET /register  •  GET /register/:id/:ref  *(Assistant d'inscription — Étape 1/4)*
- **Objectif fonctionnel** : démarrer la création de compte (identifiants + occupation), capter un
  éventuel parrainage.
- **Accès** : public. `:id/:ref` = lien de parrainage.
- **Données affichées** : email ; sélecteur occupation (`student`/`worker`). Si étudiant :
  établissement (liste + « autre »), n° étudiant, statut (temps plein/partiel). Si travailleur : champ
  métier. Case d'acceptation des conditions (ouvre `ConditionsModal`); code parrainage(facultatif). Indicateur d'étape
  (`CheckoutSteps step1`).
- **Actions possibles** :
  - Soumission → génère un mot de passe aléatoire (`PasswordGenerator`), appelle
    `POST /api/users/generate-token` (`useGenerateTokenMutation`), navigation `/origines`.
  - Lien vers `/login`.
- **Règles de validation** : **client (zod)** : email valide ; occupation ∈ {student, worker} ;
  conditions obligatoires (blocage + surlignage si non cochées). Autres champs optionnels.
- **États particuliers** : sélection occupation ouvre/masque les sous-champs ; modale conditions.
- **Dépendances** : `userHooks` (generate-token), Store, `academicInstitutionsList`.
- **Comportement attendu (reformulé)** : ajouter la profession **« sans emploi »** (tarif étudiant)
  au sélecteur d'occupation (cf. FONCTIONNEL_GLOBAL §0). Le champ `isAdmin` ne doit jamais être
  déterminé côté client.

### GET /origines  *(Étape 2/4)*
- **Objectif fonctionnel** : saisir l'identité civile du titulaire.
- **Accès** : public, mais dépend des données d'étape 1.
- **Données affichées** : prénom, nom, date de naissance (calendrier 1930→aujourd'hui), sexe (M/F),
  pays d'origine (défaut Cameroun). `CheckoutSteps
  step2`.
- **Actions possibles** :
  - Soumission → navigation `/infos`.
  - « Précédent » → navigation `/register` et voir les données précedemment saisie.
- **Règles de validation** : **client (zod)** : prénom/nom ≥ 3 caractères, pays ≥ 3, sexe requis,
  date naissance requise. **Contrôle métier** : ≥ 18 ans (année seulement) sinon message sous l'input; 
  Se rassurer que le nom est identique à une pièce d'identité légale(passport, carte étudiant, 
  permis de conduire, acte naissance, RAMQ, ...) ou promettre qu'il est conforme à celui du passeport.[raison, plusieurs ne saisie pas leur noms comme il se doit et difficile à identifier]
- **États particuliers** : jeton invalide/absent → simple `console.log` (pas de blocage visible).
- **Dépendances** : `userHooks` (verify-token), `countries`.
- **Comportement attendu (reformulé)** : l'âge DOIT être calculé sur la date complète (pas l'année) ;
  un jeton d'inscription invalide DOIT bloquer la progression avec un message clair plutôt que de
  continuer silencieusement.

### GET /infos  *(Étape 3/4)*
- **Objectif fonctionnel** : saisir les coordonnées et le statut de résidence.
- **Accès** : public, dépend des étapes précédentes  1 et 2.
- **Données affichées** : téléphone, adresse, code postal, pays de résidence (défaut Canada), statut
  de résidence (défaut résident permanent), case « possède une assurance ». `CheckoutSteps step3`.
- **Actions possibles** :
  - Soumission → normalise téléphone + code postal, navigation `/urgence`.
  - « Précédent » → navigation `/origines` + voir les données précedemment saisie.
- **Règles de validation** : **client (zod)** : pays ≥ 4 caractères, statut requis, code postal
  conforme (`postalCodeRegex`), adresse ≥ 3, téléphone conforme (`telRegex`).
- **États particuliers** : aucun spécial.
- **Dépendances** : Store, `constant` (regex/pays/statuts), `phone.validation`.
- **Comportement attendu (reformulé)** : —

### GET /urgence  *(Étape 4/4 — finalisation serveur)*
- **Objectif fonctionnel** : saisir jusqu'à 2 contacts d'urgence et **créer réellement le compte**.
- **Accès** : public, dépend des 3 étapes précédentes.
- **Données affichées** : 2 blocs (nom + téléphone) de contact d'urgence. `CheckoutSteps step4`.
  Dialogue de succès (`NextStepsDialog`) après création.
- **Actions possibles** (`Urgence.logique.ts`) :
  - Soumission → vérifie complétude des 3 étapes + `verify-token` ; appelle
    `POST /api/users/register` (`useRegisterMutation`) avec `isAdmin:false`, `primaryMember:true`,
    `familyMembers:[]`, `referredBy` ; puis `createAwaitingInteracAccount` →
    `POST /api/accounts/new` + `POST /api/transactions/new` (compte « en attente 1er paiement » +
    transaction en attente) ; puis `POST /api/users/send-password` (envoi du mot de passe) et
    `POST /api/users/new-user-notification` (alerte admin). Dispatch `USER_SIGNUP` + `ACCOUNT_INFOS`,
    MAJ `localStorage`, ouverture du dialogue de succès.
  - Dialogue de succès : « Ajouter votre famille » → `/dependents?onboarding=1` (ou `?redirect=`) ;
    « Je suis seul » → URL de paiement `both` (`buildBillingPaymentUrl`).
  - « Précédent » → `/infos`.
- **Règles de validation** : **client (zod superRefine)** : pour chaque contact, nom et téléphone
  doivent être renseignés **ensemble** (ou aucun des deux). **Serveur** : conflits d'inscription
  (email déjà utilisé, ou nom+téléphone sous un autre email) → 409 mappé en toast.
- **États particuliers** : `isSubmitting` → `<Loading/>` ; jeton absent/invalide → toast bloquant ;
  informations manquantes → toast ; erreurs axios → toast (`resolveRegistrationErrorToast`).
- **Dépendances** : `userHooks`, `accountHooks`, `transactionHooks`, `lib/interacAccount`,
  `lib/billing`, mailer serveur.
- **Comportement attendu (reformulé)** : le rôle `isAdmin` DOIT rester fixé à `false` côté serveur
  quelles que soient les données client. Le lien `/dependents` devrait cibler `/profil/dependents`
  (la route réelle) — **à valider** : `/dependents` seul n'est pas déclaré dans le routeur.

### GET /about
- **Objectif fonctionnel** : présenter l'association (page informative).
- **Accès** : public.
- **Données affichées** : contenu statique. (Non lu en détail — présumé présentation.)
- **Actions possibles** : navigation uniquement.
- **Règles de validation** : aucune.
- **États particuliers** : aucun.
- **Dépendances** : composants de présentation.
- **Comportement attendu (reformulé)** : —

### GET /contact-us
- **Objectif fonctionnel** : page de contact.
- **Accès** : public.
- **Données affichées** : **placeholder** — le composant rend uniquement `<div>Contact</div>`
  (`Contact.tsx`).
- **Actions possibles** : aucune.
- **Règles de validation** : aucune.
- **États particuliers** : page vide.
- **Dépendances** : aucune.

### GET /conditions
- **Objectif fonctionnel** : afficher les conditions d'utilisation / statuts de l'association pour pouvoir s'inscrire.
- **Accès** : public.
- **Données affichées** : texte statique (conditions + statuts).
- **Actions possibles** : lecture / navigation.
- **Règles de validation** : aucune.
- **États particuliers** : aucun.
- **Dépendances** : contenu statique (`conditionUtilisation`, `statutsAssociation`).

### GET /account-deactivated
- **Objectif fonctionnel** : informer un membre que son compte est désactivé.
- **Accès** : public (cible de redirection quand `subscription.status === 'inactive'`).
- **Données affichées** : message statique invitant à contacter l'administration.
- **Actions possibles** : aucune (navigation via header).
- **Règles de validation** : aucune.
- **États particuliers** : page terminale.
- **Dépendances** : `Header`, `Footer`.

### GET /*  (404)
- **Objectif fonctionnel** : page d'erreur pour toute route inconnue.
- **Accès** : public (catch-all).
- **Données affichées** : message 404.
- **Actions possibles** : retour à l'accueil.
- **Règles de validation** : aucune.
- **États particuliers** : c'est l'état d'erreur lui-même.
- **Dépendances** : `Page404`.

---

## Pages membre (garde `ProtectedRoute` — connexion requise)

> Un admin ou membre du bureau connecté accède aussi à ces pages (le contenu est identique ; seul le `Header` ajoute le
> menu admin). Aucune variante de contenu par rôle sur ces pages.

### GET /summary  *(tableau de bord membre)*
- **Objectif fonctionnel** : accueil du membre connecté avec statistiques et raccourcis.
- **Accès** : membre connecté. Cible par défaut après connexion. `?payment=submitted`
  est toléré pendant l'attente du 1er paiement.
- **Données affichées** : salutation (`userInfo.origines.firstName`) ; alerte membres non couverts ;
  section d'ajout de membre ; carte compte (`UserAccountInfo`) ; statistiques décès du mois / total ;
  graphe mensuel ; dernières annonces ; dernières transactions. Source stats :
  `GET /api/announcements/summary` (`useGetSummaryQuery`) ; le reste via sous-composants.
- **Actions possibles** : raccourcis (ajouter un membre, aller à la facturation/couverture) ; aucune
  mutation directe sur la page.
- **Règles de validation** : aucune (lecture).
- **États particuliers** : `summary` absent → compteurs à 0.
- **Dépendances** : `deathAnnouncementHook`, sous-composants dashboard.
- **Comportement attendu (reformulé)** : —

### GET /bureaux
- **Objectif fonctionnel** : Consulte l'ensemble des membres du bureau et les anonces faites par le bureau
- **Accès** : membre connecté.
- **Données affichées** : rapport fin d'année, commnuiqué, statut, activité association de l'année en cours.
- **Actions possibles** (par ligne) :
  - à définir (tu peux suggérer).
- **Règles de validation** : suggère moi des idées.
- **Comportement attendu (reformulé)** : —

### GET /profil
- **Objectif fonctionnel** : consulter ses informations personnelles et de connexion.
- **Accès** : membre connecté.
- **Données affichées** : `ProfilPersonnalInfo` (identité/coordonnées) + `ProfilInfoConnexion`
  (email/connexion), dans `ProfilLayout` (sous-menu profil).
- **Actions possibles** : navigation entre sous-pages du profil ; édition selon les sous-composants
  (à valider — non lus en détail).
- **Règles de validation** : selon sous-composants.
- **États particuliers** : —
- **Dépendances** : `ProfilLayout`, sous-composants profil.
- **Comportement attendu (reformulé)** : —

### GET /profil/couverture
- **Objectif fonctionnel** : visualiser et gérer la couverture (adhésion + RPN) du titulaire et de
  chaque personne à charge. En effet, on peut désinscrire, inscrire qui quonque ici selon le besoin.
- **Accès** : membre connecté.
- **Données affichées** : `GET /api/users/:id` (`useGetUserDetailsQuery`). Une carte par personne
  (`MemberCoverageCard`) : adhésion « incluse » si `status active` ; badge « en attente » si
  `membershipCoveredThisYear === null` ; statut RPN + matricule. Lien « Régulariser la couverture »
  si des membres partiels existent.
- **Actions possibles** :
  - Basculer le RPN du **titulaire** → `PATCH /api/users/:userId/rpn-primary`
    (`useTogglePrimaryRpnMutation`, action `unsubscribe`/`resubscribe`).
  - Basculer le RPN d'une **personne à charge** → `PUT /api/users/:id` (`useUpdateUserMutation`) avec
    le `rpnStatus` modifié (`enrolled`↔`unsubscribed`/`pending`).
  - Désinscription (statut `enrolled`) → **dialogue de confirmation** obligatoire avant l'appel.
  - Liens `/profil/dependents` et `/billing-partiel`.
- **Règles de validation** : bascule possible seulement si statut ∈ {enrolled, unsubscribed}
  (`primaryCanToggle` / `canToggle`).
- **États particuliers** : `isPending` → `<Loading/>` ; `isUpdating` désactive les actions ; erreurs →
  toast axios.
- **Dépendances** : `userHooks`, `usePartialBillingMembers`, `familyMemberRules`.
- **Comportement attendu (reformulé)** : la bascule RPN d'une personne à charge ne devrait pas
  renvoyer l'objet `User` complet en `PUT` (risque de surécriture) ; une API ciblée par membre
  (comme pour le titulaire) DOIT être utilisée. (cf. FONCTIONNEL_GLOBAL §7-2)

### GET /profil/dependents
- **Objectif fonctionnel** : gérer (ajouter / lister / modifier / supprimer / activer-désactiver le membership) les personnes
  à charge ; point d'entrée de l'onboarding « premier paiement ».
- **Accès** : membre connecté. Autorisée pendant l'attente du 1er paiement (`?onboarding=1`).
- **Données affichées** : `GET /api/users/:id` → tableau des `familyMembers` non supprimés (prénom,
  nom, relation, statut de résidence, date de naissance, téléphone [facultatif]). Alerte membres non couverts.
  Carte d'onboarding si `?onboarding=1` ou compte en attente du 1er paiement.
- **Actions possibles** :
  - Ajouter un membre (via `ProfilLayout` / `FamilyMemberFormFields`) — enregistrement par
    `PUT /api/users/:id`.
  - Modifier (icône crayon → modale + `FamilyMemberFormFields` + interrupteur « inclure dans le
    membership » = `status` active/inactive) → `PUT /api/users/:id` (`useUpdateUserMutation`).
  - Supprimer (icône corbeille → modale de confirmation) → retire le membre du tableau et
    `PUT /api/users/:id`.
- **Règles de validation** : **client (zod `familyMemberFormSchema`)** sur le formulaire d'ajout de personne
  à charge (nom, relation, date, statut de résidence, occupation/étudiant, `livesInCanada`, etc.).
- **États particuliers** : `isPending`/`updateLoading` → `<Loading/>` ; suppression irréversible
  confirmée ; toasts succès/erreur.
- **Dépendances** : `userHooks`, `familyMemberFormSchema`, `UncoveredMembersAlert`,
  `FirstPaymentOnboardingCard`.
- **Comportement attendu (reformulé)** : la mise à jour d'une personne à charge DOIT passer par une
  API restreinte au propriétaire et aux champs autorisés (aujourd'hui `PUT /api/users/:id` accepte
  tout le document). (cf. FONCTIONNEL_GLOBAL §7-2)

### GET /profil/sponsorship
- **Objectif fonctionnel** : lister les personnes parrainées par le membre.
- **Accès** : membre connecté.
- **Données affichées** : `GET /api/users/:referredBy/referral` (`useGetUserByReferralId`) → tableau
  (prénom, nom, date d'inscription).
- **Actions possibles** : tri des colonnes ; aucune mutation.
- **Règles de validation** : aucune.
- **États particuliers** : `isPending` → `<Loading/>` ; erreur → toast.
- **Dépendances** : `userHooks`, `ProfilLayout`.
- **Comportement attendu (reformulé)** : —

### GET /billing
- **Objectif fonctionnel** : paiement (par Interac) de l'adhésion et/ou le RPN par le titulaire pour lui et ses
  personnes à charge éligibles ; consulter l'historique de l'année en cours avec la possbilité de voir toutes les historiques via un lien.
- **Accès** : membre connecté. Autorisée pendant l'attente du 1er paiement.
- **Données affichées** : membres éligibles (`useFullBillingMembers`) avec frais traitement/adhésion/RPN par
  personne ; totaux (traitement, adhésion, RPN, global) ; historiques Membership & RPN de l'année courante
  (`GET /api/transactions/:id/all`). État vide si aucun paiement dû (lien vers `/profil/couverture`).
- **Actions possibles** :
  - Case frais de traitement obligatoire (donc déjà cocher et griser pour ceux donc on paie le membership)
  - Cocher membership / RPN par membre (RPN désactivé si l'adhésion n'est pas cochée pour ce membre).
  - Soumettre le paiement → `POST /api/transactions/new` (`useNewTransactionMutation`) avec `type:
    credit`, `fundType` = membership|rpn|both, `membershipAmount`, `rpnAmount`, `refInterac`,
    `status: pending`, et `partialCoverage` (liste des personnes à charge couvertes). Invalide les
    caches compte/transactions ; toast ; navigation `/summary?payment=submitted`.
- **Règles de validation** : **client** : au moins un service coché (sinon toast) ; montant Interac
  saisi = total calculé et référence Interac conforme (`createInteracFormSchema(total)`). **Serveur** :
  unicité de la référence Interac ; cohérence `both` (membership+rpn=amount) ; barrière anti-RPN sans
  adhésion payée.
- **États particuliers** : liste vide → carte « Aucun paiement disponible » ; `isSubmitting` →
  bouton désactivé ; erreurs de validation affichées sous les champs.
- **Dépendances** : `transactionHooks`, `useFullBillingMembers`, `lib/fees`, `lib/billing`,
  `createInteracFormSchema`, composants `MemberServiceCard`/`InteracPaymentSection`.
- **Comportement attendu (reformulé)** : le barème appliqué DOIT refléter le modèle création vs
  renouvellement (10$ traitement + adhésion 25/50$ à la création ; 5$/personne + adhésion 25/50$ au
  renouvellement ; RPN à la demande) plutôt que la décomposition figée actuelle. (cf.
  FONCTIONNEL_GLOBAL §0/§4.6)

### GET /billing-partiel
- **Objectif fonctionnel** : facturer les personnes à charge ajoutées **après** le paiement annuel
  (couverture complémentaire).
- **Accès** : membre connecté.
- **Données affichées** : membres éligibles au partiel (`usePartialBillingMembers`, i.e.
  `membershipCoveredThisYear === null` et/ou RPN à activer) avec frais ; totaux ; section paiement
  Interac. État « tous à jour » si liste vide.
- **Actions possibles** : identiques à `/billing` — sélection par membre + `POST /api/transactions/new`
  (raison « Facturation partielle – membres ajoutés en cours d'année », `partialCoverage`). Invalide
  les caches ; navigation `/summary?payment=submitted`.
- **Règles de validation** : identiques à `/billing` (`createInteracFormSchema(total)`, ≥ 1 service).
- **États particuliers** : liste vide → carte « Tous vos membres sont à jour » ; `isSubmitting`.
- **Dépendances** : `transactionHooks`, `usePartialBillingMembers`, `lib/fees`.
- **Comportement attendu (reformulé)** : idem `/billing` sur l'alignement du barème création/renouvellement.

### GET /faq
- **Objectif fonctionnel** : foire aux questions pour les membres qui on du mal à se répérer dans le système de facturation ou d'ajout de personnes à charge.
- **Accès** : membre connecté (déclarée sous `ProtectedRoute`).
- **Données affichées** : contenu statique de Q/R.
- **Actions possibles** : lecture uniquement.
- **Règles de validation** : aucune.
- **États particuliers** : aucun.
- **Dépendances** : `FrequentlyAskedQuestions`.
- **Comportement attendu (reformulé)** : Elle n'est pas publique car pour moi cela ne sert à rien de le voir ai on n'est pas membre.

### GET /transactions/:id/all
- **Objectif fonctionnel** : historique des transactions de l'année en cours du membre connecté.
- **Accès** : membre connecté.
- **Données affichées** : `GET /api/transactions/:userId/all` (`useGetTransactionsByUserIdQuery`) →
  tableau (date, type, montant coloré +/-, statut avec badge).
- **Actions possibles** : tri de colonnes ; aucune mutation.
- **Règles de validation** : aucune.
- **États particuliers** : `isPending` → `<Loading/>` ; erreur → toast.
- **Dépendances** : `transactionHooks`, `lib/transactionStatus`.
- **Comportement attendu (reformulé)** : -

### GET /announcements
- **Objectif fonctionnel** : historique public (pour le membre) des annonces de décès de l'année en cours.
- **Accès** : membre connecté.
- **Données affichées** : `GET /api/announcements/all` (`useGetAnnouncementsQuery`) → tableau (date
  d'annonce, nom, lieu, date du décès).
- **Actions possibles** : tri ; aucune mutation.
- **Règles de validation** : aucune.
- **États particuliers** : `isPending` → `<Loading/>` ; erreur → toast.
- **Dépendances** : `deathAnnouncementHook`.
- **Comportement attendu (reformulé)** : —

---

## Pages admin (garde `AdminRoute` — `isAdmin` requis)

### GET /admin/accounts
- **Objectif fonctionnel** : console d'administration de tous les comptes membres.
- **Accès** : admin. Sinon redirection `/login?redirect=...`.
- **Données affichées** : `GET /api/accounts/all` (`useGetAccountsQuery`) → tableau (date de création,
  nom complet [lien profil], téléphone, pays, solde RPN). La
  recherche globale matche aussi les personnes à charge. Les comptes inactifs sont grisés.
- **Actions possibles** (par ligne) :
  - Rappeller manuellement utilisateur qu'il doit payer membership (`ManualBalanceReminderButton` →
    `POST /api/transactions/manual-balance-reminder/:userId`).
  - mettre un user admin (`ManualToggleAdminButton` → `PUT /api/users/admin/:userId`).
  - Désactiver / Réactiver un compte qui n'a pas payer son membership manuellement (`PUT /api/users/deactivate|reactivate/:userId`).
  - Supprimer un compte et tous ces users + transaction en cascade (`ManualDeleteUserButton` → `DELETE /api/users/:userId`, désactivé si le compte est
    admin).
  - Lien vers `/admin/accounts/:userId/profile`.
  - Sous-menu: « Rappel des membres » pour le rpn, tout ceux non à jour
- **Règles de validation** : **client (zod)** sur la modale (types des champs) ; `paymentMethod`
  affiché en lecture seule ; soldes éditables (nombres).
- **États particuliers** : `isPending` → `<Loading/>` ; erreur → toast ; actions désactivées pour les
  comptes inactifs ; colonnes masquées par défaut (pays, en attente, méthode).
- **Dépendances** : `accountHooks`, `userHooks`/`transactionHooks` via les boutons manuels.
- **Comportement attendu (reformulé)** : -

### GET /admin/accounts/:userId/profile
- **Objectif fonctionnel** : fiche détaillée d'un compte membre avec assistance de paiement pour ceux qui ont de la difficulter ou qui ont fait des erreurs de paiement.
- **Accès** : admin.
- **Données affichées** : bouton de navigation précédent/suivant et de retour à tous les comptes,
  profil utilisateur consulter, Personnes à charge, 6 dernières transactions, soldes (membership/RPN), 
  **assistant de paiement** qui correponds à un formulaire de saisie de données pour le paiement à completer.
- **Actions possibles** : via sous-composants — assistant de paiement (`AccountPaymentAssistant` :
  correction de solde `POST /api/accounts/:id/balance-correction` et/ou paiement manuel — **à
  valider**), gestion RPN famille (`désinscrire ou inscrire`), supprimer definitivement un membre famille. Navigation précédent/suivant entre comptes.
- **Règles de validation** : enregister le paiement n'a plus besoin d'être approuver dans la gestion des transaction.
- **États particuliers** : chargements combinés → `<Loading/>` ; erreur utilisateur → bouton
  « Retour aux comptes ».
- **Dépendances** : `accountHooks`, `userHooks`, `transactionHooks`, `settingHooks`, sous-composants
  `Account*`.
- **Comportement attendu (reformulé)** : —

### GET /admin/announcements
- **Objectif fonctionnel** : publier des annonces de décès (unitaire ou en lot) et suivre en direct le
  traitement des prélèvements RPN.
- **Accès** : admin.
- **Données affichées** : `GET /api/announcements/all` (`useGetAnnouncementsQuery`, **polling 4 s**
  pendant un traitement `pending`/`processing`) → tableau (date, nom, lieu, date décès, statut de
  traitement, montant attendu/reçu). Panneau de suivi en direct : statut, raison d'échec, récap
  (membres ciblés, débits réussis, montants attendu/reçu, soldes insuffisants, comptes manquants,
  erreurs système).
- **Actions possibles** :
  - Si possible relancer plutard les prélèvements pour ceux qui ont eux des écheques pour des raisons inconnues alors qu'il devait payer.
  - « Publier un décès » → modale (nom, lieu, date) → `POST /api/announcements/new`
    (`useNewDeathAnnouncementMutation`) ; démarre le suivi + polling.
  - « Publier plusieurs décès » → `BatchDeathAnnouncementForm` → `POST /api/announcements/batch`.
  - Modifier une annonce en cas d'erreur → `PUT /api/announcements/:id` (`useUpdateAnnouncementMutation`).
  - Bouton « Supprimer » une anonce(avec confirmation), vide aussi les prélèvements ou trasactions lié à elle (supression cascade).
- **Règles de validation** : **client (zod)** : nom, lieu, date requis (date entre 1930 et
  aujourd'hui). **Serveur** : montant par personne (`amountPerDependent`) > 0 sinon annonce `failed`.
- **États particuliers** : bandeau de suivi (spinner/coché/alerte) selon `processingStatus` ;
  `isPending` → `<Loading/>`.
- **Dépendances** : `deathAnnouncementHook`, `lib/announcementStatus`, `BatchDeathAnnouncementForm`.
- **Comportement attendu (reformulé)** : -.

### GET /admin/transactions
- **Objectif fonctionnel** : gérer l'ensemble des transactions (validation, rejet, remboursement,
  édition, suppression) + rapports et réglages des montants.
- **Accès** : admin.
- **Données affichées** : `GET /api/transactions/all` (`useGetAllTransactionsQuery`) → tableau (date,
  utilisateur, statut [badge], raison, réf Interac, montant) avec filtre par statut. Sous-menu vers
  « Bilan » et « Réglages des montants: rpn, membership, decès, max prélèvement».
- **Actions possibles** (par ligne) :
  - Si `pending` : Confirmer → `POST /api/transactions/:id/confirm` ; Rejeter →
    `POST /api/transactions/:id/reject`.
  - Si remboursable (`completed` et `fundType` rpn|both) : Rembourser (modale, montant optionnel) →
    `POST /api/transactions/:id/refund` (partiel ou total RPN).
  - Supprimer (modale) → `DELETE /api/transactions/:id`.
  - Sous-menu : « Bilan » pour voir le bilan des transactions financières annuel ou mensuel(`BilanTransactions` → `GET /api/transactions/summary`), « Réglages des
    montants » (`TransactionsSetttings` → `GET /api/settings/current`, `PUT /api/settings/:id`).
- **Règles de validation** : **client** : montant de remboursement ≥ 0 (optionnel). **Serveur** :
  machine à états (transitions autorisées), remboursement plafonné à la partie RPN restante.
- **États particuliers** : filtre statut ; chargements par action ; erreurs → toast.
- **Dépendances** : `transactionHooks`, `settingHooks` (réglages), `lib/transactionStatus`,
  sous-composants `Bilan`/`Settings`/`Submenu`.
- **Comportement attendu (reformulé)** : —

### GET /admin/bureaux
- **Objectif fonctionnel** : gérer l'ensemble des membres du bureau et les anonces faites par le bureau
- **Accès** : admin.
- **Données affichées** : ajouter rapport fin d'année, commnuiqué, statut, activité association.
- **Actions possibles** (par ligne) :
  - à définir (tu peux suggérer).
- **Règles de validation** : suggère moi des idées.
- **Comportement attendu (reformulé)** : —

### GET /admin/relancer-rpn-en-echec
- **Objectif fonctionnel** : relancer manuellement les inscriptions RPN bloquées sur notrerpn.org et
  corriger les statuts legacy.
- **Accès** : admin.
- **Données affichées** : `GET /api/users/admin/rpn-pending` (`useGetRpnPendingQuery`) → cartes par
  membre listant les personnes bloquées (principal/famille, statut RPN, solde RPN).
- **Actions possibles** :
  - « Synchroniser » (par personne) → `POST /api/users/admin/rpn-sync/:userId` avec `{memberType:
    primary}` ou `{memberType: family, memberId, memberIndex}`. Succès → toast + `refetch`.
  - « Corriger rpnStatus legacy » → `POST /api/users/admin/backfill-rpn-status` (migration unique) ;
    affiche le rapport des corrections.
- **Règles de validation** : côté client, la synchro d'une personne à charge est **bloquée** tant que
  le principal n'est pas synchronisé (`familyBlocked`).
- **États particuliers** : `isPending` → `<Loading/>` ; erreur de chargement → message rouge ; liste
  vide → « Aucun membre en attente » ; boutons désactivés pendant l'appel ou après succès.
- **Dépendances** : `rpnSyncHooks`, `apiClient` direct.
- **Comportement attendu (reformulé)** : —

---

## Tableau récapitulatif

| Route | Rôle(s) | Objectif en 5 mots | Confiance |
|---|---|---|---|
| GET / | Public | Accueil marketing de l'association | Élevé |
| GET /login | Public | Authentifier un membre existant | Élevé |
| GET /forgot-password | Public | Demander réinitialisation mot de passe | Élevé |
| GET /reset-password/:id/:token | Public | Définir un nouveau mot de passe | Élevé |
| GET /register (+/:id/:ref) | Public | Inscription étape 1 identifiants | Élevé |
| GET /origines | Public | Inscription étape 2 identité | Élevé |
| GET /infos | Public | Inscription étape 3 coordonnées | Élevé |
| GET /urgence | Public | Inscription étape 4 création | Élevé |
| GET /about | Public | Présentation statique de l'association | Élevé |
| GET /contact-us | Public | Page contact (gabarit vide) | Élevé |
| GET /conditions | Public | Conditions et statuts association | Élevé |
| GET /account-deactivated | Public | Informer compte désactivé | Élevé |
| GET /menu-mariage | Public | Menu événement (à retirer) | Moyen |
| GET /reserver-fete-fin-annee | Public | Réservation Fête Noël (retirer) | Moyen |
| GET /liste-reservations | Public (non gardé) | Admin réservations (retirer) | Moyen |
| GET /* | Public | Page 404 introuvable | Élevé |
| GET /summary | Membre/Admin | Tableau de bord du membre | Élevé |
| GET /profil | Membre/Admin | Consulter informations personnelles connexion | Moyen |
| GET /profil/couverture | Membre/Admin | Gérer couverture adhésion RPN | Élevé |
| GET /profil/dependents | Membre/Admin | Gérer les personnes charge | Élevé |
| GET /profil/sponsorship | Membre/Admin | Lister les personnes parrainées | Élevé |
| GET /billing | Membre/Admin | Payer adhésion et RPN | Élevé |
| GET /billing-partiel | Membre/Admin | Facturer membres ajoutés tardivement | Élevé |
| GET /faq | Membre/Admin | Foire aux questions | Élevé |
| GET /change-method | Membre/Admin | Modifier mode de paiement | Élevé |
| GET /transactions/:id/all | Membre/Admin | Historique de mes transactions | Élevé |
| GET /announcements | Membre/Admin | Historique des annonces décès | Élevé |
| GET /admin/accounts | Admin | Administrer tous les comptes | Élevé |
| GET /admin/accounts/:userId/profile | Admin | Fiche compte et paiement | Élevé |
| GET /admin/announcements | Admin | Publier décès suivre prélèvements | Élevé |
| GET /admin/transactions | Admin | Gérer valider rembourser transactions | Élevé |
| GET /admin/relancer-rpn-en-echec | Admin | Relancer inscriptions RPN bloquées | Élevé |

> **Confiance** : *Élevé* = composant lu intégralement ; *Moyen* = déduit d'une lecture partielle
> et/ou de sous-composants non ouverts (marqués « à valider » dans le texte).
