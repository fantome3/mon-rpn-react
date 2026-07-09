# ARCHITECTURE_TECHNIQUE.md

Ce document fait autorite sur toutes les decisions techniques de la refonte.
Toute session de codage (Claude Code ou humaine) doit le lire avant d'ecrire
la moindre ligne de code, et le respecter integralement. Toute deviation doit
etre signalee explicitement et justifiee dans JOURNAL_DECISIONS.md, jamais
appliquee silencieusement.

Contexte important : cette application n'est pas en production. Les
contraintes de migration a chaud, de compatibilite ascendante stricte, ou de
feature flags pour deploiement progressif ne s'appliquent pas. On privilegie
la solution la plus propre et la plus simple a long terme plutot qu'une
solution de transition.

---

## 1. Principes directeurs

0. **Design Pattern** : Appliquer les patrons de conceptions sur les problèmes
   connus dans la conception pour la résolution des problèmes lorsque nécessaire.
   Par exemple on utilise le pattern Observeur pour la notification des mails
   lors d'un changement de comportement pour notifier ceux qui doivent le savoir;
   ou pattern Etats pour le changement d'état, ainsi de suite ...
1. **DRY (Don't Repeat Yourself)** : toute logique dupliquee a deux endroits
   ou plus doit etre extraite (fonction utilitaire, classe de base, service
   partage, hook React). Un enum, un type, une regle de validation n'existe
   qu'a un seul endroit dans le code.
2. **Clean Architecture** : les dependances pointent toujours vers
   l'interieur (domaine). Le domaine metier ne connait rien de NestJS, de
   Mongoose, ni de React. L'infrastructure (base de donnees, framework web,
   UI) est un detail d'implementation remplacable.
3. **Clean Code** : un nom de variable/fonction/classe doit dire ce qu'il
   fait sans commentaire necessaire. Une fonction fait une seule chose.
   Une classe a une seule raison de changer.
4. **Mobile-first** : 90% des utilisateurs sont sur telephone. Toute
   interface est concue et testee d'abord pour un ecran de 360-430px de
   large, puis adaptee vers le haut (tablette, desktop) — jamais l'inverse.
5. **Coherence globale avant vitesse locale** : une session de codage qui
   doit choisir entre "aller vite" et "reutiliser/respecter l'existant"
   choisit toujours la coherence. Voir section 10 (registre technique).
6. **Le serveur est la source de verite fonctionnelle** : toute regle
   metier et tout message affiche a l'utilisateur est defini et valide cote
   serveur. Le front peut avoir de la logique (UX, calculs d'affichage,
   validation immediate), mais ne decide jamais seul de ce qui est
   correct ou de ce qui s'affiche comme message fonctionnel final.

---

## 2. Stack technique retenue

| Couche | Technologie |
|---|---|
| Backend | NestJS (TypeScript) |
| ODM | Mongoose + Typegoose (classes decorees, typage fort) |
| Base de donnees | MongoDB Atlas |
| Persistance de fichiers | GridFS (MongoDB) — pas de service de stockage tiers |
| Traitement asynchrone / taches differees | Mecanisme interne base sur MongoDB (collection de jobs + polling, ou cron NestJS `@nestjs/schedule`) — pas de Redis, pas de BullMQ |
| Frontend | React + Vite (SPA) |
| Style | A definir en phase de detail (Tailwind recommande pour la vitesse et la coherence mobile-first — a valider avec toi) |

### Options considerees, non retenues

**Option B — Redis + BullMQ pour les taches asynchrones/queues**
- Reutilise : rien de la stack actuelle (l'appli legacy n'a probablement
  pas de queue formelle — a confirmer dans FONCTIONNEL_PROCESSUS.md)
- Change : ajout d'une dependance d'infrastructure payante/a heberger
  (Redis en production necessite un service manage ou un serveur dedie)
- Impact sur workflows/processus existants : aucun negatif si non
  retenue — les processus non-UI documentes (cron, webhooks) peuvent
  fonctionner avec `@nestjs/schedule` + une collection Mongo de jobs
  pour la persistance d'etat, sans perte de fonctionnalite pour le
  volume attendu de cette application
- Raison de non-retenue : cout d'infrastructure additionnel non justifie
  au volume actuel ; MongoDB suffit comme file d'attente persistee pour
  des volumes moderes

**Option C — Stockage de fichiers externe (S3 / Cloudinary / equivalent)**
- Reutilise : rien de la stack actuelle
- Change : ajout d'un compte/service tiers, gestion de credentials
  supplementaires, cout potentiel selon le volume
