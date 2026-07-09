# BESOIN_AFFAIRE — `mon-rpn-react`

> **But de ce document** : décrire, en langage d'**affaire** (non technique), ce que font de bout en
> bout les **fonctionnalités phares** de l'application, pour te permettre de repérer rapidement les
> **erreurs de compréhension côté affaire** avant le développement. Il synthétise
> [FONCTIONNEL_GLOBAL.md](FONCTIONNEL_GLOBAL.md), [FONCTIONNEL_WORKFLOWS.md](FONCTIONNEL_WORKFLOWS.md),
> [FONCTIONNEL_PROCESSUS.md](FONCTIONNEL_PROCESSUS.md) et [PLAN_IMPLEMENTATION.md](PLAN_IMPLEMENTATION.md)
> et remplace la lecture détaillée du plan pour la validation métier.
>
> **Comment lire** : chaque fonctionnalité suit le même gabarit —
> **En bref** · **Déroulé de bout en bout** · **Règles d'affaire clés** · **⚠ Points de vigilance
> affaire (à valider)**. Les « points de vigilance » sont les endroits où l'implémentation actuelle,
> le plan ou la documentation **pourraient avoir mal interprété le besoin** : ce sont les cases à
> vérifier en priorité. Rien n'y est affirmé par supposition — les incertitudes sont marquées
> **« à confirmer »**.

---

## 0. Le modèle d'affaire en une page

L'application sert une **association d'entraide communautaire** (ACQ, communauté camerounaise du
Québec). Elle gère **deux produits distincts** pour chaque foyer :

1. **L'adhésion à l'association** (« membership ») — un droit d'appartenance payé **à la création** du
   compte puis **renouvelé** chaque année. C'est ce qui rend un membre « actif » (le titulaire et
   ses personnes à charge).
2. **La couverture décès / fonds de solidarité (« RPN »)** — chaque personne couverte (le titulaire et
   ses personnes à charge) est protégée par un **fonds d'entraide** : quand un membre de la communauté
   décède, une **contribution de solidarité** est prélevée sur chaque foyer pour soutenir la famille
   endeuillée.

Deux notions financières par foyer :
- Un **solde adhésion** : sert à régler la cotisation annuelle.
- Un **solde RPN** : une **provision** dans laquelle sont puisées les contributions à
  chaque décès. Quand elle se vide, le membre la **réalimente à la demande** sinon est désinscrit.

Le **paiement** se fait exclusivement par **virement Interac** pour le moment: le membre envoie l'argent et saisit
sa référence ;  un **cloude vision valide automatiquement** que l'argent est bien reçu via la capture de la preuve 
de paiement fournit par le membre (mais en cas problème quelquonque **un administrateur valide manuellement**), 
ce qui **crédite** le compte du foyer et **active** l'adhésion et/ou la couverture des personnes couvertent.

Une **plateforme partenaire externe, `notrerpn.org`**, tient le registre officiel des personnes
couvertes en cas de décès : l'application y **inscrit / active / désactive** automatiquement chaque personne au fil des
paiements et des choix de couverture.

> **⚠ Point de vigilance affaire #0 (fondamental) — Où se verse réellement la prestation décès ?**
> L'application **collecte** des contributions (elle débite le solde RPN de chaque foyer à chaque
> décès) mais **ne décrit nulle part le versement de la prestation** à la famille endeuillée (montant
> reçu, canal, délai). **À confirmer** : la prestation est-elle entièrement gérée par `notrerpn.org`
> (l'application ne servant qu'à collecter et à tenir à jour l'adhésion), ou l'association verse-t-elle
> elle-même quelque chose ? Le rôle exact du **solde RPN local** vs le **registre notrerpn.org** doit
> être clarifié : sont-ils deux vues d'un même fonds, ou deux mécanismes parallèles ? C'est la zone la
> plus susceptible de malentendu.

> **Réponse au point de vigilance**
> Une fois le montant collecter, ceux-ci sont reversés à l'administrateur de `notrerpn.org` qui se chargera 
> de le remettre à la famille. En effet, nous sommes plusieurs Associations qui ont souscrit pour nos membres 
> au RPN via `notrerpn.org`, donc nous collectons juste et tenons à jour les adhésion pour ne pas perdre de 
> l'argent. Ainsi le rôle exact du **solde RPN local** est de gérer notre celulle associative alors que 
> le **registre notrerpn.org** gère d'autres cellules associative et ces l'argent recolté de tous qu'il reverse 
> à la famille éprouvée.

---

## 1. Inscription d'un nouveau membre (de la saisie à la réception du mot de passe)

**En bref** — Un visiteur remplit un formulaire en 4 étapes ; à la fin, son compte est créé « en
attente de premier paiement » sachant que l'application lui **génère automatiquement un mot de passe** (le membre n'en
choisit pas), il **reçoit son mot de passe par courriel**, et un administrateur est notifié de la création du compte.

