# CONTRAT_API_NOTRERPN — API `notrerpn.org` (rétro-conçu depuis le code)

> ⚠ **Aucune documentation officielle n'existe.** Ce contrat est **entièrement déduit du code**
> (`server/src/infrastructure/notrerpn/rpnHttpClient.ts` et
> `server/src/services/rpnExternalPlatformService.ts`). Il décrit **ce que l'application appelle
> aujourd'hui**, pas nécessairement tout ce que l'API offre. Les champs de **réponse** ne sont connus
> que pour ce que le code lit ; le reste est marqué **« à confirmer »**. À valider avec l'administrateur
> de `notrerpn.org` avant la réécriture.

## 1. Généralités

| Élément | Valeur | Source |
|---|---|---|
| Hôte | `api.notrerpn.org` (**HTTPS** uniquement) | `rpnHttpClient.ts:51` |
| Format | JSON (`Accept: application/json`, `Content-Type: application/json` si corps) | `:63-70` |
| Authentification | **JWT Bearer** obtenu via `POST /users/login` | `:104-129` |
| Convention d'erreur | tout statut **HTTP ≥ 400** = échec (le corps est renvoyé dans le message d'erreur) | `:82-85` |
| Réponse attendue | **JSON** ; une réponse non-JSON est traitée comme une erreur | `:87-91` |
| Rôle métier | l'app **inscrit / active / désactive** chaque personne couverte comme « membre » sur la plateforme mutualiste ; `notrerpn.org` **fait foi** pour le droit à prestation | BESOIN_AFFAIRE §12 |

## 2. Authentification