- Impact sur workflows/processus existants : aurait simplifie la gestion
  de gros fichiers binaires, mais introduit une dependance externe et un
  cout
- Raison de non-retenue : GridFS permet de garder toute la persistance
  (donnees + fichiers) dans MongoDB Atlas, deja retenu comme base
  principale — simplicite operationnelle et cout nul tant que les
  fichiers restent de taille raisonnable (documents, photos de profil,
  pieces jointes). A reconsiderer uniquement si un besoin de fichiers
  volumineux (video, gros exports) apparait clairement dans la
  documentation fonctionnelle.

---

## 3. Architecture backend (NestJS) — Clean Architecture appliquee

### 3.1 Structure de dossiers par module

Chaque domaine fonctionnel (identifie dans FONCTIONNEL_GLOBAL.md) est un
module NestJS autonome, structure ainsi :

```
src/
  modules/
    membres/
      domain/
        entities/
          membre.entity.ts        <- classe POO avec comportements
        value-objects/
          matricule-rpn.vo.ts     <- validation/logique encapsulee
        enums/
          statut-membre.enum.ts
        errors/
          membre-introuvable.error.ts
      application/
        services/
          membre.service.ts       <- orchestration, regles metier
        dto/
          creer-membre.dto.ts     <- forme des donnees entrantes/sortantes
          membre-reponse.dto.ts
        ports/
          membre-repository.port.ts  <- interface (abstraction)
      infrastructure/
        persistence/
          membre.schema.ts        <- schema Typegoose (Mongoose)
          membre.repository.ts    <- implementation concrete du port
        http/
          membre.controller.ts
      membre.module.ts
  shared/
    domain/
      enums/                       <- enums transversaux (voir section 10)
    infrastructure/
      files/
        gridfs.service.ts
      jobs/
        job-scheduler.service.ts
    messages/
      messages-fonctionnels.fr.ts  <- voir section 6
```

Regle de dependance : `domain/` ne depend de rien d'externe (pas de
decorateur Mongoose, pas de decorateur NestJS). `application/` depend du
domaine et des ports (interfaces), jamais des implementations concretes.
`infrastructure/` implemente les ports et depend du domaine. Le sens de
dependance ne s'inverse jamais.

### 3.2 Entites vs DTO — separation stricte

- **Entity (domaine)** : classe representant un concept metier avec ses
  comportements. Contient la logique de validation et les regles
  d'integrite qui lui sont propres. Exemple :

  ```typescript
  class Membre {
    private statut: StatutMembre;

    activer(): void {
      if (this.statut !== StatutMembre.EN_ATTENTE) {
        throw new TransitionInvalideError(
          "Un membre ne peut etre active que depuis le statut EN_ATTENTE"
        );
      }
      this.statut = StatutMembre.ACTIF;
    }
  }
  ```

  Une entite n'est jamais un simple sac de proprietes publiques sans
  comportement (anti-pattern "anemic domain model" interdit).

- **DTO (application)** : structure de donnees pure, sans comportement,
  utilisee uniquement pour transporter des donnees entre les couches
  (entrant : validation de forme via `class-validator` ; sortant : forme
  exacte exposee au front). Un DTO ne contient jamais de logique metier.

- **Schema Typegoose (infrastructure)** : distinct de l'entite de domaine.
  Le repository fait la conversion Schema <-> Entity. L'entite de domaine
  ne connait jamais l'existence de Mongoose.

### 3.3 Design patterns imposes par couche

| Besoin | Pattern imposee |
|---|---|
| Acces aux donnees | Repository (interface dans `application/ports`, implementation dans `infrastructure/persistence`) |
| Creation d'entites complexes (plusieurs etapes/validations) | Factory ou methode statique nommee sur l'entite (`Membre.creer(...)`) |
| Logique metier transversale a plusieurs entites | Domain Service (dans `application/services`), jamais dans le controller |
| Transformation Entity <-> DTO | Mapper dedie (`membre.mapper.ts`), jamais fait a la main dans le controller ou le service |
| Regles de validation de valeur (ex: format matricule RPN) | Value Object encapsulant la validation |
| Notification/evenement inter-modules | Pattern Observer via `EventEmitter2` (natif NestJS) — pas de couplage direct entre modules |

**Interdit** : logique metier dans un controller. Un controller ne fait que
recevoir la requete, appeler le service applicatif, et retourner la
reponse formatee.

