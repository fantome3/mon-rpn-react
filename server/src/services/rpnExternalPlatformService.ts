/**
 * Couche d'abstraction vers la plateforme tierce notrerpn.org.
 * Chaque fonction est un stub : elle logue l'appel sans effectuer de connexion.
 * Lors de l'intégration future (API REST ou Puppeteer), remplacer le corps de
 * chaque fonction par la logique correspondante sans modifier les signatures
 * ni les appelants.
 */

export const enrollOnExternalPlatform = async (_email: string): Promise<void> => {
  // TODO: intégration notrerpn.org – inscrire le membre
  console.log(`[rpnExternalPlatform] enrollOnExternalPlatform – ${_email} (stub)`)
}

export const deactivateOnExternalPlatform = async (_email: string): Promise<void> => {
  // TODO: intégration notrerpn.org – désactiver le membre
  console.log(`[rpnExternalPlatform] deactivateOnExternalPlatform – ${_email} (stub)`)
}

export const reactivateOnExternalPlatform = async (_email: string): Promise<void> => {
  // TODO: intégration notrerpn.org – réactiver le membre
  console.log(`[rpnExternalPlatform] reactivateOnExternalPlatform – ${_email} (stub)`)
}
