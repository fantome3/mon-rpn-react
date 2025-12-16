import { z } from 'zod'

export const createInteracFormSchema = (minAmount: number) =>
  z.object({
    amountInterac: z
      .number({
        required_error: `Le montant ne peut être inférieur à ${minAmount}$`,
        invalid_type_error: 'Le montant doit être un nombre.',
      })
      .gte(minAmount, {
        message: `Le montant ne peut être inférieur à ${minAmount}$`,
      }),
    refInterac: z
      .string()
      .min(6, { message: 'Ce code interact n\'est pas valide.' })
      .regex(/^(C|c|CA|Ca|cA|ca)/, { message: 'Ce code interact n\'est pas valide.' }),
  })