---

## 4. Structure des DTO et validation

- Tout DTO entrant est valide avec `class-validator` au niveau du
  controller (pipe global `ValidationPipe`).
- Les messages d'erreur de validation renvoyes par l'API sont deja en
  francais et directement affichables (voir section 6) — le front ne
  traduit ni ne reformate ces messages.
- Un DTO ne partage jamais sa classe avec l'entite de domaine, meme si
  les champs se ressemblent au depart : ce sont deux raisons de changer
  differentes (contrat API vs regle metier).

---

## 5. Enums et types partages — regle anti-duplication

Cause identifiee du probleme actuel (enums dupliques entre sessions) :
regle stricte a appliquer sans exception.

1. Tout enum ou type utilise par plus d'un module vit dans
   `src/shared/domain/enums/` ou `src/shared/domain/types/`.
2. Avant de creer un enum, une session doit chercher dans
   `REGISTRE_TECHNIQUE.md` (section 10) et dans `src/shared/` s'il existe
   deja un equivalent semantique, meme nomme differemment.
3. Un enum specifique a un seul module (ex: un sous-statut interne non
   partage) peut rester dans le module, mais doit quand meme etre
   enregistre dans le registre pour eviter une duplication future.
4. Toute modification d'un enum partage doit lister dans sa
   pull-request/session les fichiers impactes.

---

## 6. Logique metier et messages fonctionnels — cote serveur

- Toute regle metier (validation, transition d'etat, calcul ayant une
  consequence fonctionnelle) est implementee et validee cote serveur,
  dans le domaine ou l'application — jamais uniquement cote front.
- Tout message fonctionnel affiche a l'utilisateur (succes, erreur,
  confirmation, texte d'etat) est defini cote serveur, dans un fichier
  centralise `src/shared/messages/messages-fonctionnels.fr.ts`, sous
  forme de constantes nommees :

  ```typescript
  export const MessagesMembre = {
    ACTIVATION_REUSSIE: "Le membre a ete active avec succes.",
    TRANSITION_INVALIDE: "Ce membre ne peut pas etre active dans son etat actuel.",
  } as const;
  ```

  Le front affiche le message recu de l'API tel quel ; il ne genere pas
  ses propres textes fonctionnels de son cote (evite la derive entre deux
  applications qui racontent des choses differentes pour la meme
  situation).
