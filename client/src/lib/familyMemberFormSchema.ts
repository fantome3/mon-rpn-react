import { z } from 'zod'
import {
  FAMILY_MEMBER_STATUSES,
  OCCUPATIONS,
  RESIDENCE_COUNTRY_STATUSES,
  STUDENT_STATUSES,
} from '@/types'
import { telRegex } from '@/lib/constant'
import {
  RELATION_CONJOINT,
  isParentRelation,
} from '@/lib/familyMemberRules'

export const familyMemberFormSchema = z
  .object({
    firstName: z.string().min(1, 'Champ obligatoire'),
    lastName: z.string().min(1, 'Champ obligatoire'),
    relationship: z.string().min(1, 'Champ obligatoire'),
    residenceCountryStatus: z.enum(RESIDENCE_COUNTRY_STATUSES, {
      required_error: 'Veuillez selectionner le statut au Canada.',
    }),
    status: z.enum(FAMILY_MEMBER_STATUSES),
    birthDate: z.date({
      required_error: 'La date de naissance est exigee.',
    }),
    occupation: z.enum(OCCUPATIONS).optional(),
    studentStatus: z.enum(STUDENT_STATUSES).optional(),
    institution: z.string().optional(),
    studentNumber: z.string().optional(),
    livesInCanada: z.boolean().optional(),
    sex: z.string().optional(),
    tel: z
      .string()
      .regex(telRegex, { message: 'Entrer numero correct' })
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.relationship === RELATION_CONJOINT) {
      if (!data.occupation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['occupation'],
          message: "Veuillez indiquer l'occupation du/de la conjoint(e).",
        })
      }
      if (data.occupation === 'student' && !data.studentStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['studentStatus'],
          message: "Veuillez indiquer le type d'etudes.",
        })
      }
    }
    if (isParentRelation(data.relationship)) {
      if (data.livesInCanada === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['livesInCanada'],
          message: 'Veuillez indiquer si ce parent vit au Canada.',
        })
      }
    }
  })

export type FamilyMemberFormValues = z.infer<typeof familyMemberFormSchema>

export const familyMemberFormDefaultValues: FamilyMemberFormValues = {
  firstName: '',
  lastName: '',
  relationship: '',
  status: 'active',
  residenceCountryStatus: 'permanent_resident',
  birthDate: new Date(1990, 0, 1),
  tel: '',
  occupation: undefined,
  studentStatus: undefined,
  institution: undefined,
  studentNumber: undefined,
  livesInCanada: true,
  sex: '',
}
