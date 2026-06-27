/**
 * Service d'intégration avec la plateforme externe notrerpn.org.
 * Responsabilité : transformer les données du domaine en payloads API,
 * orchestrer les appels et notifier l'administrateur en cas d'erreur.
 * Aucun appel HTTP direct — délégué au client d'infrastructure.
 */

import { DocumentType } from '@typegoose/typegoose'
import { User, FamilyMember } from '../models/userModel'
import { sendExternalRegistrationFailureEmail } from '../mailer'
import {
  getAdminReference,
  createMember,
  setMemberActivation,
  type RpnCreateMemberPayload,
 } from '../infrastructure/notrerpn/rpnHttpClient'

// ── Type de retour commun ──────────────────────────────────────────────────

export interface RpnEnrollmentResult {
  reference: string
  matricule: string
}

// ── Tables de correspondance ───────────────────────────────────────────────

const GENDER_MAP: Readonly<Record<string, 'MALE' | 'FEMALE'>> = {
  F:      'FEMALE',
  FEMALE: 'FEMALE',
  FEMME:  'FEMALE',
}

// Relations stockées dans notre BD → valeurs attendues par notrerpn.org
const RELATIONSHIP_MAP: Readonly<Record<string, string>> = {
  'Conjoint(e)': 'HUSBAND_WIFE',
  'Père':        'PARENT',
  'Mère':        'PARENT',
  'Beau-père':   'PARENT',
  'Belle-mère':  'PARENT',
}

// Noms de pays (français) → codes ISO 3166-1 alpha-2
const COUNTRY_CODE_MAP: Readonly<Record<string, string>> = {
  Canada:                             'CA',
  Cameroun:                           'CM',
  France:                             'FR',
  Belgique:                           'BE',
  Suisse:                             'CH',
  "Côte d'Ivoire":                    'CI',
  "Cote d'Ivoire":                    'CI',
  Congo:                              'CG',
  'République Démocratique du Congo': 'CD',
  RDC:                                'CD',
  Sénégal:                            'SN',
  Maroc:                              'MA',
  Algérie:                            'DZ',
  Tunisie:                            'TN',
  Mali:                               'ML',
  Guinée:                             'GN',
  Gabon:                              'GA',
  Togo:                               'TG',
  Bénin:                              'BJ',
  Ghana:                              'GH',
  Nigeria:                            'NG',
  Kenya:                              'KE',
  'Afrique du Sud':                   'ZA',
  Madagascar:                         'MG',
  Mauritanie:                         'MR',
  Niger:                              'NE',
}

// Code postal canadien (lettre initiale) → province et ville principale
const POSTAL_REGION_MAP: Readonly<Record<string, string>> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB',
  G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC',
  X: 'NT', Y: 'YT',
}

const POSTAL_CITY_MAP: Readonly<Record<string, string>> = {
  G: 'Quebec',  H: 'Montreal', J: 'Quebec',
  K: 'Ottawa',  M: 'Toronto',
  T: 'Calgary', V: 'Vancouver',
}

// ── Fonctions de transformation (partagées, DRY) ───────────────────────────

function toGender(sex: string | undefined, fallbackRelationship?: string): 'MALE' | 'FEMALE' {
  if (sex) return GENDER_MAP[sex.toUpperCase()] ?? 'MALE'
  if (fallbackRelationship === 'Mère' || fallbackRelationship === 'Belle-mère') return 'FEMALE'
  return 'MALE'
}

function toMemberType(status: string): 'RESIDENT' | 'VISITOR' {
  return status === 'visitor' ? 'VISITOR' : 'RESIDENT'
}

function toCountryCode(name: string): string {
  if (/^[A-Z]{2}$/.test(name)) return name
  return COUNTRY_CODE_MAP[name] ?? name.toUpperCase().substring(0, 2)
}

function toApiRelationship(relationship: string): string {
  return RELATIONSHIP_MAP[relationship] ?? 'SON_DAUGHTER'
}

function deriveRegion(postalCode: string): string {
  return POSTAL_REGION_MAP[postalCode.charAt(0).toUpperCase()] ?? 'QC'
}

function deriveCity(postalCode: string): string {
  return POSTAL_CITY_MAP[postalCode.charAt(0).toUpperCase()] ?? 'Montreal'
}

function toIsoDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}

// ── Constructeurs de payload ───────────────────────────────────────────────

function buildPrimaryMemberPayload(
  user: DocumentType<User>,
  adminReference: string
): RpnCreateMemberPayload {
  const { origines, infos, register } = user
  return {
    first_name:               origines.firstName,
    last_name:                origines.lastName,
    birthdate:                toIsoDate(new Date(origines.birthDate)),
    country:                  toCountryCode(infos.residenceCountry),
    nationality:              toCountryCode(origines.nativeCountry),
    city:                     deriveCity(infos.postalCode),
    region:                   deriveRegion(infos.postalCode),
    gender:                   toGender(origines.sex),
    identification_type:      'PASSPORT',
    email:                    register.email,
    arrival_date_after_limit: false,
    type:                     toMemberType(infos.residenceCountryStatus),
    relation_reference:       adminReference,
    relationship:             process.env.RPN_DEFAULT_RELATIONSHIP ?? 'FRIEND',
  }
}