**Déroulé de bout en bout**
1. **Étape 1 — Identifiants & profession.** Le visiteur saisit son **courriel** et son **occupation**
   (étudiant / travailleur / sans Emploi). Il accepte les conditions. Un lien de parrainage éventuel est mémorisé.
2. **Étape 2 — Identité.** Prénom, nom, date de naissance (**≥ 18 ans obligatoire**), sexe, pays
   d'origine (Cameroun par défaut). Consigne affichée : saisir le nom **tel qu'il figure sur une pièce
   d'identité légale**.
3. **Étape 3 — Coordonnées.** Téléphone, adresse, code postal, pays et statut de résidence, s'il a une assurance vie.
4. **Étape 4 — Contacts d'urgence & création.** Jusqu'à 2 contacts d'urgence. À la validation,
   l'application, **en une seule opération** : crée le compte membre, crée son **compte financier**, 
   **envoie le mot de passe par courriel** au membre et **notifie l'administration** d'une nouvelle inscription.
5. **Orientation.** Un écran propose : « Ajouter ma famille » (personnes à charge) ou « Je suis seul »
   (aller payer). Tant que le premier paiement n'est pas fait, le membre est **guidé/limité** vers ces
   étapes.
6. **Activation.** Le membre paie par Interac (voir §2) ; à la validation par l'admin, son compte
   devient **actif**.

**Règles d'affaire clés**
- **Anti-doublon** : impossible de s'inscrire avec un courriel déjà utilisé, ni avec un **même nom +
  téléphone** déjà présents sous un autre courriel (évite qu'une personne existe deux fois, comme
  titulaire et comme personne à charge).
- Le compte n'est **pas actif** tant que le paiement n'a pas été validé.

**⚠ Points de vigilance affaire (à valider)**
- **Mot de passe généré automatiquement** : est-ce voulu que le membre ne choisisse jamais son mot de
  passe à l'inscription (il le reçoit par courriel puis peut le réinitialiser) ? Public peu habitué →
  cohérent, **à confirmer**.
- **Atomicité** : aujourd'hui, création du compte, envoi du mot de passe et notification sont des
  étapes **séquentielles** ; un incident au milieu peut laisser un membre créé **sans mot de passe
  reçu** ou **sans compte financier**. Le besoin voulu est que l'inscription soit **tout-ou-rien**. À
  valider comme exigence.
- **Vérification d'identité** : la consigne « nom conforme à une pièce d'identité » est **déclarative**
  (aucune pièce n'est téléversée/vérifiée aujourd'hui — la fonction d'upload est désactivée). **À
  confirmer** : faut-il exiger/vérifier une pièce (p. ex. lecture par Claude Vision) ou la simple
  promesse suffit-elle ?

> **Réponse au point de vigilance**
> Oui il est voulu que que le membre ne choisisse jamais son mot de passe à l'inscription pour l'instant
> Le besoin voulu est que l'inscription soit **tout-ou-rien**
> S'il fournit une preuve d'identiter faire lecture par Claude Vision pour confirmer excatitude, sinon 
> faire une déclaration sur l'honneur [Ceci est du au fait que plusieurs saisissent leur nom comme ils veulent et les 
> identifier devient un casse tête].

---

## 2. Facturation & paiement (Interac) — comment un membre paie et est activé

**En bref** — Le membre principal choisit, **par personne**, les services à payer (adhésion et/ou couverture
RPN), envoie un virement Interac et saisit sa référence ; une validation automatique est fait, ou en cas d'erreur, 
un administrateur **valide** que l'argent est reçu, ce qui **crédite le compte** et **active** les services concernés.
Il est à préciser que généralement c'est le membre principale qui paie et donc renfloue le membership et le rpn de ces 
personnes à charge. Et par expérience le virement vient en bloque incluant tout le monde selon la transaction qu'il souhaite.

**Déroulé de bout en bout**
1. **Sélection des services.** Sur l'écran de facturation, chaque personne du foyer (titulaire +
   personnes à charge éligibles) apparaît avec deux cases : **adhésion** et **RPN**. La case RPN d'une
   personne n'est activable que si son adhésion est (ou a été) réglée.
2. **Montant & référence.** L'application affiche le **total dû calculé**. Le membre fait son virement
   Interac dans son application bancaire, puis saisit **le montant** et **la référence** du virement.
   Le montant saisi doit **correspondre** au total attendu, et la référence doit être **unique**
   (jamais réutilisée).
