# PLAN_IMPLEMENTATION — `mon-rpn-react` (réécriture)

> Plan de réécriture **ordonné et actionnable**, dérivé de la documentation fonctionnelle :
> [FONCTIONNEL_GLOBAL.md](FONCTIONNEL_GLOBAL.md), [FONCTIONNEL_PAGES.md](FONCTIONNEL_PAGES.md),
> [FONCTIONNEL_WORKFLOWS.md](FONCTIONNEL_WORKFLOWS.md), [FONCTIONNEL_PROCESSUS.md](FONCTIONNEL_PROCESSUS.md).
> **Ce document est une base de discussion, pas l'implémentation.** Les décisions d'architecture et
> les user stories sont **à valider** avant tout développement.
>
> **⚠ Entrée manquante** : `MIGRATION_DONNEES.md` (cité dans la demande) **n'existe pas** dans le
> dépôt. Les dépendances de migration de données sont donc dérivées de
> [FONCTIONNEL_WORKFLOWS.md §3 (ERD) et §4 (contraintes transversales)]. Produire un
> `MIGRATION_DONNEES.md` dédié est lui-même **une hypothèse à valider** (voir Phase 9).
>
> **Priorisation** : chaque phase est numérotée dans l'ordre d'exécution recommandé ; à l'intérieur
> d'une phase, les user stories sont étiquetées **P1 → Pn** par priorité de réalisation. Toutes
> restent **à valider**.

---

## Étape 1 — Stack technique cible

> **Décisions retenues avec le propriétaire (2026-07-04)** — à confirmer formellement avant le
> démarrage. Contraintes déjà fixées en amont (FONCTIONNEL_GLOBAL §0) : hébergement **MongoDB
> Atlas**, **i18n** conservé (défaut français), devise **CAD avec décimales** (ex. 12,50 $),
> **paiement Interac uniquement** (retrait carte de crédit), retrait du module Événements et de
> l'auto-déconnexion sur inactivité.

> **Décision d'architecture des données (2026-07-05)** — confirmée par le propriétaire :
> - **Refonte propre orientée domaine** (et **non** une migration directe du schéma legacy) : le
>   nouveau modèle repart d'**entités de premier plan référencées** (`Personne`/`Membre`, `Foyer`,
>   `Adhésion`, `CouvertureRPN`, `Facture`, `Paiement`, `Parrainage`, `Décès`, **Grand livre**, ...) plutôt
>   que de sous-documents `familyMembers[]` profondément imbriqués. Voir l'**ERD cible** dans
>   FONCTIONNEL_WORKFLOWS §3bis.
> - **Moteur : MongoDB Atlas conservé** ; ODM **Mongoose/Typegoose**.
> - **Registre comptable en partie double (ledger)** : les mouvements d'argent sont des **écritures
>   immuables et équilibrées** (append-only) ; les **soldes deviennent dérivés** (agrégés/matérialisés),
>   plus des champs mutables `membership_balance`/`rpn_balance`. Voir §3bis + Étape 6 (désormais retenu).
> - **Montant monétaire** : type exact — **`Decimal128` (Mongo)** pour pouvoir avoir des soldes comme 1,25$.
>   (une seule convention à choisir en Phase 0).
> - **Migration legacy → cible** : **script ETL Node idempotent et rejouable** utilisant les modèles
>   Mongoose cibles ; l'ancien schéma (ERD legacy §3) sert de **source**. Détail en Phase 9.

### Synthèse de la stack retenue

| Couche | Choix retenu | Statut |
|---|---|---|
| Backend | **NestJS + TypeScript** | **Décidé (Option A)** |
| Déploiement | **Docker** (dev + prod) — ⚠ cron/file sur **une seule instance** (sinon double prélèvement) | **Décidé** |
| Accès données | **Mongoose + Typegoose** sur **MongoDB Atlas** | Retenu |
| Traitement asynchrone / files | **File persistée adossée à MongoDB Atlas** (pattern outbox/jobs-collection) | Retenu (voir décision ci-dessous) |
| Frontend | **React + Vite (SPA)**, nettoyé | Retenu |
| Transversal | i18n (i18next), courriels via file+retry, journalisation structurée, secrets via env obligatoires | Retenu |

### Option A (retenue) — NestJS + Mongoose/Typegoose + file MongoDB + React/Vite

- **Réutilisé de la stack actuelle & pourquoi** :
  - **Node.js / TypeScript** (front et back) — continuité des compétences, réutilisation des types
    partagés (barème, règles de facturation).
  - **MongoDB Atlas + Mongoose 8 + Typegoose** — moteur conservé (décision §0). Le **nouveau modèle est
    une refonte domaine à collections référencées** (voir WORKFLOWS §3bis), **pas** une reprise du
    modèle imbriqué legacy. Mongoose/Typegoose gère les **références inter-collections** et les
    **transactions multi-documents** (replica set Atlas) nécessaires à l'intégrité (§7-21) et au
    **grand livre**.
  - **React 18 + Vite + shadcn/Radix + @tanstack/react-query + react-hook-form + zod + i18next** —
    tout le socle UI documenté dans FONCTIONNEL_PAGES est conservé ; réécriture iso-fonctionnelle.
  - **bcrypt, jsonwebtoken, nodemailer, node-cron, winston, cloudinary** — briques éprouvées, encadrées
    par des modules Nest.
- **Ce qui change & pourquoi** :
  - **Express → NestJS** : la doc exige une **rigueur transversale** aujourd'hui absente — gardes
    d'accès systématiques (`§7-1,2,6,7`), validation d'entrée, machine à états transactionnelle
    (Workflow 2), file persistée (§7-24). Les **guards/interceptors/pipes** et la **DI** de NestJS
    industrialisent ces besoins et améliorent la **testabilité** (§7-26). Limite actuelle : contrôles
    d'accès commentés/absents, logique dupliquée, pas de tests (§7-25/26/27).
  - **File en mémoire → file persistée MongoDB** : le prélèvement décès et la synchro RPN sont
    aujourd'hui **fire-and-forget** / en mémoire (perdus au redémarrage, PROCESSUS « File mémoire »,
    Workflow 5) ; la nouvelle file **persistée + reprenable + idempotente** corrige directement §7-24
    et §7-23.
  - **Envoi de courriels inline → file + retry** : `mailer/core.ts` recrée un transport par envoi,
    sans reprise (PROCESSUS « Emails ») ; passage à un **envoi enfilé avec retry/backoff**.
  - **Retraits** : schéma `Card`, module Événements, redux non utilisé, auto-déconnexion inactivité
    (§0).
- **Impacts concrets sur workflows & processus non-UI** :
  - **ODM Mongoose/Typegoose + refonte domaine** → les **contraintes transversales** (WORKFLOWS §4)
    deviennent des **index/contraintes de premier plan** : `refInterac` unique global, `referralCode`
    unique, une **`Adhésion`/`CouvertureRPN` par personne**, invariant d'**équilibre du ledger** (somme
    des écritures = 0). Le modèle imbriqué legacy `familyMembers` est **remplacé** par une entité
    `PersonneACharge` référencée (permet promotion en titulaire, couverture par personne, historique).
  - **Ledger en partie double** → les soldes ne sont plus des champs mutables mais **dérivés** des
    écritures immuables ; toute correction est une **contre-passation** (plus de correction destructive
    type `balance-correction`).
  - **File persistée** → refonte de **Workflow 5** (prélèvement décès) et **Workflow 4** (sync
    notrerpn.org) : les appels externes deviennent des **jobs** avec statut, retry et idempotence ;
    le cron de cotisation (Workflow 3) et le rappel RPN (Workflow 6) peuvent aussi s'appuyer sur cette
    file pour l'isolation des échecs.
  - **NestJS scheduler** remplace `node-cron` importé à l'import ; les crons obtiennent un **fuseau
    explicite `America/Toronto`** et un `try/catch` par unité (PROCESSUS [Cron], §0).

### Option B (considérée, non retenue) — Express restructuré + file MongoDB + React/Vite
- **Réutilise** davantage l'existant (routers Express), **change** moins → migration plus rapide mais
  la discipline (gardes, machine à états, file, tests) reste **à rebâtir manuellement**, au risque de
  reproduire les dérives §7. **Impact** : gain de délai court terme, dette structurelle conservée.

### Option C (considérée, non retenue) — NestJS + BullMQ + Redis
- Identique à l'Option A mais file **BullMQ/Redis** (retry, backoff, tableau de bord, débit élevé).
- **Non retenue pour l'instant** : BullMQ est libre (MIT), mais **Redis en production implique un coût
  ou une charge d'exploitation** (services gérés payants ; tiers gratuits non adaptés à la production).
  Décision propriétaire : éviter toute nouvelle infra payante.

