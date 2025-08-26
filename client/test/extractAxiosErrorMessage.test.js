import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { extractAxiosErrorMessage } from '../src/lib/utils.ts'

const inactiveError = {
  isAxiosError: true,
  response: { data: { message: "Compte inactif. Veuillez contacter l'administrateur." } },
}

const genericAxiosError = {
  isAxiosError: true,
  response: { data: {} },
}

test('extractAxiosErrorMessage retourne le message du serveur', () => {
  equal(
    extractAxiosErrorMessage(inactiveError),
    "Compte inactif. Veuillez contacter l'administrateur."
  )
})

test("extractAxiosErrorMessage retourne le message par défaut", () => {
  equal(
    extractAxiosErrorMessage(genericAxiosError),
    'Quelque chose ne va pas.'
  )
})