3. **En attente de validation.** Le paiement est enregistré « en approbation » : l'argent n'est pas encore
   crédité.
4. **Validation par l'administrateur.** Un admin, dans sa fenetre dédiée, **confirme** (l'argent est bien
   reçu), **rejette** (introuvable) ou marque en **échec**. À la confirmation : le **solde est
   crédité**, l'**adhésion est activée** pour l'année si elle était incluse, et la **couverture RPN**
   est déclenchée (inscription sur `notrerpn.org`) si elle était incluse. Un **courriel de confirmation**
   ou de **rejet** est envoyé.
5. **Validation automatique.** l'utilisateur fournit une preuve de paiement recu par courriel de sa banque 
   (cela peut-être une capture d'image, ou autre) claude vision l'analyse et valide comme un administrateur(étape 4).

**Règles d'affaire clés**
- **Paiement Interac uniquement** (la carte de crédit est retirée).
- **Un membre ne peut alimenter son RPN que si son adhésion de l'année est payée** (ou dans le même
  paiement) — l'adhésion « débloque » la couverture.
- **Remboursement** : seule la **part RPN** d'un paiement est remboursable (la part adhésion ne l'est
  jamais).
- Les **montants peuvent être décimaux** (ex. 12,50 $).

**⚠ Points de vigilance affaire (à valider)**
- **Validation 100 % manuelle** : chaque paiement dépend d'un admin qui vérifie à la main → **délai
  d'activation** et charge administrative. Le besoin exprimé est d'**automatiser** ce rapprochement (à
  terme, lecture de la preuve de paiement par Claude Vision). **À confirmer** : priorité et faisabilité.
- **Correspondance montant** : faut-il **refuser** un paiement dont le montant saisi ne correspond pas
  au total attendu, ou l'accepter et laisser l'admin trancher ? Le besoin voulu est un **recalcul et
  contrôle côté serveur**. À valider.
- **Rejet après coup** : si un paiement déjà validé est ensuite rejeté, tous ses effets (crédit,
  activation adhésion, inscription RPN) **doivent** être annulés ensemble. À valider comme règle.

> **Réponse au point de vigilance**
> Oui je veux l'automatisation si cela est faisable pour éviter les delais
> Les montants saisis doivent supérieur ou égale au total attendu si non refuser. En cas de surplus dans le montant envoyé
> celui-ci doit être mis au compte du rpn. Par exemple: adhésion + rpn = 45 attendu mais le user envoie 55 alors 
> on aura 25$ adhésion + 30$ rpn. Si un paiement déjà validé est ensuite rejeté, tous ses effets **doivent** être annulés ensemble

---

## 3. Barème / structure de frais (le cœur financier)

**En bref** — Ce qu'un foyer paie diffère entre **la création** du compte et **le renouvellement**
annuel, et se calcule **par personne active**.

**Déroulé / règles d'affaire clés**
- **À la création** (par personne active du foyer) :
  - **10 $ de frais de traitement**, +
  - **Adhésion selon la profession** : **étudiant = 25 $**, **sans emploi = 25 $**, **parent / beau-parent
    résidant au Canada = 25 $**, **travailleur = 50 $**, **mineur (< 18 ans) et autre = 0 $**, +
  - **Provision RPN** (minimum **20 $**) pour amorcer la couverture décès.
- **Au renouvellement annuel** (par personne active) : **5 $ de frais de gestion** + 
  l'adhésion (25/50/0 $) selon la profession.
- **RPN** : ce n'est **pas** un poste annuel fixe. Le solde RPN se **recharge à la demande** quand il
  se vide (consommé par les contributions aux décès).
- **Tous ces montants sont configurables** par l'administration (paramètres serveur), sans les figer
  dans le code.
- **Parents / beaux-parents** : facturés seulement s'ils **résident au Canada** ; les visiteurs ne le
  sont pas.

**⚠ Points de vigilance affaire (à valider)**
- **Profession « sans emploi »** : catégorie **nouvelle** (absente du code actuel). **je confirme** :
  s'applique-t-elle au titulaire **et** aux personnes à charge, et comment est-elle déclarée/prouvée ?
- **Provision RPN de 20 $ à la création** : est-ce un **minimum imposé** ou un **montant fixe** ? Et le
  **seuil d'alerte** de solde RPN bas (aujourd'hui 5 $/personne) est-il lié à ces 20 $ ? À clarifier.
- **Cohérence « qui est facturé » vs « qui est couvert »** : une personne inactive/désinscrite doit
  être traitée de façon **cohérente** entre la facturation adhésion et la couverture RPN (aujourd'hui
  ces deux calculs ne regardent pas exactement les mêmes critères). À valider.