### Décision sur la file asynchrone — **✅ Décidé (Option A : file MongoDB)**
> **File persistée adossée à MongoDB Atlas** (collection de jobs / pattern outbox) : **aucune nouvelle
> infrastructure ni coût** (réutilise Atlas déjà payé), fournit **persistance, retry/backoff,
> idempotence, reprise après crash** via `findOneAndUpdate` atomique (claim d'un job) et clés
> d'idempotence. Couvre les besoins §7-24 (file reprenable) et le retry courriel. **Limite** : débit,
> planification fine et observabilité inférieurs à BullMQ. **Évolution possible** : migrer vers
> **BullMQ + Redis** si le volume l'exige (Upstash offre un tier gratuit pour un essai). *Proposition
> d'architecture à valider.*

---

## Étape 1bis — Décisions d'affaire (2026-07-05) : corrections & ajouts au plan

> Décisions confirmées dans **BESOIN_AFFAIRE.md** (et reportées dans FONCTIONNEL_GLOBAL §0/§0bis,
> FONCTIONNEL_WORKFLOWS). Elles **corrigent** certaines hypothèses des phases ci-dessous et **ajoutent**
> des user stories. En cas de divergence, **cette section fait autorité**. Les rares points encore
> ouverts restent marqués **« à valider »**.

### A. Corrections de phases existantes

- **Phase 3 — Barème de renouvellement (correction majeure).** Le renouvellement **n'est PAS** «
  5 $/personne seulement » : il vaut **5 $/personne active (gestion) + l'adhésion selon la profession**
  (mêmes tarifs qu'à la création). De plus, le renouvellement est **facturé (facture réelle, paiement
  réel), pas auto-prélevé sur un solde prépayé** : émission d'une **facture annuelle** sur une **période de
  rappels ~2 mois** (janvier → mi-février) ; sans paiement à l'échéance → **désactivation adhésion + désinscription
  RPN**. → **remplace** la story Phase 3-P2 « 5 $/personne, pas d'adhésion » et le Workflow 3.
- **Phase 3 — Ajout en cours d'année.** Une personne ajoutée après le paiement annuel est facturée au
  **tarif de création** (10 $ + adhésion profession + provision RPN ≥ 20 $). → précise Phase 3-P5.
- **Phase 2 — Paiement Interac.** (1) Le montant reçu doit être **≥ total attendu** sinon **refusé** ;
  **tout surplus va au solde RPN**. (2) La **validation automatique par Claude Vision** (analyse de la
  preuve de paiement) est la **voie principale** ; l'admin est la **voie de secours**. → complète
  Phase 2-P5 et Phase 8-P1, et **retire** l'automatisation Interac de « Étape 6 à valider » (décidée).
- **Phase 4 — RPN.** (1) **Désinscription immédiate** dès solde RPN **≤ 1 $** (courriel), en plus de
  l'**alerte** à 5 $/personne — pas de compteur « maxMissed ». (2) La **couverture RPN exige un
  paiement** (ou exemption). (3) `notrerpn.org` **fait foi** ; réconciliation automatique, et en cas
  d'échecs répétés, **correction manuelle** en saisissant `matricule`+`référence` obtenus directement
  sur `notrerpn.org`. → précise Phase 4-P2/P3.
- **Phase 5 — Décès.** (1) **Aucune preuve** à joindre (les décès viennent du RPN central). (2) Foyer
  au solde insuffisant → **désinscription immédiate** (personnes à charge comprises), **régularisation
  rétroactive** possible ; un solde négatif fait **office de dette** (**à valider** : modalités). (3)
  **Équité par personne assumée** (grande famille paie plus). → précise Phase 5-P3.
- **Phase 6 — Crons.** Le **rappel de solde RPN bas** est **hebdomadaire, chaque samedi**, **purement
  informatif** (n'incrémente rien) ; la désinscription est séparée (≤ 1 $). Le cron « cotisation
  annuelle » devient un **générateur de factures + relances 2 mois** (pas un auto-prélèvement). →
  remplace Phase 6-P4 et ajuste Phase 6-P3.
- **Phase 9 — Réactivation.** Plus d'octroi automatique d'année à la réactivation : **paiement réel**
  ou **exonération tracée** uniquement.

### B. Nouvelles user stories

**Phase 1 (RBAC) — P6 : Rôle « Membre du bureau ».** *Criticité : Haute.*
En tant qu'administrateur, je veux attribuer un rôle **Membre du bureau**, afin d'exempter certains
membres de la cotisation d'adhésion sans leur donner les pouvoirs d'admin.
- Given un membre du bureau, When sa facturation d'adhésion est calculée (lui + sa famille), Then elle
  est **exonérée d'adhésion** mais **PAS de RPN** (il contribue aux décès, perd la couverture si solde RPN < 1 $).
- Given un membre du bureau, When il accède aux consoles d'administration, Then l'accès est **refusé**
  (seule la publication de rapports/activités lui est permise). Le rôle est **attribué par un admin**.
- *(Remplace le booléen `isAdmin` par un rôle `membre | membre_bureau | admin`.)*

**Phase 3 (Adhésion) — P6 : Parrainage-réduction (NOUVELLE fonctionnalité).** *Criticité : Moyenne.*
En tant que membre, je veux obtenir **-50 % sur mon adhésion** l'année suivante quand un filleul que
j'ai parrainé **devient actif**, afin d'être récompensé du parrainage.
- Given un filleul inscrit via mon lien/code **qui paie et devient actif**, When mon renouvellement
  N+1 est facturé, Then une **réduction de 50 % de mon adhésion** est appliquée automatiquement
  (12,5 $/12,5 $/25 $ selon profession).
- Given plusieurs filleuls actifs, When ma facture est générée, Then les réductions sont **cumulables**
  jusqu'au **total des adhésions de mon foyer** (personnes à charge incluses).
- Given un filleul qui ne paie pas / se désinscrit, When ma réduction est calculée, Then **aucune
  réduction** n'est accordée pour ce filleul.
- Given un filleul qui paie **après** mon renouvellement, When la réduction est évaluée, Then elle est
  **reportée à l'année suivante** (non rétroactive, **non reportable > 1 an**, parrainages horodatés).
- Given un parrainage erroné, When un admin le corrige/annule, Then la réduction est recalculée. Le
  membre **voit ses filleuls et le montant de réduction prévu**.

**Phase 3 (Adhésion) — P7 : Mise à jour des professions au renouvellement.** *Criticité : Moyenne.*
En tant que responsable facturation, je veux que les professions soient revalidées périodiquement, afin
que les tarifs restent exacts dans le temps.
- Given un membre étudiant depuis 2 ans, When son renouvellement arrive, Then le système **redemande**
  son statut (toujours étudiant ou devenu travailleur).
- Given un étudiant depuis **5 ans**, When son renouvellement est calculé, Then il devient
  **automatiquement travailleur**, **sauf** médecine/doctorant qui attends 8 ans.

**Nouvelle Phase 10 — Promotion d'une personne à charge en titulaire.** *Criticité : Moyenne.*
> Sort de « Étape 6 — à valider » : **besoin confirmé**. Dépend des Phases 1–4.
En tant qu'**administrateur**, je veux promouvoir une personne à charge en titulaire, afin qu'elle gère
sa propre couverture.
- Given une personne à charge active, When **un admin** la promeut titulaire, Then un **nouveau compte**
  est créé qui **conserve son matricule `notrerpn.org` et sa couverture si active** ; son **historique
  n'est pas transféré** ; le **titulaire d'origine cesse de la porter**.
- Given la promotion, When le nouveau foyer est créé, Then son **solde RPN démarre à 0 $** (aucun
  transfert) et il doit **re-provisionner 20 $ minimum** pour rester couvert.
- Given un membre non-admin, When il tente une promotion, Then l'opération est **refusée** (réservée à
  l'admin).

### C. Points encore à valider (à trancher avant dev)

- *(Tous résolus 2026-07-05 :* **montant = `Decimal128`** ; **seuils RPN** — `5 $`/pers. = **alerte**
  (informer que le solde est bas, à risque en cas de décès multiples), `≤ 1 $` = **désinscription**
  (sinon, au prochain décès, l'association paierait à sa place) ; **dette** = solde RPN négatif ;
  **promotion** par l'admin, solde non transféré, repart à 0 $ ; **reversement notrerpn** hors app
  (comptable via banque, l'app estime le montant) ; **rapprochement Interac** par référence.*)*

---

## Étape 2 — Phases ordonnées

> Ordre dicté par les dépendances entre modules (WORKFLOWS 1→9) et par les contraintes transversales
> (WORKFLOWS §4). Le **frontend** peut démarrer par domaine dès que l'API correspondante est stable
> (opportunité de parallélisation signalée en Étape 5), mais est présenté en phases 7–8 pour la clarté
> de l'ordre. **Criticité** = impact métier documenté (facturation, couverture décès, sécurité =
> Haute ; cosmétique = Basse).

### Phase 0 — Fondations techniques & socle transversal
- **Modules/domaines** : squelette NestJS ; connexion Mongoose/Typegoose ↔ Atlas (transactions
  activées) ; **module Paramètres unique** (barème/seuils, source d'autorité unique, §7-13/14) ;
  **utilitaire monétaire exact** (**`Decimal128`** — décimal exact de MongoDB, décision 2026-07-05 ;
  décimales sans dérive de flottant, WORKFLOWS 2) ; **primitives du grand livre (ledger) en partie
  double** (collection `LedgerEntry` **append-only**, écriture **équilibrée** débit/crédit, **solde =
  agrégat dérivé**, plus de champ de solde mutable) ; **file de jobs
  persistée générique** (retry/backoff/idempotence/reprise) ; **service courriel enfilé** (retry) ;
  journalisation structurée (pas de secret/jeton en clair §7-8) ; i18n serveur (défaut fr) ; gestion
  centralisée des erreurs ; configuration **secrets via env obligatoires** (§7-3/4) ; runner de tests + CI.
- **Prérequis** : aucun (point de départ).
- **Livrable** : API NestJS démarrable connectée à Atlas ; module Paramètres avec **valeurs par
  défaut uniques** lisibles ; utilitaire monétaire exact **testé** (convention arrêtée) ; **primitives
  ledger testées** (écriture équilibrée, solde dérivé, contre-passation) ; file de jobs persistée
  générique **avec retry + idempotence démontrés par tests** ; service courriel enfilé ; pipeline de
  tests vert.
- **Criticité** : **Haute** (socle bloquant pour toutes les phases ; sécurité des secrets, cohérence
  du barème, fiabilité asynchrone).
- **Exigences non-fonctionnelles** : **sécurité** (aucun secret en dur, secrets via env obligatoires) ;
  **observabilité** (journaux structurés, jamais de jeton en clair) ; **fiabilité** (file idempotente,
  reprise après redémarrage) ; **cohérence des données** (source unique du barème).

### Phase 1 — Authentification, utilisateurs & contrôle d'accès (RBAC)
- **Modules/domaines** : Auth (login JWT, bcrypt) ; réinitialisation de mot de passe (**jeton lié à
  l'utilisateur cible** §7-5, **aucune règle de robustesse** imposée — décision propriétaire) ; modèle
  `User` (register/origines/infos/subscription/familyMembers) ; **RBAC** (garde membre/admin lisant
  l'**état courant en base** §7-7 ; **jamais d'auto-attribution admin** §7-1 ; un membre ne modifie
  que **son** profil et des champs autorisés §7-2) ; cache d'authentification **partagé** sans
  prolongation d'expiration §7-9.
- **Prérequis** : Phase 0.
- **Livrable** : API d'authentification + gestion utilisateur avec RBAC opérationnel ; flux mot de
  passe oublié/réinitialisation lié à l'utilisateur ; **tests d'accès** (auto-attribution admin
  refusée ; modification de profil tiers refusée).
- **Criticité** : **Haute** (toutes les routes protégées et l'ensemble des workflows en dépendent ;
  socle de sécurité).
- **Exigences non-fonctionnelles** : **sécurité** (RBAC, révocation immédiate via état en base,
  non-journalisation des jetons) ; **audit** (traçage des actions d'administration sur les comptes) ;
  **conformité** (mot de passe sans règle imposée = exigence propriétaire explicite).

### Phase 2 — Comptes financiers, paramètres & moteur de transactions (machine à états)
- **Modules/domaines** : `Foyer`/`Compte` **1—1 strict** (index unique) + **retrait du schéma `Card`**
  (§7-12) ; **soldes DÉRIVÉS du grand livre** (plus de champs mutables `membership_balance`/`rpn_balance`
  — refonte domaine + ledger, Étape 1) ; **moteur de transactions = moteur d'écritures ledger** (chaque
  paiement / prélèvement / remboursement = jeu d'**écritures équilibrées**) avec **machine à états**
  `awaiting_payment/pending/completed/failed/rejected/refunded` (Workflow 2) ; **idempotence
  d'application** ; **invariant `both`** (`membershipAmount+rpnAmount==amount`) **et invariant d'équilibre
  du ledger** ; **unicité `refInterac` globale garantie** (§4) ; **recalcul serveur du total attendu**,
  **montant reçu ≥ total sinon refus**, **surplus → RPN** (§7-18, Étape 1bis) ; **validation automatique
  Claude Vision + repli manuel admin** ; montants exacts ; **annulation = contre-passation** annulant
  **tous** les effets (écritures **+** activation adhésion **+** inscription RPN, §7-22).
- **Prérequis** : Phase 0 (paramètres, monnaie, file), Phase 1 (users/rôles).
- **Livrable** : moteur de transactions Interac complet (créer/confirmer/rejeter/échouer/rembourser)
  avec **machine à états testée**, application **idempotente**, rollback total, invariants validés serveur.
- **Criticité** : **Haute** (cœur monétaire ; Workflows 1, 3, 5, 7, 8 en dépendent).
- **Exigences non-fonctionnelles** : **intégrité transactionnelle** (chemin unique, invariants,
  idempotence) ; **sécurité** (toutes les routes transaction/compte/paramètres protégées §7-6) ;
  **audit** (`processedBy`, horodatages, traçabilité des mouvements).

### Phase 3 — Adhésion : inscription, premier paiement, renouvellement, facturation partielle
- **Modules/domaines** : service d'adhésion **unifié** (§7-25) ; **calcul distinct création vs
  renouvellement** (§0 : à la création = 10 $ traitement + adhésion profession `étudiant/sans
  emploi/parent résident = 25 $`, `travailleur = 50 $`, mineur 0 $, + provision RPN ≥ 20 $ ; au
  renouvellement = **5 $/personne active + adhésion selon profession**, sur **facture réelle** (voir
  **Étape 1bis.A**, correction 2026-07-05) ; ajout profession **« sans
  emploi »** ; **âge sur date de naissance complète** (§7-28) ; **éligibilité cohérente** combinant
  `status` **et** `rpnStatus` (§7-17) ; **Workflow 1** (inscription → compte → 1er paiement →
  activation, **atomique ou compensée**, `isAdmin=false` forcé serveur) ; **Workflow 7** (facturation
  partielle des membres ajoutés en cours d'année).
- **Prérequis** : Phase 2 (transactions/comptes), Phase 1.
- **Livrable** : cycle d'adhésion complet — création (assistant 4 étapes → compte en attente → 1er
  paiement → activation atomique), **renouvellement 5 $/personne**, facturation partielle — piloté par
  le **barème serveur unique**.
- **Criticité** : **Haute** (la facturation d'adhésion est la raison d'être de l'association).
- **Exigences non-fonctionnelles** : **cohérence métier** (barème unique création/renouvellement) ;
  **intégrité** (inscription atomique/compensée ; activation liée au paiement) ; **sécurité** (rôle
  admin non déterminé côté client).

### Phase 4 — Fonds RPN & synchronisation notrerpn.org
- **Modules/domaines** : cycle de vie RPN **autorité unique** ; `calculateTotalPersons` **cohérent**
  (`status` + `rpnStatus`, §7-17) ; inscription/réactivation/désinscription ; **synchro externe
  fiabilisée via file persistée** (retry/idempotence ; `enrolled` en base **seulement après** la
  référence externe §7-23) ; **champs et délais de désactivation RPN distincts de l'adhésion**
  (§7-15/16) ; opt-in/opt-out membre & personnes à charge (Workflow 4) ; outils admin (`rpn-pending`,
  `rpn-sync`, `retry-rpn-family`, `backfill-rpn-status`).
- **Prérequis** : Phase 2 (l'`apply()` d'un crédit RPN déclenche `onRpnPaymentConfirmed`), Phase 0
  (file), Phase 3 (couverture des personnes).
- **Livrable** : cycle de vie RPN **synchronisé de façon fiable** avec notrerpn.org (jobs persistés,
  reprise), **sans état incohérent** `enrolled`-sans-référence, avec consoles de relance.
- **Criticité** : **Haute** (couverture décès = mission centrale ; dépend d'une intégration externe →
  risque, cf. Étape 5).
- **Exigences non-fonctionnelles** : **disponibilité/résilience** (fiabilité des appels externes,
  retry, reprise) ; **observabilité** (journal de synchronisation, alertes d'échec) ; **sécurité**
  (secrets `EXTERNAL_APP_*`, `RPN_ADMIN_REFERENCE` via env).

### Phase 5 — Annonces de décès & prélèvement en masse du fonds RPN
- **Modules/domaines** : `DeathAnnouncement` ; traitement via **file persistée reprenable** (§7-24) ;
  **chemin transactionnel unique** (débit via le moteur de transactions, plus de `$inc` contournant,
  §7-21) ; gestion des soldes insuffisants → cycle RPN (Phase 4) ; notifications à tous les membres ;
  `processingSummary`/`processingErrors` ; idempotence via `processingStatus` (Workflow 5).
- **Prérequis** : Phase 4 (insuffisance/désinscription RPN), Phase 2 (transactions), Phase 0 (file).
- **Livrable** : traitement de décès **idempotent et reprenable après crash**, débitant via le chemin
  transactionnel unique, avec récapitulatif, échantillons d'erreurs et notifications.
- **Criticité** : **Haute** (solidarité décès = mission centrale ; mouvements d'argent en masse).
- **Exigences non-fonctionnelles** : **intégrité transactionnelle** (invariants, pas de double débit) ;
  **disponibilité** (reprise après redémarrage, pas de débits partiels orphelins) ; **observabilité**
  (journal d'exécution, récap) ; **performance** (concurrence maîtrisée : débits et courriels).

### Phase 6 — Tâches planifiées (crons)
- **Modules/domaines** : cron **cotisation annuelle** (Workflow 3) ; cron **désactivation des comptes
  inactifs** ; cron **rappel de solde RPN bas réactivé** (§0, Workflow 6). Tous : **fuseau
  `America/Toronto`** explicite, exécution **nocturne ~2h**, **`try/catch` par compte** (PROCESSUS
  [Cron]).
- **Prérequis** : Phase 3 (adhésion), Phase 4 (RPN), Phase 2 (transactions).
- **Livrable** : trois tâches planifiées à l'heure du Québec, **idempotentes**, **isolées par
  compte** (un échec unitaire n'interrompt pas le lot), rappel RPN réactivé avec **règle anti-spam
  unique**.
- **Criticité** : **Haute** (cotisation annuelle & désactivation) ; **Moyenne** (rappel RPN informatif).
- **Exigences non-fonctionnelles** : **disponibilité/résilience** (isolation des échecs) ;
  **observabilité** (journal d'exécution, comptes traités/échoués) ; **conformité horaire** (fuseau
  Québec explicite, exécution en fenêtre calme).

### Phase 7 — Frontend membre (SPA)
- **Modules/domaines** : socle SPA nettoyé (routing react-router, `apiClient`, gardes
  `ProtectedRoute`/`AdminRoute` alignées sur le RBAC serveur, i18n, retrait redux/auto-déconnexion/
  module Événements §0) ; assistant d'inscription 4 étapes ; profil & personnes à charge ; **couverture
  (bascule RPN par une API ciblée par membre** §7-2**)** ; **facturation & facturation partielle
  reflétant le barème création/renouvellement** (§0) ; historiques (transactions, annonces) ;
  onboarding « premier paiement ».
- **Prérequis** : Phases 1–4 (APIs auth, comptes, adhésion, RPN) stables pour les écrans concernés.
- **Livrable** : parcours membre complet (FONCTIONNEL_PAGES : pages publiques + membre) fonctionnel de
  bout en bout contre les nouvelles APIs, avec validations zod alignées sur le serveur.
- **Criticité** : **Haute** (interface principale des membres ; sans elle, aucun usage réel).
- **Exigences non-fonctionnelles** : **sécurité** (le rôle/`isAdmin` jamais déterminé côté client ;
  gardes cohérentes) ; **accessibilité/UX** (public peu habitué — messages clairs, blocages explicites
  plutôt que `console.log` silencieux, PAGES `/origines`) ; **conformité i18n** (défaut français).

### Phase 8 — Frontend admin & paramètres
- **Modules/domaines** : consoles admin (FONCTIONNEL_PAGES `/admin/*`) — comptes, transactions
  (validation/rejet/remboursement/édition), annonces de décès (publication + suivi en direct),
  **relance RPN en échec**, **réglages des montants** (paramètres). Suivi temps réel du prélèvement décès.
- **Prérequis** : Phases 2, 4, 5, 6 (APIs transactions, RPN, décès, paramètres).
- **Livrable** : consoles d'administration complètes permettant d'exploiter tous les workflows admin
  (validation paiements, publication décès, relance RPN, paramètres) avec suivi d'état.
- **Criticité** : **Haute** (l'exploitation quotidienne — validation Interac, publication décès — passe
  par l'admin).
- **Exigences non-fonctionnelles** : **sécurité** (toutes les consoles derrière RBAC admin §7-6) ;
  **observabilité** (suivi en direct du traitement décès, récap visible) ; **audit** (qui valide/rejette).

### Phase 9 — Migration des données legacy & bascule — ⏸ DIFFÉRÉE (décision 2026-07-05 : migrer **une fois le produit fonctionnel**)
- **Modules/domaines** : rédaction préalable d'un **MIGRATION_DONNEES.md** (absent aujourd'hui) ;
  **⚠ migration = ETL vers un schéma CIBLE DIFFÉRENT** (refonte domaine, pas une simple normalisation
  sur place) : **éclatement du `User` imbriqué** legacy en entités de premier plan (`Personne`, `Foyer`,
  `Adhésion`, `CouvertureRPN`, `Parrainage`) ; **reconstitution du grand livre** à partir des
  transactions/soldes legacy (solde legacy → **écritures d'ouverture** équilibrées) ; normalisation
  `success`→`completed` ; `membershipCoveredThisYear` `undefined`→valeur explicite ; **backfill
  `rpnStatus`** ; **déduplication des comptes** (1—1 strict) ; index uniques `refInterac`/`referralCode` ;
  retrait des données `Card`/Événements/`expired` ; définition du sort des données d'un membre supprimé
  (**archivage pour audit**, §0bis) ; **script ETL Node idempotent et rejouable** (pas de Prisma).
- **Prérequis** : schéma cible stabilisé (Phases 1–6) ; décisions propriétaire sur cascade soft-delete
  et conservation d'historique.
- **Livrable** : jeu de scripts de migration idempotents + `MIGRATION_DONNEES.md` validé + bascule
  répétée en pré-production avec contrôle d'intégrité (comptes uniques, références uniques, statuts
  cohérents).
- **Criticité** : **Haute** (une migration erronée corrompt soldes et couverture ; bloque la mise en
  production).
- **Exigences non-fonctionnelles** : **intégrité/conformité des données** (unicité, cohérence des
  statuts) ; **réversibilité** (scripts rejouables, sauvegarde préalable Atlas) ; **audit** (rapport de
  migration : enregistrements corrigés/ignorés).

> **Note frontend/backend** : les phases 7–8 sont présentées après le backend pour l'ordre logique,
> mais chaque écran peut être développé **en parallèle** dès que son API est stable (voir Étape 5).

---

## Étape 3 — User stories par phase

> Format strict : « **En tant que** <type>, **je veux** <objectif> **afin de** <valeur métier>. »
> Critères d'acceptation en **Given/When/Then** purement fonctionnels. Toutes les stories dérivent des
> **besoins reformulés** (§7) et des **comportements attendus** (workflows/pages/processus) — jamais du
> comportement legacy sauf reformulé. Priorité **P1→Pn** = ordre de réalisation. Toutes **à valider**.

### Phase 0 — Fondations

**P1 — Source unique du barème.** *Criticité : Haute.*
En tant qu'administrateur, je veux que tous les montants et seuils (adhésion, frais, seuil RPN, nombre
max de rappels) proviennent d'une **source de paramètres unique** avec une valeur par défaut unique,
afin d'éviter les incohérences de facturation. *(§7-13/14)*
- Given aucun paramètre personnalisé n'est configuré, When un montant est requis par un calcul, Then la
  valeur par défaut **documentée et unique** est utilisée (jamais une valeur divergente selon le module).
- Given un paramètre vaut `0`, When il est lu, Then `0` est traité comme une valeur valide (et non comme
  « non configuré »).

**P2 — Montants décimaux au cent.** *Criticité : Haute.*
En tant que membre, je veux pouvoir payer ou être facturé de montants à deux décimales (ex. 12,50 $),
afin que la facturation reflète des sommes réelles sans erreur d'arrondi. *(WORKFLOWS 2)*
- Given un montant de 12,50 $, When il est enregistré puis relu, Then la valeur restituée est exactement
  12,50 $ (aucune dérive de flottant).
- Given une somme de plusieurs postes décimaux, When elle est totalisée, Then le total est exact au cent.

**P3 — File de traitement persistée et reprenable.** *Criticité : Haute.*
En tant qu'exploitant, je veux que les traitements asynchrones s'exécutent via une file **persistée**,
afin qu'aucun travail ne soit perdu si le serveur redémarre. *(§7-24)*
- Given un job enfilé non terminé, When le serveur redémarre, Then le job est **repris** et mené à terme.
- Given un job déjà terminé, When il est ré-exécuté, Then il n'a **aucun effet** supplémentaire (idempotence).
- Given un job qui échoue, When la limite de tentatives n'est pas atteinte, Then il est **réessayé** avec
  temporisation ; sinon il est marqué en échec et journalisé.

**P4 — Secrets hors du code.** *Criticité : Haute.*
En tant que responsable sécurité, je veux que tout secret (JWT, SMTP, plateforme externe) provienne
exclusivement de la configuration d'environnement, afin qu'aucun secret ne réside dans le code source.
*(§7-3/4)*
- Given le démarrage de l'application, When un secret requis est absent de la configuration, Then le
  démarrage échoue avec un message explicite (aucune valeur par défaut codée en dur).
- Given l'écriture de journaux, When un jeton ou un secret transite, Then il **n'apparaît jamais en
  clair** dans les journaux. *(§7-8)*

### Phase 1 — Auth, utilisateurs & RBAC

**P1 — Interdiction d'auto-attribution du rôle admin.** *Criticité : Haute.*
En tant que responsable sécurité, je veux que le rôle administrateur ne puisse jamais être accordé via
une requête d'inscription, afin d'empêcher toute élévation de privilège. *(§7-1)*
- Given une inscription dont le corps demande `isAdmin=true`, When le compte est créé, Then le compte est
  créé **non-administrateur**.
- Given un membre non-admin, When il tente de se promouvoir, Then l'opération est refusée.

**P2 — Un membre ne modifie que son propre profil.** *Criticité : Haute.*
En tant que membre, je veux ne pouvoir modifier que **mon** profil et uniquement des champs autorisés,
afin que mes données financières et mon rôle ne puissent être altérés ni par moi ni par un tiers. *(§7-2)*
- Given un membre connecté, When il modifie le profil d'un autre utilisateur, Then l'opération est refusée.
- Given un membre connecté, When il tente de modifier `isAdmin`, les soldes, l'abonnement ou les
  références RPN, Then ces champs sont **ignorés/rejetés**.

**P3 — Contrôle du rôle sur l'état courant.** *Criticité : Haute.*
En tant que responsable sécurité, je veux que les droits admin soient vérifiés sur l'**état courant en
base**, afin qu'une révocation prenne effet immédiatement. *(§7-7)*
- Given un administrateur dont le rôle vient d'être révoqué, When il appelle une route admin avec un jeton
  encore valide, Then l'accès est **refusé**.

**P4 — Réinitialisation de mot de passe liée à l'utilisateur.** *Criticité : Haute.*
En tant que membre, je veux réinitialiser mon mot de passe via un lien qui m'est propre, afin que
personne d'autre ne puisse l'utiliser. *(§7-5)*
- Given un jeton de réinitialisation émis pour l'utilisateur A, When il est utilisé pour l'identifiant B,
  Then l'opération est refusée.
- Given un nouveau mot de passe (quelle que soit sa complexité), When il est soumis avec sa confirmation
  identique, Then il est accepté (**aucune règle de robustesse imposée** — décision propriétaire).

**P5 — Message neutre au mot de passe oublié.** *Criticité : Moyenne.*
En tant que visiteur, je veux un message identique que l'adresse existe ou non, afin de ne pas révéler
l'existence d'un compte. *(PAGES `/forgot-password`)*
- Given une adresse inconnue, When je demande une réinitialisation, Then je vois le **même** message
  neutre que pour une adresse connue.

### Phase 2 — Comptes & moteur de transactions

**P1 — Chemin transactionnel unique et idempotent.** *Criticité : Haute.*
En tant qu'exploitant, je veux que tout mouvement d'argent passe par un chemin transactionnel unique
appliquant les mêmes invariants, afin de garantir la cohérence des soldes. *(§7-21, Workflow 2)*
- Given une transaction déjà appliquée, When elle est appliquée de nouveau, Then les soldes ne changent
  pas (idempotence `balanceApplied`).
- Given une transaction `fundType=both`, When elle est créée, Then elle n'est acceptée que si
  `membershipAmount + rpnAmount == amount`.

**P2 — Machine à états respectée.** *Criticité : Haute.*
En tant qu'administrateur, je veux que les transitions de statut d'une transaction soient contraintes,
afin d'éviter les états incohérents. *(Workflow 2)*
- Given une transaction `pending`, When je la confirme / rejette / échoue, Then elle passe respectivement
  `completed` / `rejected` / `failed`.
- Given une transaction dans un état final (`failed`/`rejected`/`refunded`), When une transition est
  tentée, Then elle est refusée.
- Given une transaction `awaiting_payment`, When un traitement direct est tenté, Then il est refusé tant
  qu'elle n'est pas passée `pending`.

**P3 — Annulation complète d'un crédit appliqué.** *Criticité : Haute.*
En tant qu'administrateur, je veux que le rejet/l'échec d'un crédit déjà appliqué annule **tous** ses
effets, afin qu'aucune activation ou inscription ne subsiste sans paiement. *(§7-22)*
- Given un crédit appliqué ayant activé l'adhésion et déclenché l'inscription RPN, When je le rejette,
  Then les soldes **et** l'activation d'adhésion **et** l'inscription RPN sont annulés.

**P4 — Unicité fiable de la référence Interac.** *Criticité : Haute.*
En tant qu'administrateur, je veux qu'une même référence Interac ne puisse jamais être enregistrée deux
fois (comptes et transactions confondus), afin d'empêcher les doubles saisies. *(WORKFLOWS §4)*
- Given une référence Interac déjà présente, When une transaction réutilise cette référence, Then la
  création est refusée (de façon fiable, y compris en cas de soumissions concurrentes).

**P5 — Montant recalculé côté serveur.** *Criticité : Haute.*
En tant que responsable financier, je veux que le montant dû soit recalculé et validé côté serveur,
afin que le montant fourni par le client ne soit jamais approuvé tel quel. *(§7-18)*
- Given un paiement soumis avec un montant, When il est traité, Then le serveur **recalcule** le montant
  attendu à partir du barème et **refuse** toute incohérence.

**P6 — Un seul compte par membre.** *Criticité : Haute.*
En tant qu'exploitant, je veux qu'un membre principal ait exactement **un** compte, afin d'éviter des
soldes dupliqués. *(WORKFLOWS §4)*
- Given un membre disposant déjà d'un compte, When un second compte est tenté pour lui, Then l'opération
  est refusée (contrainte d'unicité).

### Phase 3 — Adhésion (inscription, 1er paiement, renouvellement, partiel)

**P1 — Inscription atomique ou compensée.** *Criticité : Haute.*
En tant que nouveau membre, je veux qu'à la fin de l'inscription mon compte existe et que je reçoive mes
identifiants, afin de ne jamais rester dans un état intermédiaire inutilisable. *(Workflow 1)*
- Given une inscription qui échoue à mi-parcours, When le processus s'arrête, Then soit tout est annulé,
  soit une reprise idempotente garantit **utilisateur + compte + transaction initiale + envoi du mot de
  passe**.
- Given une inscription réussie, When elle se termine, Then le compte est créé `isAwaitingFirstPayment`
  et l'utilisateur reçoit son mot de passe.

**P2 — Barème création vs renouvellement.** *Criticité : Haute.*
En tant que membre, je veux payer, **à la création** (10 $ + adhésion selon profession + provision
RPN) et **au renouvellement** (5 $/personne + adhésion selon profession, **sur facture** donc le lien de facturation est envoyé par courriel pour faciliter l'enregistrement),
 afin que ma cotisation reflète le barème. *(correction Étape 1bis.A ; §0, WORKFLOWS 3/7)*
- Given une création de compte, When le montant est calculé pour une personne active, Then il inclut
  10 $ de traitement + l'adhésion profession (étudiant/sans emploi/parent résident 25 $, travailleur
  50 $, mineur 0 $) + la provision RPN (≥ 20 $).
- Given un renouvellement annuel, When la facture est générée, Then elle vaut **5 $/personne active +
  l'adhésion selon profession**, à **payer réellement** (pas d'auto-prélèvement d'un solde prépayé) en entrant le dit montant avec code interact dans l'application.
- Given une personne « sans emploi », When son adhésion de création est calculée, Then elle est facturée
  au tarif étudiant (25 $).

**P3 — Âge sur la date de naissance complète.** *Criticité : Moyenne.*
En tant que responsable facturation, je veux que l'âge soit calculé sur la date de naissance complète,
afin que l'éligibilité (≥ 18 ans) soit exacte. *(§7-28)*
- Given une personne qui atteint 18 ans plus tard dans l'année, When l'âge est évalué avant son
  anniversaire, Then elle est considérée comme **mineure**.

**P4 — Éligibilité cohérente (status + rpnStatus).** *Criticité : Haute.*
En tant que responsable facturation, je veux des critères **explicites et cohérents** pour « personne
active » = membership à jour et « personne couverte RPN » = solde rpn renfloué, 
afin d'éviter les écarts entre facturation et couverture. *(§7-17)*
- Given une personne inactive, When on détermine la facturation adhésion et la couverture RPN, Then les
  deux appliquent des règles cohérentes et documentées sur `status` et `rpnStatus`.

**P5 — Facturation partielle des ajouts en cours d'année.** *Criticité : Moyenne.*
En tant que responsable facturation, je veux facturer une personne à charge ajoutée par un membre après son paiement annuel, afin de la
couvrir sans re-payer toute l'unité familiale. *(Workflow 7)*
- Given une personne ajoutée après le paiement annuel (`membershipCoveredThisYear=null`), When je paie sa
  facturation partielle et qu'un admin la confirme, Then **seule** cette personne passe couverte pour
  l'année.

### Phase 4 — Fonds RPN & notrerpn.org

**P1 — `enrolled` seulement après référence externe.** *Criticité : Haute.*
En tant qu'exploitant, je veux qu'un membre principal et sa famille ne soit marqué `enrolled` qu'après confirmation de
sa référence sur notrerpn.org, afin de pouvoir le lier à ses personnes à charge lors de leur l'inscription. *(§7-23, Workflow 4)*. Cette liasion est un lien de parenté
selon les codes (conjoint, enfant, parent) defini par des ids dans notrerpn.org.
- Given un paiement RPN au-dessus du seuil, When l'inscription externe **échoue**, Then le principal
  n'est **pas** laissé `enrolled` sans référence et une relance est possible.
- Given une inscription externe réussie, When la référence est obtenue, Then le principal devient
  `enrolled` **et** ses personnes à charge sont inscrites à l'externe.
- Given une personne prinicipale avec incription externe réussi, When personne à
   charge, Then(étape précedente) inscription externe avec lien de parenté et devient enrolled

**P2 — Fiabilisation des appels externes.** *Criticité : Haute.*
En tant qu'exploitant, je veux que les appels notrerpn.org soient réessayés et idempotents, afin que les
échecs transitoires n'entraînent pas de désynchronisation silencieuse. *(§7-23, PROCESSUS sync externe)*
- Given un appel externe qui échoue transitoirement, When la file le réessaie, Then l'inscription/
  (dé)activation aboutit sans doublon.
- Given des échecs persistants, When la limite est atteinte, Then l'anomalie est **signalée** (journal +
  alerte admin), pas seulement journalisée en silence.
- Given alerte admin, When consulte depuis son interface, Then l'admin fait une inscription manuel
  et ajoute manuellement le matricule et reference à la personne en échec et le
  statut devient enroller. Par conséquent l'alerte n'est plus visible.

**P3 — Cycles de désactivation indépendants.** *Criticité : Haute.*
En tant que responsable facturation, je veux qu'une insuffisance de fonds RPN ne désactive pas l'adhésion d'un foyer (et
inversement) mais la couverture rpn, afin que les deux couvertures soient gérées séparément. *(§7-15/16)*
- Given une insuffisance RPN, When le compteur d'échecs RPN progresse, Then le foyer perd sa couverture décès.
- Given une désinscription RPN du principal pour solde insuffisant, When elle survient, Then les
  personnes à charge conservent leur couverture (indépendance).

**P4 — Opt-in / opt-out RPN par personne.** *Criticité : Moyenne.*
En tant que membre, je veux inscrire ou désinscrire du RPN moi-même et chaque personne à charge
**indépendamment**, afin d'ajuster la couverture au besoin. *(Workflow 4, PAGES `/profil/couverture`)*
- Given une personne `enrolled`, When je demande sa désinscription et confirme, Then elle passe
  `unsubscribed` et est désactivée sur notrerpn.org.
- Given une bascule de couverture d'une personne à charge, When elle est effectuée, Then elle passe par
  une **API ciblée par membre** (sans réécrire tout le document utilisateur). *(§7-2)*

### Phase 5 — Annonces de décès & prélèvement

**P1 — Prélèvement idempotent et reprenable.** *Criticité : Haute.*
En tant qu'administrateur, je veux qu'un prélèvement décès soit repris après un redémarrage et jamais
appliqué deux fois, afin de garantir l'exactitude des débits. *(§7-24, Workflow 5)*
- Given un traitement de décès interrompu par un redémarrage, When le service repart, Then le traitement
  **reprend** sans re-débiter les membres déjà débités.
- Given une annonce déjà `completed`, When son traitement est relancé, Then aucun débit supplémentaire
  n'a lieu.

**P2 — Débit via le chemin transactionnel unique.** *Criticité : Haute.*
En tant qu'exploitant, je veux que les débits de décès empruntent le moteur de transactions commun, afin
qu'ils respectent les mêmes invariants et l'idempotence. *(§7-21)*
- Given un débit de décès, When il est appliqué, Then il crée une transaction avec un **statut explicite**
  et via le chemin unique (pas de mise à jour de solde directe hors moteur).

**P3 — Gestion des soldes insuffisants.** *Criticité : Haute.*
En tant qu'administrateur, je veux que les membres au solde RPN insuffisant soient comptés, avertis et,
au-delà d'un seuil, désinscrits, afin de maintenir le fonds cohérent. *(Workflow 5)*
- Given un membre au solde RPN insuffisant lors d'un décès, When le traitement s'exécute, Then
  un avis de désinscription est émis et il est désinscrit.
- Given un foyer au solde RPN insuffisant lors d'un décès, When le nouveau solde négatif, Then
  ce montant est considérer comme une dette qu'il doit payer à la prochaine recharge.
- Given le récapitulatif de traitement, When il se termine, Then il expose montants attendu/collecté,
  débits réussis, insuffisances, comptes manquants et erreurs système.

**P4 — Notification aux membres.** *Criticité : Moyenne.*
En tant que membre, je veux être notifié d'une annonce de décès, afin d'être informé de la solidarité en
cours. *(Workflow 5)*
- Given une annonce traitée, When le traitement se termine, Then chaque foyer via l'adresse de son membre principale
  reçoit la notification (les échecs d'envoi n'interrompent pas le traitement).

### Phase 6 — Tâches planifiées

**P1 — Crons à l'heure du Québec, la nuit.** *Criticité : Haute.*
En tant qu'exploitant, je veux que les tâches planifiées s'exécutent à l'heure du Québec, la nuit vers
2h, afin qu'elles tournent en période calme quel que soit le fuseau du serveur. *(§0, PROCESSUS [Cron])*
- Given un serveur dans un autre fuseau, When une tâche planifiée se déclenche, Then elle s'exécute selon
  `America/Toronto` à l'heure nocturne configurée.

**P2 — Isolation des échecs par compte.** *Criticité : Haute.*
En tant qu'exploitant, je veux qu'un échec sur un compte n'interrompe pas le traitement des autres, afin
que le lot aille toujours à son terme. *(PROCESSUS [Cron] Cotisation annuelle)*
- Given un compte qui provoque une erreur pendant la cotisation annuelle, When le cron s'exécute, Then ce
  compte est journalisé en erreur et les **autres comptes sont tout de même traités**.
- Given compte est journalisé en erreur, When de son interface admin, Then l'admin
  peut traiter manuellement le problème.

**P3 — Idempotence annuelle de la cotisation.** *Criticité : Haute.*
En tant que membre déjà à jour, je veux ne pas être prélevé deux fois la même année, afin d'éviter tout
double débit. *(Workflow 3)*
- Given un membre dont l'adhésion de l'année est déjà réglée, When le cron s'exécute de nouveau, Then il
  est **sauté** (aucun nouveau débit).

**P4 — Rappel RPN bas avec règle unique.** *Criticité : Moyenne.*
En tant que membre, je veux être averti quand mon solde RPN passe sous le seuil, sans être spammé, afin
de le réalimenter à temps. *(§0, Workflow 6)*
- Given un solde RPN `≤ 5 $/personne`, When le rappel **hebdomadaire du samedi** s'exécute, Then un
  avertissement **purement informatif** est émis (n'incrémente aucun compteur). *(correction Étape 1bis.A)*
- Given un solde RPN `≤ 1 $`, When il est constaté, Then la personne est **désinscrite immédiatement**
  (mécanisme distinct du rappel) avec courriel.

### Phase 7 — Frontend membre

**P1 — Gardes d'accès alignées sur le serveur.** *Criticité : Haute.*
En tant que membre, je veux être redirigé correctement selon mon état (connecté, inactif, premier
paiement), afin d'accéder uniquement à ce qui m'est permis. *(PAGES rappels transverses)*
- Given un utilisateur non connecté, When il ouvre une page protégée, Then il est redirigé vers la
  connexion avec retour prévu.
- Given un foyer donc l'adhésion est `inactive`, When il navigue, Then il est restreint à la page
  facturation et personne à charge pour lui permettre de renflouer.
- Given un compte en attente du 1er paiement, When il navigue hors des pages autorisées, Then il est
  ramené à l'onboarding.

**P2 — Facturation reflétant le barème cible.** *Criticité : Haute.*
En tant que membre, je veux que l'écran de facturation applique le barème création/renouvellement, afin
de payer le juste montant. *(§0, PAGES `/billing`)*
- Given un renouvellement, When j'ouvre la facturation, Then je vois 5 $/personne active + l'adhésion
  (25/50 $ ou 0$ pour ceux exemptés).
- Given une personne dont l'adhésion n'est pas sélectionnée, When je tente de sélectionner son RPN, Then
  c'est **désactivé**.

**P3 — Blocages explicites plutôt que silencieux.** *Criticité : Moyenne.*
En tant que visiteur en cours d'inscription, je veux un message clair si une étape est invalide, afin de
ne pas progresser dans un état incohérent. *(PAGES `/origines`)*
- Given un jeton d'inscription invalide/absent, When je tente de continuer, Then la progression est
  **bloquée avec un message clair** (pas d'échec silencieux).
- Given un input invalide, When il perd le focus, Then message d'erreur claire en
  dessous de l'input.

**P4 — Bascule de couverture par API ciblée.** *Criticité : Moyenne.*
En tant que membre, je veux basculer la couverture RPN d'une personne à charge sans risque d'écraser
d'autres données, afin de préserver l'intégrité de mon profil. *(§7-2, PAGES `/profil/couverture`)*
- Given une bascule RPN d'une personne à charge, When je la déclenche, Then seule cette donnée est
  modifiée (aucune réécriture du document complet).

### Phase 8 — Frontend admin & paramètres

**P1 — Validation des paiements Interac.** *Criticité : Haute.*
En tant qu'administrateur, je veux confirmer, rejeter ou rembousser un dépôt Interac, afin d'appliquer ou
d'annuler ses effets sur le compte et notifer le membre. *(Workflow 2, PAGES `/admin/transactions`)*
- Given une transaction `pending`, When je la confirme, Then les soldes sont crédités et l'adhésion/le RPN
  activés selon le `fundType`.
- Given une transaction `pending`, When je la rejette, Then les soldes de l'adhésion/le RPN ne change pas.
- Given une transaction `completed` (RPN/both), When je la rembourse, Then seule la **part RPN** est
  remboursable, plafonnée au restant.
- Given une transaction `pending` (RPN/both), When je la rembourse, Then seule la **part RPN** est
  remboursable, plafonnée au restant.

**P2 — Publication et suivi d'un décès.** *Criticité : Haute.*
En tant qu'administrateur, je veux publier une annonce de décès et suivre le prélèvement en direct, afin
de vérifier son bon déroulement. *(Workflow 5, PAGES `/admin/announcements`)*
- Given une annonce publiée, When le traitement s'exécute, Then je vois son état évoluer (pending →
  processing → completed/failed) et le récapitulatif (montant attendu/collecté, insuffisances, erreurs).

**P3 — Relance des inscriptions RPN bloquées.** *Criticité : Moyenne.*
En tant qu'administrateur, je veux relancer manuellement les inscriptions RPN en échec, afin de rétablir
la synchronisation avec notrerpn.org. *(PAGES `/admin/relancer-rpn-en-echec`)*
- Given un principal bloqué (`enrolled` sans référence ou en attente), When je le synchronise, Then
  l'inscription externe est retentée ; la synchro d'une personne à charge reste bloquée tant que le
  principal n'est pas synchronisé.
- Given principale bloqué et la synchro d'une personne à charge reste bloquée, When
  l'administrateur notifié, Then le fait manuellement dans son interface dédié.

**P4 — Réglage des montants.** *Criticité : Moyenne.*
En tant qu'administrateur, je veux régler les montants et seuils, afin de piloter le barème sans
intervention technique. *(PAGES `/admin/transactions` réglages)*
- Given une modification d'un montant, When je l'enregistre, Then les calculs ultérieurs utilisent la
  nouvelle valeur (source unique).

### Phase 9 — Migration des données (Ne pas implémenter cette section sans mon avis)

**P1 — Migration idempotente et rejouable.** *Criticité : Haute.*
En tant qu'exploitant, je veux des scripts de migration rejouables sans effet de bord, afin de sécuriser
la bascule. *(WORKFLOWS §4)*
- Given une migration déjà appliquée, When elle est relancée, Then elle ne modifie pas davantage les
  données (idempotence) et produit un **rapport** des enregistrements corrigés/ignorés.

**P2 — Déduplication et unicité des comptes.** *Criticité : Haute.*
En tant qu'exploitant, je veux garantir un compte unique par membre après migration, afin de supprimer
les soldes dupliqués. *(WORKFLOWS §4)*
- Given des comptes dupliqués legacy pour un même membre, When la migration s'exécute, Then il ne reste
  qu'un compte par membre et l'unicité est **contrainte** en base.

**P3 — Normalisation des statuts legacy.** *Criticité : Moyenne.*
En tant qu'exploitant, je veux normaliser les statuts et statuts RPN historiques, afin d'obtenir des
données cohérentes. *(WORKFLOWS §1, §3 ; Angles morts « success »)*
- Given des transactions au statut `success` legacy, When la migration s'exécute, Then elles deviennent
  `completed`.
- Given des personnes à charge avec `rpnStatus` manquant mais référence externe présente, When la
  migration s'exécute, Then leur `rpnStatus` est dérivé de façon cohérente.

---

## Étape 4 — Tests de non-régression fonctionnelle par phase

> À écrire avant/pendant l'implémentation (TDD léger). Couverture minimale : règles de validation,
> transitions d'états, contraintes transversales, processus non-UI critiques (idempotence, échecs).

> **Mise à jour 2026-07-05** : tests alignés sur l'**Étape 1bis** (barème de renouvellement corrigé,
> facture réelle, Claude Vision, seuils RPN, parrainage, membre du bureau, promotion).

- **Phase 0** : lecture d'un paramètre `0` vs non configuré (`??` et non `||`) ; arithmétique
  monétaire au cent (12,50 $ aller-retour, sommes) ; file — reprise après redémarrage simulé, double
  exécution sans effet, retry avec backoff puis échec définitif ; démarrage refusé si secret absent ;
  absence de jeton/secret dans les journaux.
- **Phase 1** : `isAdmin`/rôle demandé à l'inscription ignoré (compte créé **membre**) ; modification
  de profil tiers refusée ; champs sensibles (rôle/soldes/subscription/refs RPN) non modifiables par un
  membre ; jeton de reset lié à l'utilisateur (A≠B refusé) ; mot de passe faible **accepté** (pas de
  règle) ; message neutre au mot de passe oublié ; révocation de rôle effective immédiatement ;
  **rôle « membre du bureau »** : attribué par un admin, **exonéré d'adhésion (lui + famille) mais
  soumis au RPN**, **sans** accès aux consoles d'administration.
- **Phase 2** : transitions autorisées/refusées de la machine à états (matrice complète) ; idempotence
  `apply` ; invariant `both` ; unicité `refInterac` (y compris soumissions concurrentes) ; rollback
  **complet** (soldes + adhésion + RPN) au rejet/échec ; **recalcul serveur du total attendu** ;
  **montant reçu < total attendu → refusé** ; **surplus affecté au solde RPN** (ex. 55 $ pour 45 $ dû
  = +10 $ RPN) ; **validation automatique par Claude Vision** (preuve valide → `completed`) avec
  **repli sur validation manuelle admin** ; unicité `Account.userId`.
- **Phase 3** : inscription atomique/compensée (échec partiel → pas d'utilisateur sans compte) ;
  barème **création** (10 $ + adhésion profession + provision RPN ≥ 20 $) **vs renouvellement**
  (**5 $/personne + adhésion selon profession**, sur **facture réelle**, **jamais** un auto-prélèvement
  d'un solde prépayé) ; profession **« sans emploi » = 25 $** (titulaire **et** personnes à charge) ;
  **ajout d'une personne en cours d'année facturé au tarif de création** ; **mise à jour des
  professions** (redemande à 2 ans ; étudiant → travailleur **auto à 5 ans** sauf médecine/doctorat) ;
  **parrainage-réduction** (-50 % adhésion parrain à N+1 **seulement si filleul payé/actif** ;
  cumulable et **plafonné au total des adhésions du foyer** ; **non rétroactive** ; **non reportable
  > 1 an** ; annulable par admin ; filleul non payé → aucune réduction) ; âge sur date complète ;
  cohérence facturé/couvert (`status` + `rpnStatus`) ; facturation partielle ne couvrant que les
  membres ciblés.
- **Phase 4** : échec d'inscription externe → principal **non** `enrolled` sans référence + relance
  possible ; retry idempotent des appels externes ; alerte après échecs persistants ; **couverture RPN
  accordée uniquement si payé/exempté** ; **désinscription immédiate dès solde RPN ≤ 1 $** (courriel),
  **distincte** de l'**alerte** à 5 $/personne ; indépendance des cycles de désactivation adhésion/RPN ;
  désinscription du principal n'affecte pas les personnes à charge ; **`notrerpn.org` fait foi** —
  réconciliation automatique et **correction manuelle** par saisie `matricule`/`référence` ; bascule
  par API ciblée.
- **Phase 5** : **aucune preuve de décès requise** ; reprise après redémarrage sans double débit ;
  idempotence sur annonce `completed` ; débit via chemin unique avec statut explicite ; foyer au solde
  insuffisant → **désinscription immédiate** (personnes à charge comprises) + **régularisation
  rétroactive** possible ; solde négatif = **dette** (modalités **à valider**) ; **équité par personne**
  (grande famille paie plus) ; exactitude du récapitulatif ; échec d'envoi n'interrompant pas le
  traitement.
- **Phase 6** : déclenchement au fuseau `America/Toronto`, la nuit ; isolation d'un échec par compte ;
  **renouvellement = génération de facture + relances ~2 mois** (janvier → mi-février), **pas** un
  auto-prélèvement ; **désactivation + désinscription RPN** si pas de paiement à l'échéance ;
  idempotence annuelle (foyer à jour sauté) ; **rappel RPN hebdomadaire (samedi), purement informatif**
  (n'incrémente aucun compteur) ; **désinscription RPN ≤ 1 $** traitée séparément du rappel.
- **Phase 7** : redirections des gardes (non connecté / inactif / 1er paiement) ; facturation
  affichant le **barème création/renouvellement corrigé** (5 $ + adhésion) ; RPN désactivé si adhésion
  non cochée ; **écran de parrainage** listant les filleuls + **montant de réduction prévu** ; blocage
  explicite sur jeton d'inscription invalide ; bascule couverture sans réécriture globale.
- **Phase 8** : confirm/reject/refund appliquant les bons effets ; remboursement limité à la part RPN ;
  suivi d'état d'un décès ; **réglage des montants** répercuté (source unique) ; blocage de la synchro
  famille tant que le principal n'est pas synchronisé.
- **Phase 9** : idempotence de rejeu ; unicité des comptes post-migration ; `success`→`completed` ;
  dérivation `rpnStatus` ; retrait des données `Card`/Événements/`expired` ; rapport de migration produit.
- **Phase 10** : promotion(indépendance) d'une personne à charge → titulaire : nouveau compte **conserve son
  matricule/couverture `notrerpn.org` si active**, **historique non transféré**, le titulaire d'origine
  **cesse de la porter** ; sort du solde RPN rattaché.

---

## Étape 5 — Risques de plan

1. **Phase 4 (notrerpn.org) — intégration externe bloquante.** Le cycle RPN dépend d'une plateforme
   tierce non maîtrisée. **Risque** : indisponibilité/instabilité de l'API bloque la validation de fin
   de phase. **Alternative** : livrer d'abord le **cycle RPN interne** (états, seuils, indépendance des
   désactivations) derrière une **façade d'intégration simulable** (contrat + double de test), puis
   brancher l'API réelle en incrément — la file persistée rendant la synchro rattrapable a posteriori.
2. **Phase 0/2 — le socle transactionnel + file conditionne presque tout.** Les phases 3, 5, 6 en
   dépendent. **Risque** : un retard ou une refonte tardive du chemin monétaire se propage partout.
   **Alternative** : figer tôt le **contrat du moteur de transactions** (interface + invariants + tests)
   et le **contrat de la file** avant les phases métier, quitte à démarrer la Phase 4 en parallèle sur
   la base de ces contrats.
3. **Ordre back → front (Phases 7–8 après 1–6).** **Risque** : découverte tardive d'incohérences
   d'API. **Alternative** : développer chaque écran **en parallèle** dès que son API est stable
   (inscription/auth dès Phase 1, facturation dès Phase 3, admin transactions dès Phase 2), en
   s'appuyant sur des contrats d'API versionnés. À arbitrer selon la taille de l'équipe.
4. **Phase 9 (migration) — dépend de décisions non tranchées.** Cascade de soft-delete
   (`Account`/`Transaction` d'un `User` supprimé) et conservation d'historique ne sont pas documentées
   (WORKFLOWS §4). **Risque** : migration conçue sur des hypothèses fausses. **Alternative** : produire
   `MIGRATION_DONNEES.md` **avant** de figer le schéma cible, et traiter la déduplication des comptes
   comme un chantier à part (volumétrie inconnue — **hypothèse à valider**).
5. **Courriels comme dépendance transverse.** Beaucoup de phases émettent des courriels ; si le service
   enfilé n'est pas prêt en Phase 0, les phases 1–6 devront simuler l'envoi. **Alternative** : livrer le
   **service courriel enfilé dès la Phase 0** (déjà prévu) et n'ajouter que les gabarits par phase.

---

## Étape 6 — Analyse comparative marché / systèmes similaires — À VALIDER

> Recommandations **optionnelles**, séparées du plan de base. À **ne pas** intégrer aux user stories
> ci-dessus sans validation explicite du propriétaire. Chaque piste part d'une limite concrète
> documentée. Effort (Faible/Moyen/Élevé) et bénéfice indiqués.

### Analyse comparative marché — ✅ RETENU (décision 2026-07-05, voir Étape 1 + Phases 0/2) — Registre comptable en partie double (ledger)
- **Limite observée** : les soldes sont des champs **mutables** (`membership_balance`, `rpn_balance`)
  débités/crédités par `$inc` et corrigés par des transactions ad hoc, avec un prélèvement décès qui
  contournait le chemin unique *(WORKFLOWS 2/5 ; §7-21 ; PROCESSUS « Correction de solde »)*.
- **Piste** : adopter un **grand livre en partie double** (écritures immuables, solde = somme des
  écritures) comme dans les systèmes de paiement/mutualistes. Élimine les corrections destructives,
  fournit un audit natif et une reconstruction des soldes.
- **Décision** : **RETENU** — implémenté sur MongoDB (collection `LedgerEntry` append-only, écritures
  équilibrées, soldes dérivés). La **modélisation des personnes couvertes en entité de premier plan**
  est également retenue (refonte domaine, Étape 1). Voir l'**ERD cible** FONCTIONNEL_WORKFLOWS §3bis.
- **Effort** : Élevé. **Bénéfice** : intégrité et auditabilité financières fortes ; base saine pour la
  conformité.

### Analyse comparative marché — ✅ DÉCIDÉ (intégré au plan de base, voir Étape 1bis.A) — Rapprochement Interac automatisé
- **Limite observée** : validation **100 % manuelle** des paiements Interac par un admin *(WORKFLOWS 2 ;
  FONCTIONNEL_GLOBAL §0 : souhait d'automatisation, lecture de preuve par Claude Vision ou toute approche à déqouite; des captures seront fournit pour avoir une idée de ce que les utilisateur envoie souvent; Angles morts)*.
- **Piste** : rapprochement semi-automatique (analyse des courriels de confirmation Interac et/ou OCR de
  la preuve via un service de vision), proposant un appariement montant/référence à l'admin pour
  validation — pratique courante des logiciels de trésorerie associatifs.
- **Effort** : Moyen à Élevé. **Bénéfice** : réduction drastique de la charge admin et des délais
  d'activation ; moins d'erreurs de saisie.
- **Réponse coût/faisabilité (2026-07-05)** : **oui, ~0 $/an** via l'**ingestion des courriels de
  confirmation Interac** reçus par l'association (montant + nom + référence) — Gmail API/IMAP
  **gratuit**, rapprochement automatique avec la facture/paiement en attente. **Bien sous 10 $ CAD/an.**
  Le **courriel de la banque fait foi** (argent réellement reçu), contrairement à une capture du membre.
  → **Automatisation principale = courriels Interac** ; **Claude Vision** (capture) = **repli** (coût
  par appel). **Résolu (2026-07-05)** : le courriel de confirmation contient **le même numéro de
  référence que celui saisi par le membre** → **rapprochement déterministe par référence** (+ contrôle
  du montant). Introduit le **1er flux entrant** (PROCESSUS « Webhooks entrants »).

### Analyse comparative marché — ✅ DÉCIDÉ — Synchronisation externe par outbox/événements
- **Limite observée** : synchro notrerpn.org **fire-and-forget**, états incohérents possibles
  (`enrolled` sans référence) *(WORKFLOWS 4 ; §7-23 ; PROCESSUS sync externe)*.
- **Piste** : **transactional outbox + réconciliation périodique** (comparaison d'état local ↔ distant),
  motif standard d'intégration de systèmes distribués — déjà partiellement adressé par la file
  persistée du plan de base, mais la **réconciliation active** irait plus loin.
- **Effort** : Moyen. **Bénéfice** : cohérence garantie à terme, détection proactive des écarts.

### Analyse comparative marché — ✅ DÉCIDÉ → Nouvelle Phase 10 (voir Étape 1bis.B) — Promotion d'une personne à charge en titulaire
- **Limite observée** : **aucun workflow** ne permet de transformer une personne à charge en membre
  autonome (couple séparé, enfant devenu adulte), souhait explicite *(FONCTIONNEL_GLOBAL §0 ; WORKFLOWS
  §4 Angles morts, confirmé par le propriétaire)*.
- **Piste** : parcours de **détachement/portabilité** transférant identité, historique et **référence/
  matricule RPN** vers un nouveau `User`, à l'image des scissions de compte familial dans les
  mutuelles/assurances.
- **Effort** : Moyen à Élevé. **Bénéfice** : couvre un besoin réel du cycle de vie familial ; évite les
  doublons et la perte de couverture. **valider** : règles de conservation du matricule notrerpn.org.

---

## Tableau récapitulatif

| Phase | Modules | Criticité | Dépendances | Livrable | ~US |
|---|---|---|---|---|---|
| 0 | Fondations : Nest, Atlas, Paramètres, monnaie, file persistée, courriel, logs, i18n, CI | Haute | — | Socle démarrable + file/idempotence + barème unique testés | 4 |
| 1 | Auth, Utilisateurs, RBAC, reset mot de passe | Haute | Phase 0 | API auth + RBAC + reset lié à l'utilisateur, testés | 5 |
| 2 | Comptes financiers, moteur de transactions (machine à états) | Haute | Phases 0, 1 | Moteur transactions Interac idempotent + machine à états testée | 6 |
| 3 | Adhésion : inscription, 1er paiement, renouvellement, partiel | Haute | Phases 2, 1 | Cycle d'adhésion (création + renouvellement 5 $/pers. + partiel) | 5 |
| 4 | Fonds RPN & synchro notrerpn.org | Haute | Phases 2, 0, 3 | Cycle RPN synchronisé fiable (file persistée), sans état incohérent | 4 |
| 5 | Annonces de décès & prélèvement en masse | Haute | Phases 4, 2, 0 | Prélèvement décès idempotent, reprenable, chemin unique | 4 |
| 6 | Tâches planifiées (crons) | Haute / Moyenne | Phases 3, 4, 2 | 3 crons heure Québec, idempotents, isolés par compte | 4 |
| 7 | Frontend membre (SPA) | Haute | Phases 1–4 | Parcours membre complet contre nouvelles APIs | 4 |
| 8 | Frontend admin & paramètres | Haute | Phases 2, 4, 5, 6 | Consoles admin (transactions, décès, RPN, réglages) | 4 |
| 9 | Migration des données legacy & bascule | Haute | Phases 1–6 + décisions propriétaire | Scripts idempotents + MIGRATION_DONNEES.md + bascule contrôlée | 3 |
| 10 | Promotion d'une personne à charge en titulaire (NOUVEAU) | Moyenne | Phases 1–4 | Parcours de détachement/portabilité (matricule RPN conservé) | 1–2 |

> **Total indicatif** : ~43 user stories **+ les ajouts de l'Étape 1bis.B** (Membre du bureau,
> Parrainage-réduction, mise à jour des professions, Promotion) ≈ **~48**. Les comptes sont
> **approximatifs** et destinés à cadrer la discussion, pas à engager un chiffrage. Voir **Étape 1bis**
> pour les corrections et ajouts issus des décisions du 2026-07-05.

---

## Hypothèses à valider (récapitulatif)

- **Architecture des données (2026-07-05) — ✅ DÉCIDÉ** : MongoDB Atlas conservé, **Mongoose/Typegoose**
  (**Prisma écarté**), **refonte domaine** (entités de premier plan), **grand livre en partie double**, bref prendre l'option A.
  La **convention monétaire**: `Decimal128`.
- **`MIGRATION_DONNEES.md` absent** : à produire ; les dépendances de migration sont dérivées de
  l'ERD/contraintes (WORKFLOWS §3–4).
- **Cascade soft-delete** (`Account`/`Transaction` d'un `User` supprimé) et **conservation
  d'historique** : non documentées → à trancher avant la Phase 9.
- **Volumétrie des données legacy** (comptes dupliqués, transactions `success`, `rpnStatus` manquants) :
  inconnue → impacte l'effort de la Phase 9.
- **Automatisation Interac** : faisabilité côté fournisseur **à confirmer** (Étape 6).
- **Nombres de user stories** : indicatifs, à affiner lors du découpage détaillé.

## Réponse hypothèses ✅ DÉCIDÉS
- **`MIGRATION_DONNEES.md` absent** : pas besoin pour le moment car la nouvelle BD n'a pas encore été défini.
- **Cascade soft-delete** : l'historique doit être archiver et consultable dans une certaine mesure.
**Automatisation Interac** : lorsqu'une personne fait un interact au nom de l'association on recoit un
   courriel avec montant, nom de la personne et numéro de référence. Cela permet-il de faire une automatisation
   autrement et à coût minime d'un maximum de (10$ CAD dans l'année)?
- **Nombres de user stories** : indicatif, car en codant tu peux faire des propositions sur les manquements
   mais doivent clairement être mentionner comme nouvelle ajout non repertorier ici. Et si l'idée est approuvé l'ajouter dans ce plan.