- Le front peut avoir de la logique (calculs d'affichage, filtrage,
  formatage, validation immediate pour l'UX), mais cette logique ne
  remplace jamais la validation serveur — elle l'anticipe seulement pour
  ameliorer l'experience.

---

## 7. Frontend (React + Vite) — structure et conventions

### 7.1 Mobile-first, systematiquement

- Toute maquette et tout composant est concu d'abord pour un viewport
  ~375px de large. Les media queries ajoutent des ameliorations pour les
  ecrans plus grands, jamais l'inverse.
- Zones tactiles d'au moins 44x44px, navigation pensee pour le pouce
  (elements d'action importants dans la moitie inferieure de l'ecran sur
  mobile), formulaires courts avec clavier adapte au type de champ
  (`inputMode`, `type="tel"`, etc.).
- Feedback visuel immediat sur toute action (chargement, succes, erreur)
  — critique sur mobile ou la latence reseau est plus visible.

### 7.2 Separation logique / presentation

Pour tout composant non trivial, deux fichiers cote a cote :

```
src/
  components/
    FormulaireInscription/
      FormulaireInscription.tsx        <- rendu JSX uniquement
      FormulaireInscription.logique.ts <- hooks, etat, appels API, calculs
```

- Le fichier `.logique.ts` exporte un hook personnalise
  (`useFormulaireInscription()`) qui contient tout l'etat, les effets,
  les appels a l'API et la logique de transformation des donnees pour
  l'affichage.
- Le fichier `.tsx` importe ce hook et ne fait que du rendu : pas de
  `useState`, pas de `fetch`, pas de logique conditionnelle complexe
  directement dans le JSX au-dela de l'affichage conditionnel simple.
- Un composant purement presentationnel sans etat ni effet (ex: un badge,
  une carte d'affichage simple) n'a pas besoin de fichier `.logique.ts`.

### 7.3 Reutilisabilite

- Tout element d'UI repete plus d'une fois (bouton, carte, champ de
  formulaire, badge de statut) devient un composant partage dans
  `src/components/ui/`.
- Tout appel API repete est centralise dans une couche de services front
  (`src/services/api/`), jamais duplique dans plusieurs `.logique.ts`.
- Les enums/types partages entre front et back (ex: `StatutMembre`)
  vivent dans un package ou dossier partage si le monorepo le permet, ou
  sont synchronises manuellement avec une note explicite dans le
  registre s'il n'y a pas de monorepo — jamais redefinis independamment
  a la main des deux cotes.

---

## 8. Encodage et langue

- Toute l'application (backend et frontend) fonctionne en UTF-8 de bout
  en bout : fichiers source, base de donnees MongoDB, reponses HTTP
  (`Content-Type: application/json; charset=utf-8`), rendu HTML.
- Les accents francais (e, e, a, c, etc.) sont ecrits directement en
  caracteres UTF-8 dans le code, les messages et les donnees — jamais
  sous forme d'entites HTML encodees (`&eacute;`) ni d'echappement
  unicode (`\u00e9`). Aucune configuration de la base ou de l'API ne
  doit forcer un encodage ASCII-safe.
- Note pour ce document uniquement (contrainte de l'outil de generation
  de ce fichier) : les caracteres accentues n'ont pas ete utilises dans
  ce document texte, mais cette absence ne s'applique PAS au code de
  l'application — c'est l'inverse de la regle ci-dessus, propre a la
  redaction de cette page.

---

## 9. Gestion des fichiers et taches asynchrones (sans Redis/BullMQ)

- **Fichiers** : stockage via GridFS (MongoDB). Un service partage
  `GridFsService` dans `src/shared/infrastructure/files/` centralise
  l'upload, la lecture en stream, et la suppression. Aucun module ne
  manipule GridFS directement.
- **Taches planifiees (cron)** : `@nestjs/schedule`, avec chaque tache
  definie dans son module concerne, mais enregistree dans
  `FONCTIONNEL_PROCESSUS.md` et le registre technique.
- **Taches differees/asynchrones (equivalent queue)** : collection Mongo
  `jobs` avec un statut (`EN_ATTENTE`, `EN_COURS`, `TERMINE`, `ECHOUE`),
  traitee par un worker interne qui poll a intervalle court. Chaque job
  est idempotent (peut etre rejoue sans effet de bord si le traitement
  est interrompu). Suffisant pour le volume actuel ; a documenter
  explicitement si une limite de performance est atteinte plus tard.

---

## 10. Registre technique — fichier vivant

Un fichier separe `REGISTRE_TECHNIQUE.md` accompagne ce document et doit
etre mis a jour a la fin de CHAQUE session de codage. Il liste :
- Tous les enums/types partages, avec leur emplacement et leur usage
- Toutes les value objects et leur regle de validation
- Tous les patterns appliques par module (pour verifier la coherence
  entre modules similaires)

Regle a inclure dans chaque prompt de codage :

> "Avant de creer un enum, une classe de domaine ou un type partage,
> consulte REGISTRE_TECHNIQUE.md et le code existant dans src/shared/.
> Reutilise l'existant si un equivalent semantique existe deja, meme sous
> un autre nom. Si tu crees un nouvel element partage, ajoute-le au
> registre avant de terminer la session."

---

## 11. Tests

- Tests unitaires sur les entites de domaine et value objects (logique
  pure, sans mock necessaire).
- Tests d'integration sur les repositories (contre une instance MongoDB
  de test).
- Tests end-to-end sur les endpoints critiques identifies comme
  criticite Haute dans PLAN_IMPLEMENTATION.md.
- Un module n'est considere termine que si ses regles de validation et
  ses transitions d'etat documentees dans FONCTIONNEL_WORKFLOWS.md sont
  couvertes par au moins un test.

---

## 12. Ce que l'absence de production change concretement

Puisque l'application n'est pas encore en production :
- Pas besoin de double ecriture ou de bascule progressive pour la
  migration des donnees (sauf si tu decides d'un go-live progressif par
  module — a discuter au moment venu).
- Pas besoin de feature flags pour desactiver une fonctionnalite en
  cours de deploiement.
- Les schemas de donnees peuvent etre revus et corriges librement tant
  qu'aucun utilisateur reel n'est en train de les utiliser — profite de
  cette fenetre pour valider MIGRATION_DONNEES.md avant le premier
  import reel de donnees, plutot que de corriger apres coup.
- Priorite absolue a la qualite de fondation (sections 3 a 10 de ce
  document) plutot qu'a la vitesse de livraison — c'est le moment ou ce
  choix coute le moins cher.