> **Réponse au point de vigilance**
> Profession « sans emploi » n'a pas besoin d'être prouver et s'applique à tous.
> 20$ est le minimum imposé lors de la création du compte par personne, mais peu être plus si l'utilisateur le souhaite.
> Seul une personne qui a effectué un paiement/exempté d'adhésion peut bénéficier d'une couverture rpn s'il a payé.

---

## 4. Personnes à charge & ajout en cours d'année (facturation partielle)

**En bref** — Un titulaire peut ajouter/retirer des personnes à charge à tout moment. Une personne
ajoutée **après** le paiement annuel ou le premier paiement doit être facturer **séparément** (facturation partielle), sans
refaire payer tout le foyer.

**Déroulé de bout en bout**
1. Le titulaire ajoute une personne à charge (identité, relation, profession, résidence…).
2. Si le foyer a une coverture active pour l'année en cours, la nouvelle personne est marquée **« en attente de couverture »**
   et n'est **pas** couverte tant qu'elle n'est pas payée.
3. Le titulaire va sur la **facturation complémentaire** : il paie l'adhésion (et/ou le RPN) **de cette
   personne uniquement**, par Interac.
4. Après validation automatque ou par l'admin, **cette personne** (pour qui le paiement a été ait) devient couverte pour l'année.

**Règles d'affaire clés**
- L'**interrupteur « inclure dans le membership »** (statut actif/inactif) d'une personne à charge
  détermine si elle est comptée et facturée.
- Une personne à charge peut être couverte **pour l'adhésion** et/ou **pour le RPN** indépendamment.

**⚠ Points de vigilance affaire (à valider)**
- **Tarif d'un ajout en cours d'année** : la personne ajoutée après le paiement annuel est-elle
  facturée au **tarif de création** (10 $ + adhésion profession + provision RPN) ou à un **tarif
  proratisé** ? Le modèle « création vs renouvellement » ne dit pas explicitement le cas « nouvelle
  personne en cours d'année ». **À confirmer** — zone de malentendu probable.
- **Retrait d'une personne à charge** : que devient sa **couverture RPN déjà payée** (remboursement ?
  perte ?) et son inscription sur `notrerpn.org` ? À valider.