### `POST /users/login`
- **But** : obtenir un jeton de session.
- **Corps** :
  ```json
  { "username": "<EXTERNAL_APP_EMAIL>", "password": "<EXTERNAL_APP_PASSWORD>" }
  ```
  *(le champ est bien `username`, alimenté par l'e-mail — `rpnHttpClient.ts:110-119`)*
- **Réponse (lue par le code)** :
  ```json
  { "token": "<JWT>" }
  ```
- **Gestion du jeton** : le code décode le **payload JWT** pour lire `exp` et met le jeton en cache
  jusqu'à `exp − 60 s` *(`:121-124`)*. → l'API émet un **JWT standard avec claim `exp`**.
- **À confirmer** : durée de validité réelle ; autres champs de réponse ; comportement sur identifiants
  invalides (code/format d'erreur) ; existence d'un refresh token.

### `GET /users/me`  *(appelé seulement si `RPN_ADMIN_REFERENCE` n'est pas fourni)*
- **En-tête** : `Authorization: Bearer <token>`
- **But** : récupérer la **référence du compte administrateur** (compte de service de l'association),
  utilisée comme `relationship_reference` du membre principal.
- **Réponse (lue par le code)** :
  ```json
  { "reference": "<referenceAdmin>" }
  ```
  *(le code n'exploite que `reference` — `:147-155`)*
- **À confirmer** : autres champs renvoyés par `/users/me`.

## 3. Membres

### `POST /members` — Inscrire une personne (principal ou personne à charge)
- **En-tête** : `Authorization: Bearer <token>`
- **Corps** (`RpnCreateMemberPayload`, `rpnHttpClient.ts:11-26`) :

| Champ | Type | Valeur / règle (source `rpnExternalPlatformService.ts`) |
|---|---|---|
| `first_name` | string | prénom |
| `last_name` | string | nom |
| `birthdate` | string `YYYY-MM-DD` | `toIsoDate()` `:116-118` |
| `country` | string ISO 3166-1 **alpha-2** | pays de résidence mappé ; défaut = 2 1res lettres majuscules `:99-102` |
| `nationality` | string ISO alpha-2 | pays d'origine mappé |
| `city` | string | **dérivée de la 1re lettre du code postal** ; défaut `Montreal` `:112-114,81-85` |
| `region` | string (province CA) | **dérivée de la 1re lettre du code postal** ; défaut `QC` `:108-110,73-79` |
| `gender` | `MALE` \| `FEMALE` | `toGender()` — défaut **`MALE`** ; `F/FEMALE/FEMME`→FEMALE ; si sexe absent et relation `Mère/Belle-mère`→FEMALE `:89-93` |
| `identification_type` | string | **figé** à `PASSPORT` `:136,160` |
| `email` | string | e-mail du compte (les personnes à charge **héritent l'e-mail du principal**) `:161` |
| `arrival_date_after_limit` | boolean | **figé** à `false` `:138,162` |
| `type` | `RESIDENT` \| `VISITOR` | `visitor`→VISITOR, sinon RESIDENT `:95-97` |
| `relationship_reference` | string | **rattachement** : `rpn_Relationship_reference` pour reférencer le type de relation en bd |
| `relationship` | string | principal = "" ; personne à charge : `Conjoint(e)`→`HUSBAND_WIFE`, parents→`PARENT`, enfant→`SON_DAUGHTER` `:104-106,141,165` |

- **Réponse** (`RpnMemberCreatedResponse`, `rpnHttpClient.ts:36-47`) :
  ```json
  {
    "matricule": "SALARM51027",
    "reference": "<referenceMembre>",
    "firstName": "…",
    "lastName": "…",
    "type": "…", 
    "gender": "…", 
    "status": "…",
    "community": "…", 
    "createdAt": "…", 
    "probationEndDate": "…"
  }
  ```
  Le code ne **persiste que `matricule` et `reference`** *(`rpnExternalPlatformService.ts:185,211`)*.
- **À confirmer** : contraintes/validations serveur (champs requis, formats) ; **doublons** (que se
  passe-t-il si la personne existe déjà ?) ; signification de `status`, `community`, `probationEndDate` ;
  codes d'erreur.

### `PUT /members/admin/activate` — Activer / désactiver une personne
- **En-tête** : `Authorization: Bearer <token>`
- **Corps** (`RpnActivationPayload`, `rpnHttpClient.ts:28-32`) :
  ```json
  { "reference": "<referenceMembre>", "reason": "<texte libre>", "activate": true }
  ```
  `activate:false` = **désinscription** ; `activate:true` = **réinscription** *(`:177-184`)*.
- **Réponse** : **ignorée** par le code (`Promise<void>`) — seul le statut HTTP < 400 compte `:181-184`.
- **À confirmer** : corps de réponse ; comportement si la référence est inconnue/déjà (dés)activée ;
  `reason` est-il journalisé/obligatoire côté partenaire ?

## 4. Variables d'environnement requises

| Variable | Usage | Source |
|---|---|---|
| `EXTERNAL_APP_EMAIL` | `username` du login (compte de service) | `rpnHttpClient.ts:110` |
| `EXTERNAL_APP_PASSWORD` | mot de passe du login | `:111` |
| `RPN_ADMIN_REFERENCE` | référence admin (évite l'appel `GET /users/me`) | `:140` |
| `RPN_DEFAULT_RELATIONSHIP` | `relationship` du membre principal (défaut `FRIEND`) | `rpnExternalPlatformService.ts:141` |

## 5. Comportement client actuel (à conserver / fiabiliser)

- **Cache jeton** en mémoire (`exp − 60 s`) + **cache référence admin** ; les deux sont **ré-obtenus au
  redémarrage** *(`rpnHttpClient.ts:53-54,104-129,137-156`)*.
- Le client **lève** sur ≥ 400 ; la couche métier appelle en **fire-and-forget** (`.catch` log) et
  notifie l'admin par courriel **seulement à l'inscription** (pas aux (dés)activations)
  *(`rpnExternalPlatformService.ts:186-191,239-241,260-262`)*.
- **Décisions réécriture** (cf. FONCTIONNEL_GLOBAL §7-23, WORKFLOWS 4/12) : appels **fiabilisés**
  (file persistée, retry, idempotence), état `enrolled` en base **seulement après** obtention de la
  `reference`, **réconciliation** ; en cas d'échecs répétés, **saisie manuelle** du `matricule` et de la
  `reference` (inscription directe sur `notrerpn.org`).

## 6. Zones à confirmer avec le partenaire (bloquant Phase 4)

1. **Endpoints manquants ?** L'app n'utilise que login / me / members / activate. Existe-t-il :
   consultation d'un membre, liste, mise à jour, **suppression**, **statut de prestation/décès** ?
   (Nécessaire pour la **réconciliation** et l'**estimation du montant à reverser** par décès.)
2. **Idempotence de `POST /members`** (ré-appel = doublon ou 200 ?).
3. **Format d'erreur** (codes, structure JSON) pour distinguer transitoire vs permanent (retry).
4. **Cycle de vie côté notrerpn** : `status`, `probationEndDate` (période de carence ?), effet réel de
   `activate` sur le droit à prestation.
5. **Authentification** : durée du jeton, refresh, limites de débit.
6. **Environnement de test** (sandbox) et **identifiants** de service.