function buildFamilyMemberPayload(
  user: DocumentType<User>,
  member: FamilyMember,
  primaryReference: string
): RpnCreateMemberPayload {
  const { infos, origines, register } = user
  return {
    first_name:               member.firstName,
    last_name:                member.lastName,
    birthdate:                toIsoDate(new Date(member.birthDate)),
    country:                  toCountryCode(infos.residenceCountry),     // hérite du principal
    nationality:              toCountryCode(origines.nativeCountry),     // hérite du principal
    city:                     deriveCity(infos.postalCode),              // hérite du principal
    region:                   deriveRegion(infos.postalCode),            // hérite du principal
    gender:                   toGender(member.sex, member.relationship),
    identification_type:      'PASSPORT',
    email:                    register.email,                            // email partagé
    arrival_date_after_limit: false,
    type:                     toMemberType(member.residenceCountryStatus),
    relation_reference:       primaryReference,
    relationship:             toApiRelationship(member.relationship),
  }
}

// ── API publique ───────────────────────────────────────────────────────────

/**
 * Inscrit le membre principal sur notrerpn.org.
 * Retourne { reference, matricule } à persister, ou null en cas d'échec.
 * L'administrateur est notifié par courriel si l'inscription échoue.
 */
export const enrollOnExternalPlatform = async (
  user: DocumentType<User>
): Promise<RpnEnrollmentResult | null> => {
  try {
    const adminReference = await getAdminReference()
    const payload        = buildPrimaryMemberPayload(user, adminReference)
    const result         = await createMember(payload)

    console.log(`[rpnPlatform] Membre principal inscrit : ${result.matricule} (ref ${result.reference})`)
    return { reference: result.reference, matricule: result.matricule }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[rpnPlatform] Echec inscription membre principal :', detail)
    await sendExternalRegistrationFailureEmail(user.register.email, detail)
    return null
  }
}

/**
 * Inscrit un membre de la famille sur notrerpn.org, rattaché au membre principal.
 * Retourne { reference, matricule } à persister, ou null en cas d'échec.
 * L'administrateur est notifié par courriel si l'inscription échoue.
 *
 * @param primaryReference  subscription.rpnExternalReference du membre principal
 */
export const enrollFamilyMemberOnExternalPlatform = async (
  user: DocumentType<User>,
  member: FamilyMember,
  primaryReference: string
): Promise<RpnEnrollmentResult | null> => {
  try {
    const payload = buildFamilyMemberPayload(user, member, primaryReference)
    const result  = await createMember(payload)

    console.log(`[rpnPlatform] Membre famille inscrit : ${result.matricule} (ref ${result.reference}) — ${member.firstName} ${member.lastName}`)
    return { reference: result.reference, matricule: result.matricule }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`[rpnPlatform] Echec inscription ${member.firstName} ${member.lastName} :`, detail)
    await sendExternalRegistrationFailureEmail(
      `${member.firstName} ${member.lastName} (${user.register.email})`,
      detail
    )
    return null
  }
}

/**
 * Désactive un membre (principal ou famille) sur notrerpn.org.
 * @param reference  rpnExternalReference du membre à désactiver
 */
export const deactivateOnExternalPlatform = async (
  reference: string,
  reason = 'Engagement RPN non renouvelé — cotisation de décès insuffisante'
): Promise<void> => {
  if (!reference) {
    console.warn('[rpnPlatform] Désactivation ignorée : référence externe absente')
    return
  }

  try {
    await setMemberActivation({ reference, reason, activate: false })
    console.log(`[rpnPlatform] Membre désactivé : ${reference}`)
  } catch (err) {
    console.error('[rpnPlatform] Echec désactivation :', err)
  }
}

/**
 * Réactive un membre (principal ou famille) sur notrerpn.org.
 * @param reference  rpnExternalReference du membre à réactiver
 */
export const reactivateOnExternalPlatform = async (
  reference: string,
  reason = 'Solde RPN reconstitué — couverture décès rétablie'
): Promise<void> => {
  if (!reference) {
    console.warn('[rpnPlatform] Réactivation ignorée : référence externe absente')
    return
  }
  
  try {
    await setMemberActivation({ reference, reason, activate: true })
    console.log(`[rpnPlatform] Membre réactivé : ${reference}`)
  } catch (err) {
    console.error('[rpnPlatform] Echec réactivation :', err)
  }
}