> **Réponse au point de vigilance**
> Oui  la personne ajoutée après le paiement annuel est-elle facturée au **tarif de création**
> Si on retire (supprime, désactive ou ne renouvelle l'adhésion) une personne à charge on le désinscrit sur `notrerpn.org` 
> mais conserve le montant dans sa banque s'il a d'autres membres actifs ou lui meme le reste, sinon le rembourse.

---

## 5. Gestion de la couverture RPN (se désinscrire soi-même ou une personne à charge)

**En bref** — Depuis la page « Ma couverture », le titulaire peut **activer/désactiver la couverture
décès** de lui-même **et** de chaque personne à charge, **indépendamment**.

**Déroulé de bout en bout**
1. La page affiche une carte par personne : adhésion incluse ou non, statut RPN (couvert / désinscrit /
   en approbation), et un **interrupteur** de couverture RPN quand il est applicable.
2. **Désinscription** : le titulaire bascule l'interrupteur ; une **confirmation** est demandée
   (« cette personne ne bénéficiera plus du fonds en cas de décès »). La personne est alors
   **désactivée sur `notrerpn.org`**.
3. **Réinscription** : rebascule ; la personne est **réactivée** sur `notrerpn.org` (si elle a déjà été
   inscrite) ou inscrite à nouveau.

**Règles d'affaire clés**
- **Indépendance** : désinscrire le **titulaire** du RPN **n'affecte pas** ses personnes à charge, et
  inversement.
- Une personne **désinscrite** n'est plus comptée dans les contributions de solidarité qu'elle devrait
  verser aux décès (et ne bénéficie plus de la couverture).
- Une personne donc l'adhésion n'est pas renouvellé est désinscrit du rpn.

**⚠ Points de vigilance affaire (à valider)**
- **Conséquence financière d'une désinscription** : le solde RPN déjà provisionné est-il **conservé**,
  **remboursé**, ou **perdu** ? À confirmer.
- **Réactivation après désinscription pour solde insuffisant** : quand un membre a été **désinscrit
  automatiquement** (trop d'échecs de prélèvement au décès), comment se réinscrit-il et repart-il « à
  jour » ? À valider.
- **Désinscription = perte de couverture immédiate ?** Y a-t-il un **délai de grâce** ou une couverture
  au prorata de ce qui a été payé ? À confirmer.

> **Réponse au point de vigilance**
> le solde RPN déjà provisionné est remboursé uniquement à la demande verbale du membre principal en appelant le trésorier 
> pour se réinscrire après désinscription pour solde insuffisant, il faut avoir 20$ minimum de renflouer par personne 
> Désinscription = perte de couverture immédiate

---

## 6. Cotisation annuelle / renouvellement (automatique)

**En bref** — Chaque année, l’application gère automatiquement le renouvellement de l’adhésion des foyers.
Le processus repose sur une facture annuelle à payer manuellement (virement Interac renseigné dans l'application) 
et sur une période de rappels étalée sur 2 mois, permettant au membre de provisionner son paiement avant l’échéance.
À défaut de régularisation, **désinscrit** le foyer de toutes les couvertures dont elle profite. Au 2ans, une mise à
jour des professions doit être faite pour les étudiants pour savoir s'ils sont devenu travailleur ou encore aux études;
Mais après 5ans devient trailleur automatiquement sauf si étudiant en médecine ou doctorat.

**Déroulé de bout en bout**
1. En janvier, un traitement automatique génère la facture annuelle (5 $ par personne active + frais adhésion selon profession)
   pour tous les foyers non encore renouvelés.
2. Période de rappels (≈ 2 mois) : Le système envoie des rappels réguliers (ex. hebdomadaires) informant le membre qu’il doit 
   payer avant la fin février pour éviter de ne plsu être membre. Cette période longue permet au membre de provisionner son paiement, 
   ce qui rend le modèle de “paiement avant renouvellement” cohérent.
3. Paiement par virement Interac : Le membre principale clique sur le lien de paiement envoyé par courriel.
   Une fois le paiement envoyé depuis sa banque, il entre les infos de paiement (solde et code interact reçu) et après validation,
   l’adhésion est renouvelée pour l’année et un courriel de confirmation est envoyé.
4. Si le **solde adhésion** couvre le montant dû , il est **débité**, l'adhésion est **renouvelée** (compte actif pour l'année), et un
   **courriel de succès** est envoyé.
5. À l'échéance (mi‑février) si le paiement n’a pas été reçu à la date limite, le système planifie la désactivation et la désincription 
   au rpn.
6. Réactivation : Possible uniquement après paiement réel ou exonération explicitement enregistrée par l’administration.

**Règles d'affaire clés**
- **Sans double prélèvement** : un foyer déjà à jour pour l'année est **ignoré**.
- Le renouvellement n’est accordé que sur paiement valider automatiquement ou par l'administrateur.
- L'adhésion **inactif** est réactivable par l'administration ou si le membre principal paye la facture qui est dû.

**⚠ Points de vigilance affaire (à valider)**
- **Le renouvellement suppose un solde déjà approvisionné** : le prélèvement automatique **puise dans
  le solde adhésion**. Or celui-ci n'est alimenté que si le membre a **payé d'avance**. **À confirmer** :
  le membre doit-il **provisionner à l'avance** son renouvellement, ou le système doit-il plutôt lui
  **envoyer une facture** de 5 $/personne à payer ? Aujourd'hui, si le solde est vide, le renouvellement
  « échoue » et enclenche la désactivation — est-ce le comportement voulu ?
  **sans paiement réel**. Le besoin voulu est de n'accorder l'année que sur **paiement réel** ou
  **exonération explicitement tracée**. À confirmer.
- **Délai de désactivation** : la valeur (25 jours aujourd'hui pour l'adhésion) est-elle la bonne, et
  **distincte** de celle du RPN ? À valider.

> **Réponse au point de vigilance**
> Le renouvellement doit se faire sur facture et paiement réel, pas sur un solde prépayé. Les rappels anticipés servent à informer, 
> pas à prélever. Sans paiement, la désinscription du foyer est le comportement voulu.
> le délais pour rétirer l'adhésion est de 2 mois, mais pour le rpn à 1$ et moins est désinscrit immédiatement avec envoi d'un courriel

---

## 7. Annonce de décès & contribution de solidarité (prélèvement du fonds)

**En bref** — Quand un ou des membre(s) de la communauté décède, un administrateur **publie une annonce** ; le
système **prélève la contribution de solidarité** sur le solde RPN de **chaque foyer** et **notifie
tout le monde**.

**Déroulé de bout en bout**
1. L'administrateur publie une annonce (nom, lieu, date du décès), à l'unité ou **en lot**.
2. Le système calcule, pour chaque foyer titulaire, la contribution due = **montant par personne ×
   nombre de personnes couvertes** dans ce foyer (le titulaire « porte » la contribution de toute sa
   famille couverte).
3. Pour les foyers au **solde RPN suffisant** : la contribution est **débitée** et enregistrée.
4. Pour les foyers au **solde insuffisant** : ils sont **comptés**, **avertis**, et **désinscrits** du fonds
   (et désactivés sur `notrerpn.org`).
5. **Tous les membres** reçoivent une **notification** du décès.
6. L'administrateur suit en direct un **récapitulatif** (montant attendu, collecté, insuffisances,
   comptes sans provision, erreurs).

**Règles d'affaire clés**
- Le **montant par personne** est fixé par l'administration (paramètre), **sans plafond**.
- La contribution est **unique par foyer** (car généralement l'opération de renflouement est unique et effectuer
   par le titulaire pour toutes ses personnes couvertes, lui compris).
- Un foyer sans solde suffisant accumule des **manqués** et mène à la **désinscription**.
- Le solde insuffisant dans un foyer doit être rembourser au prochain renfloument car cela fait offisse d'une dette.

**⚠ Points de vigilance affaire (à valider)**
- **Qui déclenche l'annonce et sur quelle preuve ?** Aujourd'hui, un admin saisit librement un décès
  (aucune pièce justificative). Y a-t-il un processus de **vérification du décès** avant prélèvement ?
  À confirmer.
- **Foyer désinscrit pour insuffisance** : perd-il définitivement sa couverture, ou peut-il se
  régulariser rétroactivement ? Et ses personnes à charge restent-elles couvertes ? À valider.
- **Équité du montant** : le titulaire paie « par personne couverte ». Une grande famille paie donc
  beaucoup plus à chaque décès qu'une personne seule — est-ce le principe voulu ? À confirmer.

> **Réponse au point de vigilance**
> Pas besoin de preuve pour saisir une annonce, car il vient du rpn central à savoir la plateforme partenaire notrerpn.org
> Foyer désinscrit (les personnes à charge aussi désinscrit) pour insuffisance peut se régulariser rétroactivement 
> Équité du montant ne s'applique pas, une grande famille paiera plus

---

## 8. Rappels de solde RPN bas

**En bref** — Quand le solde RPN d'un foyer passe sous un seuil (5$/personne), l'application **l'avertit par
courriel** pour qu'il recharge avant le prochain décès.

**Déroulé de bout en bout**
1. Périodiquement (fonction **actuellement désactivée**, à **réactiver**), le système repère les foyers
   dont le solde RPN est **≤ seuil** (aujourd'hui 5 $ × nombre de personnes couvertes).
2. Il leur envoie un **rappel** les invitant à recharger.

**Règles d'affaire clés**
- Si le seuil est inférieur ou égale à 1$ désinscrire
- Si le seuil est inférieur ou égale à 5$ envoyer rappel hebdomadaire

**⚠ Points de vigilance affaire (à valider)**
- **Anti-spam** : le besoin est de **rappeler sans harceler** (une alerte par cycle). À confirmer la
  fréquence voulue.

> **Réponse au point de vigilance**
> Rappeler chaque samedi (une fois pas semaine). Le seuil est la sécurité en cas de décès multiple d'avoir des fonds nécessaire.

---

## 9. Parrainage & réduction (nouveau besoin)

**En bref** — Un membre qui parraine un nouvel adhérent obtient **une réduction de 50 %** sur sa cotisation 
personnelle lors du renouvellement de l’année suivante, à condition que le filleul soit réellement devenu membre actif.

**Déroulé de bout en bout (cible)**
1. Un membre partage son **lien/code de parrainage** ou fournit son code de parrainage au visiteur.
2. Un nouveau membre s'inscrit via ce lien (ou renseinge le code dans le formulaire d'inscription)
   → le parrainage est enregistré.
3. Lorsque le filleul paie sa cotisation et devient actif le parrain devient éligible à une réduction pour l’année suivante
4. Au moment du renouvellement du parrain, le système applique automatiquement la
   **réduction de 50 % sur sa cotisation personnel de l'année suivante**.
5. Si le parrain a plusieurs filleuls actifs, les réductions sont cumulables, et applicable sur ses personnes à charge.
   Mais ne peut être reporter à une année de plus.

**Règles d'affaire clés**
- La réduction s’applique dans un premier temps sur la cotisation du parrain, pas sur les personnes à charge.
- La réduction est accordée uniquement si le filleul a payé sa cotisation.
- Une réduction de 50 % sur l'adhésion par filleul, soit **12,5$/25$/0$** selon la profession, cumulable jusqu’au maximum
   des adhésions de son foyer (donc les personnes à charge peuvent en bénéficier).
- Si un filleul se désinscrit, ne paie pas → aucune réduction n’est accordée pour ce filleul.
- Le système doit afficher au parrain la liste de ses filleuls et le montant de réduction prévu pour son prochain renouvellement.
- La réduction est appliquée automatiquement lors de la génération de la facture annuelle du parrain.
- Aucune réduction rétroactive : si le filleul paie après le renouvellement du parrain, la réduction s’appliquera l’année suivante.
- Les parrainages doivent être horodatés pour déterminer l’année d’éligibilité.
- Prévoir une interface permettant à l’administration de corriger ou annuler un parrainage en cas d’erreur.

---

## 10. Rôles, exemptions et cycle de vie du compte

**En bref** — Trois types d'utilisateurs, avec des **exemptions de cotisation d'adhésion** pour certains, et un
cycle de vie de compte géré par l'administration.

**Rôles**
- **Membre** : gère son profil, ses personnes à charge, sa couverture, sa facturation, son parrainage.
- **Membre du bureau** *(rôle **nouveau**, absent du code actuel)* : tout ce que fait un membre **+**  publication des
  rapports ou des activités produits par le bureau. **Exempté de cotisation membership** pour lui et sa famille, 
  et sans nécessairement avoir les pouvoirs d'administration. Soumis aux contributions RPN.
  Attribution du rôle : par un administrateur
- **Administrateur** : tout ce que fait un membre **du bureau +** validation des paiements, publication des
  décès, gestion des comptes, paramètres, synchronisation RPN.

**Cycle de vie du compte (géré par l’administration)**
Un administrateur peut :
- Retirer l'adhésion ou désincrire du rpn un foyer (ou une personne du foyer) (ex. non‑paiement, fraude, demande du membre)
- Réactiver l'adhésion ou rpn d'un foyer ou une personne du foyer (ex. paiement reçu, erreur corrigée, ou autre)
- Supprimer un compte (sauf les administrateurs) avec effet cascade et fait une désinscription sur notrerpn.org
- Basculer un rôle (ex. membre → membre du bureau, membre du bureau → admin)

À définir :

Politique de conservation des données lors d’une suppression (paiements, historique, solde, inscription notrerpn.org).

Impact de la suppression sur les obligations RPN et les dossiers familiaux.

**Règles d’affaire clés**
- Les administrateurs et membres du bureau sont exemptés de la cotisation d’adhésion pour eux et leur famille.
- Les administrateurs et membres du bureau font des contributions aux décès.
- Les administrateurs et membres du bureau perdent la couverture décès s'il leur fonds rpn est inférieur à 1$.
- La désactivation du compte d’un foyer qui a déjà été contributeur rpn doit être définie selon les normes industrielles :
Conservation des données financières (obligation légale), Archivage des transactions
- Politique de non‑suppression des administrateurs

**⚠ Points de vigilance affaire (à valider)**
- **Exemption de cotisation** : les admins **et** membres du bureau ne paient pas l'adhésion pour eux
  et leur famille. **À confirmer** : sont-ils aussi exemptés de la **provision RPN** et des
  **contributions aux décès**, ou seulement de l'adhésion ? Bénéficient-ils quand même de la couverture
  décès **sans contribuer** ? Enjeu d'équité à trancher.
- **Suppression d'un membre** : que deviennent son **historique de paiements**, son **solde** et son
  inscription `notrerpn.org` ? À trancher.

> **Réponse au point de vigilance**
> les admins **et** membres du bureau ne sont pas exempt du RPN car tout le monde qui s'y inscrit doit payer
> la suppression d'un membre est différent d'un compte. Si un compte est supprimer archivé tout ce qui lui conserne à des fin d'audit

---

## 11. Promotion d'une personne à charge en titulaire (besoin futur)

**En bref** — Une personne à charge (ex. **enfant devenu adulte**, **conjoint après séparation**) doit
pouvoir, plus tard, **posséder son propre compte** de titulaire.

**⚠ Points de vigilance affaire (à valider) — aucun mécanisme n'existe aujourd'hui**
- **À confirmer** : lors de la « sortie » du foyer, la personne **conserve-t-elle** sa couverture et
  son **matricule `notrerpn.org`** (portabilité), ou repart-elle **de zéro** (nouvelle inscription,
  nouveaux frais) ?
- **Historique** : son historique de couverture/contributions est-il transféré ?
- **Impact sur l'ancien foyer** : le titulaire d'origine cesse-t-il de payer/porter cette personne ?
- Le plan classe ce besoin en « à valider » — il mérite une **spécification métier dédiée**.

> **Réponse au point de vigilance**
> lors de la sortie du foyer, la personne conserve son matricule et sa couverture si active
> son historique n'est pas transféré et le titulaire d'origine cesse de payer pour elle.

---

## 12. Synchronisation avec la plateforme partenaire `notrerpn.org`

**En bref** — En coulisses, l'application tient à jour, sur `notrerpn.org`, le **registre officiel**
des personnes couvertes par le RPN dans l'ACQ : elle les **inscrit** quand elles paient, les **désactive** 
quand elles se désinscrivent ou sont en défaut, les **réactive** quand elles régularisent.
Cette synchronisation conditionne directement le droit réel à prestation et la somme demandé par le partenaire 
en cas de décès à l'échelle du Canada.

**Déroulé de bout en bout (cible)**
1. Lorsqu’un membre paie sa cotisation ou sa provision RPN, l’application envoie une instruction d’inscription à notrerpn.org.
2. Lorsqu’un membre se désinscrit, est désactivé ou en défaut de paiement, l’application envoie une instruction de désactivation.
3. Lorsqu’un membre régularise sa situation, l’application envoie une instruction de réactivation.
4. L’application conserve un journal de synchronisation (succès, échecs, tentatives, horodatage).
5. En cas d’échec, une alerte est générée et une tentative de réconciliation est effectuée automatiquement ou par un administrateur.

**Règles d’affaire clés**
- La synchronisation doit être fiable, traçable, et réconciliée : aucune divergence durable entre l’application et notrerpn.org 
ne doit exister ; tout écart doit être détecté, signalé et corrigé.
- Les actions de synchronisation doivent être idempotentes : répéter une inscription ou une désactivation ne doit pas créer d’incohérence.
- Chaque changement de statut (inscription, désactivation, réactivation) doit être horodaté, journalisé, et réversible par l’administration.
- Le système doit gérer les échecs de communication : file d’attente, retry automatique, alerte administrateur, réconciliation manuelle.
- L'administrateur doit pourvir consulter les personnes en probl`me de synchronisation

**⚠ Points de vigilance affaire (à valider)**
- **Source de vérité** : en cas d'écart entre l'application et `notrerpn.org`, **lequel fait foi** pour
  la couverture réelle d'une personne (et donc pour le droit à prestation) ? À confirmer.
- **Robustesse** : aujourd'hui, si l'inscription externe échoue, la personne peut apparaître « couverte »
  côté application **sans** l'être côté `notrerpn.org` (ou l'inverse), sans alerte. Le besoin voulu est
  une synchronisation **fiable et réconciliée**. À valider comme exigence.
- **Ce que `notrerpn.org` fait de son côté** (calcul/versement de la prestation, ses propres règles)
  n'est **pas visible** depuis l'application — à documenter avec le partenaire.

> **Réponse au point de vigilance**
> `notrerpn.org` fait foi avec une robustesse de la synchronisation :réconciliation automatique et 
>­­­­ en cas de plusieurs écheque correction manuelle en inscrivant manuellement dans le site `notrerpn.org`
> et saisir manuellement matricule et référence

---

## Synthèse — Zones où un malentendu d'affaire est le plus probable

Classées par risque de mauvaise interprétation métier (à trancher en priorité) :

| # | Sujet | Question d'affaire à trancher | Statut aujourd'hui |
|---|---|---|---|
| 1 | **Prestation décès** | Qui verse quoi à la famille endeuillée ? Rôle du solde RPN local vs `notrerpn.org` ? | **Non documenté** |
| 2 | **Parrainage 50 %** | 50 % de quoi, par filleul ou une fois, cumulable, plafond, conditions ? | **Non implémenté** |
| 3 | **Renouvellement** | Le membre provisionne-t-il d'avance, ou reçoit-il une facture ? Que se passe-t-il si le solde est vide ? | Prélève un solde pré-payé |
| 4 | **Exemptions admin / membre du bureau** | Exemptés d'adhésion seulement, ou aussi de RPN/contributions ? Couverts sans contribuer ? | Partiel / rôle bureau absent |
| 5 | **Ajout d'une personne en cours d'année** | Tarif de création, proraté, ou renouvellement ? | Non explicite |
| 6 | **Désinscription RPN** | Le solde provisionné est-il conservé, remboursé ou perdu ? | Non défini |
| 7 | **Promotion personne à charge → titulaire** | Portabilité du matricule/historique ou repart de zéro ? | Inexistant |
| 8 | **Validation des paiements** | Rester manuel ou automatiser (preuve via Claude Vision) ? | 100 % manuel |
| 9 | **Vérification identité / décès** | Faut-il une preuve (pièce d'identité, justificatif de décès) ? | Déclaratif |
| 10 | **Équité contribution décès** | Payer « par personne couverte » (grande famille = plus) est-il le principe voulu ? | Oui, par personne |

> Les points 1, 2 et 4 sont les plus critiques : ils touchent au **modèle économique** (ce que reçoit
> un membre, comment les réductions et exemptions affectent les revenus) et **ne sont pas** — ou pas
> correctement — capturés par le code ou le plan actuels.
