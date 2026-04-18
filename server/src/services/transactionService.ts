import { DocumentType } from '@typegoose/typegoose'
import { Account, AccountModel } from '../models/accountModel'
import {
  Transaction,
  TransactionFundType,
  TransactionFundTypeValue,
  TransactionModel,
  TransactionStatus,
  TransactionStatusValue,
  TransactionType,
  TransactionTypeValue,
} from '../models/transactionModel'
import { UserModel } from '../models/userModel'
import {
  interacRefExists,
  normalizeInteracRef,
} from './interacReferenceService'
import { sendMembershipSuccessEmail, sendPaymentRejectedEmail } from '../mailer'
import { onRpnPaymentConfirmed } from './rpnLifecycleService'

/**
 * Summary:
 * Erreur métier dédiée au domaine Transaction avec code HTTP associé.
 */
export class TransactionDomainError extends Error {
  public readonly statusCode: number

  /**
   * Summary:
   * Construit une erreur métier transactionnelle.
   */
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'TransactionDomainError'
  }
}

export type CreateTransactionInput = {
  userId: string
  amount: number
  type: TransactionTypeValue
  fundType?: TransactionFundTypeValue
  membershipAmount?: number
  rpnAmount?: number
  reason: string
  refInterac?: string
  status?: TransactionStatusValue
}

type ProcessOutcome = 'completed' | 'failed'

type TransactionDocument = DocumentType<Transaction>
type AccountDocument = DocumentType<Account>

type CreditAllocation = {
  membershipAmount: number
  rpnAmount: number
}

/**
 * Summary:
 * Convertit une valeur inconnue en montant positif (>= 0).
 */
const toPositiveAmount = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed)
    }
  }

  return 0
}

/**
 * Summary:
 * Compare deux montants numériques avec une tolérance.
 */
const almostEqual = (left: number, right: number, epsilon = 0.001) =>
  Math.abs(left - right) <= epsilon

/**
 * Summary:
 * Normalise les anciens statuts vers le statut métier courant.
 */
const normalizeStatus = (status: TransactionStatusValue): TransactionStatusValue =>
  status === TransactionStatus.SUCCESS ? TransactionStatus.COMPLETED : status

/**
 * Summary:
 * Classe de base de la machine d'état transactionnelle.
 */
abstract class BaseTransactionState {
  protected readonly service: TransactionDomainService
  protected readonly transaction: TransactionDocument

  /**
   * Summary:
   * Initialise le gestionnaire d'état avec son service métier et sa transaction.
   */
  constructor(service: TransactionDomainService, transaction: TransactionDocument) {
    this.service = service
    this.transaction = transaction
  }

  /**
   * Summary:
   * Traite une transaction selon le résultat demandé (`completed` ou `failed`).
   * Contexte fonctionnel:
   * Méthode de base de la machine d'état; les états concrets la redéfinissent selon les transitions autorisées.
   * Exemple:
   * Depuis un état final, cet appel lève une transition invalide; depuis `pending`, il est redirigé vers `confirm` ou `fail`.
   */
  public async process(
    _outcome: ProcessOutcome,
    _actorId?: string
  ): Promise<TransactionDocument> {
    this.throwInvalidTransition('process')
  }

  /**
   * Summary:
   * Confirme une transaction.
   */
  public async confirm(_actorId?: string): Promise<TransactionDocument> {
    this.throwInvalidTransition('confirm')
  }

  /**
   * Summary:
   * Rejette une transaction.
   */
  public async reject(_actorId?: string): Promise<TransactionDocument> {
    this.throwInvalidTransition('reject')
  }

  /**
   * Summary:
   * Marque une transaction en échec.
   */
  public async fail(_actorId?: string): Promise<TransactionDocument> {
    this.throwInvalidTransition('fail')
  }

  /**
   * Summary:
   * Tente un remboursement selon les règles de l'état courant.
   * Contexte fonctionnel:
   * Point d'entrée commun de la machine d'état; seuls certains états (ex: `completed`) autorisent cette transition.
   * Exemple:
   * Sur `completed`, la demande est traitée; sur `pending`, une erreur de transition est levée.
   */
  public async refund(
    _amount?: number,
    _actorId?: string
  ): Promise<TransactionDocument> {
    this.throwInvalidTransition('refund')
  }

  /**
   * Summary:
   * Lance une erreur de transition invalide pour l'état courant.
   */
  protected throwInvalidTransition(action: string): never {
    throw new TransactionDomainError(
      `Transition invalide: impossible d'executer '${action}' depuis l'etat '${this.transaction.status}'.`,
      409
    )
  }

  /**
   * Summary:
   * Renseigne les métadonnées de traitement.
   */
  protected stampProcessing(actorId?: string) {
    this.transaction.processedAt = new Date()
    if (actorId) {
      this.transaction.processedBy = actorId
    }
  }
}

/**
 * Summary:
 * État d'une transaction en attente de paiement.
 */
class AwaitingPaymentState extends BaseTransactionState {
  /**
   * Summary:
   * Interdit le traitement tant que la transaction est en attente de paiement.
   */
  public async process(
    _outcome: ProcessOutcome,
    _actorId?: string
  ): Promise<TransactionDocument> {
    throw new TransactionDomainError(
      "La transaction est encore en attente de paiement, elle doit d'abord passer a l'etat pending.",
      409
    )
  }
}

/**
 * Summary:
 * État d'une transaction en attente de validation (pending).
 */
class PendingState extends BaseTransactionState {
  /**
   * Summary:
   * Traite la transaction pending selon le résultat reçu.
   */
  public async process(
    outcome: ProcessOutcome,
    actorId?: string
  ): Promise<TransactionDocument> {
    if (outcome === 'completed') {
      return this.confirm(actorId)
    }

    return this.fail(actorId)
  }

  /**
   * Summary:
   * Confirme la transaction pending et applique ses effets métier.
   */
  public async confirm(actorId?: string): Promise<TransactionDocument> {
    await this.service.apply(this.transaction)

    this.transaction.status = TransactionStatus.COMPLETED
    this.transaction.failedAt = undefined
    this.transaction.rejectedAt = undefined
    this.stampProcessing(actorId)

    await this.transaction.save()
    return this.transaction
  }

  /**
   * Summary:
   * Rejette la transaction pending et annule ses effets appliqués.
   */
  public async reject(actorId?: string): Promise<TransactionDocument> {
    await this.service.rollbackAppliedCredit(this.transaction)

    this.transaction.status = TransactionStatus.REJECTED
    this.transaction.rejectedAt = new Date()
    this.stampProcessing(actorId)

    await this.transaction.save()
    return this.transaction
  }

  /**
   * Summary:
   * Passe la transaction pending en échec et annule ses effets appliqués.
   */
  public async fail(actorId?: string): Promise<TransactionDocument> {
    await this.service.rollbackAppliedCredit(this.transaction)

    this.transaction.status = TransactionStatus.FAILED
    this.transaction.failedAt = new Date()
    this.stampProcessing(actorId)

    await this.transaction.save()
    return this.transaction
  }
}

/**
 * Summary:
 * État d'une transaction complétée.
 */
class CompletedState extends BaseTransactionState {
  /**
   * Summary:
   * Délègue le remboursement d'une transaction complétée au service métier.
   */
  public async refund(
    amount?: number,
    actorId?: string
  ): Promise<TransactionDocument> {
    return this.service.refundCompletedTransaction(this.transaction, amount, actorId)
  }
}

/**
 * Summary:
 * État final sans transition métier autorisée.
 */
class FinalizedState extends BaseTransactionState {}

/**
 * Summary:
 * Crée le gestionnaire d'état adapté au statut de la transaction.
 */
const createStateHandler = (
  service: TransactionDomainService,
  transaction: TransactionDocument
): BaseTransactionState => {
  const status = normalizeStatus(transaction.status)

  if (status === TransactionStatus.PENDING) {
    return new PendingState(service, transaction)
  }

  if (status === TransactionStatus.AWAITING_PAYMENT) {
    return new AwaitingPaymentState(service, transaction)
  }

  if (status === TransactionStatus.COMPLETED) {
    return new CompletedState(service, transaction)
  }

  return new FinalizedState(service, transaction)
}

/**
 * Summary:
 * Orchestrateur métier du cycle de vie Transaction (création, validation, échec, rejet, remboursement).
 * Contexte fonctionnel:
 * Centralise la logique côté serveur pour éviter que le client décide des règles métier.
 * Exemple:
 * Un admin valide un paiement Interac: le service confirme la transaction puis applique les effets sur le compte.
 */
export class TransactionDomainService {
  /**
   * Summary:
   * Crée une transaction avec son statut initial (`pending` ou `awaiting_payment`).
   * Contexte fonctionnel:
   * Point d'entrée technique de persistance transactionnelle, sans effet collatéral sur le compte utilisateur.
   * Exemple:
   * Si `amount > 0` et `refInterac` valide, la transaction démarre en `pending`; sinon en `awaiting_payment`.
   */
  public async create(input: CreateTransactionInput): Promise<TransactionDocument> {
    this.validateCreateInput(input)

    const normalizedRefInterac = input.refInterac?.trim() ?? ''

    if (normalizedRefInterac) {
      const interacExists = await interacRefExists(normalizedRefInterac)

      if (interacExists) {
        throw new TransactionDomainError('Code Interac invalide ou deja utilise.', 400)
      }
    }

    const amount = toPositiveAmount(input.amount)
    const resolvedStatus = this.resolveStatusOnCreate(input, amount, normalizedRefInterac)

    const transaction = new TransactionModel({
      userId: input.userId,
      amount,
      type: input.type,
      fundType: input.fundType,
      membershipAmount: input.membershipAmount,
      rpnAmount: input.rpnAmount,
      reason: input.reason.trim(),
      refInterac: normalizedRefInterac || undefined,
      status: resolvedStatus,
      balanceApplied: false,
      refundedAmount: 0,
    })

    this.validateCreditAllocation(transaction, {
      strictForBothFundType: true,
      strictFundTypePresence: resolvedStatus === TransactionStatus.PENDING,
    })

    await transaction.save()

    return transaction
  }

  /**
   * Summary:
   * Initialise un dépôt utilisateur puis synchronise l'état du compte associé.
   * Contexte fonctionnel:
   * Méthode métier à utiliser quand un utilisateur soumet un paiement Interac (premier paiement ou renflouement).
   * Exemple:
   * Un membre soumet un virement Interac: la transaction est créée puis le compte passe en attente de validation.
   */
  public async initiateDeposit(input: CreateTransactionInput): Promise<TransactionDocument> {
    if (input.type !== TransactionType.CREDIT) {
      throw new TransactionDomainError("Un depot utilisateur doit etre de type 'credit'.", 400)
    }

    const transaction = await this.create(input)

    await this.ensureAccountAfterCreate({
      userId: String(transaction.userId),
      status: transaction.status,
      refInterac: transaction.refInterac,
      amount: toPositiveAmount(transaction.amount),
    })

    return transaction
  }

  /**
   * Summary:
   * Exécute une issue métier (`completed` ou `failed`) sur une transaction en respectant la machine d'état.
   * Contexte fonctionnel:
   * Utilisé surtout par l'administration après vérification d'un paiement transmis par l'utilisateur.
   * Exemple:
   * Si la preuve Interac correspond aux montants reçus, outcome=`completed`; sinon outcome=`failed`.
   */
  public async process(
    transactionId: string,
    outcome: ProcessOutcome,
    actorId?: string
  ): Promise<TransactionDocument> {
    if (outcome !== 'completed' && outcome !== 'failed') {
      throw new TransactionDomainError("L'etat process doit etre 'completed' ou 'failed'.", 400)
    }

    const transaction = await this.getTransactionOrThrow(transactionId)
    return createStateHandler(this, transaction).process(outcome, actorId)
  }

  /**
   * Summary:
   * Confirme explicitement une transaction et la fait passer vers `completed` si la transition est autorisée.
   * Contexte fonctionnel:
   * Action admin lorsque le paiement est reconnu et validé manuellement.
   * Exemple:
   * Une transaction `pending` validée par un admin devient `completed` et crédite le compte via `apply`.
   */
  public async confirm(
    transactionId: string,
    actorId?: string
  ): Promise<TransactionDocument> {
    const transaction = await this.getTransactionOrThrow(transactionId)
    return createStateHandler(this, transaction).confirm(actorId)
  }

  /**
   * Summary:
   * Rejette une transaction (`pending` -> `rejected`) et retire les crédits déjà appliqués si nécessaire.
   * Contexte fonctionnel:
   * Action admin quand le code Interac ou le montant saisi ne correspond à aucun paiement reçu.
   * Exemple:
   * Paiement déclaré 25$ introuvable: la transaction est rejetée et le 25$ est déduit du compte.
   */
  public async reject(
    transactionId: string,
    actorId?: string
  ): Promise<TransactionDocument> {
    const transaction = await this.getTransactionOrThrow(transactionId)
    const updated = await createStateHandler(this, transaction).reject(actorId)
    await this.notifyPaymentRejected(updated)
    return updated
  }

  /**
   * Summary:
   * Marque la transaction en échec (`failed`) et annule les effets financiers appliqués au préalable.
   * Contexte fonctionnel:
   * Utilisé pour un échec système ou métier (ex: prélèvement impossible, solde insuffisant, validation KO).
   * Exemple:
   * Un débit échoue pendant le traitement: la transaction passe en `failed` et le compte revient à l'état cohérent.
   */
  public async fail(
    transactionId: string,
    actorId?: string
  ): Promise<TransactionDocument> {
    const transaction = await this.getTransactionOrThrow(transactionId)
    return createStateHandler(this, transaction).fail(actorId)
  }

  /**
   * Summary:
   * Démarre un remboursement d'une transaction éligible via la machine d'état.
   * Contexte fonctionnel:
   * Action admin après une transaction `completed`, selon les règles de remboursement autorisées.
   * Exemple:
   * Pour une transaction RPN de 100$, un remboursement partiel de 40$ met à jour le solde et l'historique.
   */
  public async refund(
    transactionId: string,
    amount?: number,
    actorId?: string
  ): Promise<TransactionDocument> {
    const transaction = await this.getTransactionOrThrow(transactionId)
    return createStateHandler(this, transaction).refund(amount, actorId)
  }

  /**
   * Summary:
   * Applique les effets d'une transaction crédit sur le compte et le membership selon `fundType`.
   * Contexte fonctionnel:
   * Exécuté à la confirmation d'un paiement afin de créditer RPN, activer l'abonnement ou faire les deux.
   * Exemple:
   * `fundType=both`: crédite `membershipAmount` + `rpnAmount`, vérifie la cohérence puis sauvegarde.
   */
  public async apply(transaction: TransactionDocument): Promise<void> {
    if (transaction.type !== TransactionType.CREDIT) {
      return
    }

    if (transaction.balanceApplied === true) {
      return
    }

    this.validateCreditAllocation(transaction, {
      strictForBothFundType: true,
      strictFundTypePresence: true,
    })

    const allocation = this.resolveCreditAllocation(transaction)
    const account = await this.getOrCreateAccount(String(transaction.userId))

    account.membership_balance =
      toPositiveAmount(account.membership_balance) + allocation.membershipAmount
    account.rpn_balance = toPositiveAmount(account.rpn_balance) + allocation.rpnAmount
    account.paymentMethod = 'interac'
    account.isAwaitingFirstPayment = false

    const refInterac = normalizeInteracRef(transaction.refInterac)
    if (refInterac) {
      this.pushInteracTransferIfMissing(account, {
        amountInterac: transaction.amount,
        refInterac,
      })
    }

    await account.save()

    if (allocation.membershipAmount > 0) {
      await this.activateMembership(String(transaction.userId), allocation.membershipAmount)
    }

    if (allocation.rpnAmount > 0) {
      onRpnPaymentConfirmed(String(transaction.userId), account.rpn_balance).catch((err) =>
        console.error('[rpnLifecycle] onRpnPaymentConfirmed:', err)
      )
    }

    transaction.balanceApplied = true
    transaction.appliedAt = new Date()
  }

  /**
   * Summary:
   * Annule les crédits déjà appliqués sur le compte pour revenir à un état cohérent après rejet/échec.
   * Contexte fonctionnel:
   * Sert de mécanisme de compensation quand une transaction crédit n'est finalement pas validée.
   * Exemple:
   * Une transaction pending créditée par erreur est rejetée: membership/RPN sont décrémentés automatiquement.
   */
  public async rollbackAppliedCredit(transaction: TransactionDocument): Promise<void> {
    if (transaction.type !== TransactionType.CREDIT) {
      return
    }

    const shouldRollbackLegacyPendingCredit =
      transaction.status === TransactionStatus.PENDING &&
      transaction.balanceApplied === undefined

    const shouldRollback =
      transaction.balanceApplied === true || shouldRollbackLegacyPendingCredit

    if (!shouldRollback) {
      return
    }

    const allocation = this.resolveCreditAllocation(transaction)
    const account = await AccountModel.findOne({ userId: transaction.userId })

    if (!account) {
      throw new TransactionDomainError(
        "Impossible d'annuler le paiement: compte utilisateur introuvable.",
        404
      )
    }

    account.membership_balance =
      toPositiveAmount(account.membership_balance) - allocation.membershipAmount
    account.rpn_balance = toPositiveAmount(account.rpn_balance) - allocation.rpnAmount

    await account.save()

    transaction.balanceApplied = false
  }

  /**
   * Summary:
   * Exécute le remboursement total ou partiel d'une transaction `completed` (RPN uniquement).
   * Contexte fonctionnel:
   * Applique les contrôles de plafond remboursable, met à jour le compte et trace les métadonnées de remboursement.
   * Exemple:
   * Transaction RPN 80$ déjà remboursée 30$: le remboursement maximal restant est 50$.
   */
  public async refundCompletedTransaction(
    transaction: TransactionDocument,
    amount?: number,
    actorId?: string
  ): Promise<TransactionDocument> {
    if (transaction.type !== TransactionType.CREDIT) {
      throw new TransactionDomainError(
        'Un remboursement ne peut être appliquer que sur une transaction crédit.',
        409
      )
    }

    this.validateCreditAllocation(transaction, {
      strictForBothFundType: true,
      strictFundTypePresence: true,
    })

    const allocation = this.resolveCreditAllocation(transaction)
    if (allocation.rpnAmount <= 0) {
      throw new TransactionDomainError(
        'Le remboursement est disponible uniquement pour la partie RPN.',
        409
      )
    }

    const account = await AccountModel.findOne({ userId: transaction.userId })
    if (!account) {
      throw new TransactionDomainError(
        "Impossible d'effectuer le remboursement: compte utilisateur introuvable.",
        404
      )
    }

    const alreadyRefunded = toPositiveAmount(transaction.refundedAmount)
    const remainingRefundable = Math.max(0, allocation.rpnAmount - alreadyRefunded)

    if (remainingRefundable <= 0) {
      throw new TransactionDomainError('Cette transaction a deja ete totalement remboursee.', 409)
    }

    const refundAmount = amount === undefined ? remainingRefundable : toPositiveAmount(amount)
    if (refundAmount <= 0) {
      throw new TransactionDomainError('Le montant a rembourser doit etre superieur a 0.', 400)
    }

    if (refundAmount > remainingRefundable) {
      throw new TransactionDomainError(
        `Le montant maximal remboursable est de ${remainingRefundable}.`,
        409
      )
    }

    account.rpn_balance = toPositiveAmount(account.rpn_balance) - refundAmount
    await account.save()

    transaction.refundedAmount = alreadyRefunded + refundAmount
    transaction.status = TransactionStatus.REFUNDED
    transaction.refundedAt = new Date()
    transaction.processedAt = new Date()
    if (actorId) {
      transaction.processedBy = actorId
    }

    await transaction.save()
    return transaction
  }

  /**
   * Summary:
   * Valide les prérequis métier minimum avant création de transaction.
   * Contexte fonctionnel:
   * Bloque les entrées incomplètes ou incohérentes pour éviter des transactions invalides en base.
   * Exemple:
   * Si `reason` est vide ou `type` inconnu, une `TransactionDomainError` 400 est levée.
   */
  private validateCreateInput(input: CreateTransactionInput) {
    if (!input.userId) {
      throw new TransactionDomainError('userId est requis.', 400)
    }

    if (!input.reason || !input.reason.trim()) {
      throw new TransactionDomainError('La raison de la transaction est requise.', 400)
    }

    if (input.type !== TransactionType.CREDIT && input.type !== TransactionType.DEBIT) {
      throw new TransactionDomainError('Le type de transaction est invalide.', 400)
    }

    const amount = toPositiveAmount(input.amount)
    if (input.type === TransactionType.CREDIT && amount <= 0 && normalizeInteracRef(input.refInterac)) {
      throw new TransactionDomainError(
        'Le montant doit etre superieur a 0 pour une transaction Interac en attente de validation.',
        400
      )
    }
  }

  /**
   * Summary:
   * Détermine le statut initial d'une transaction selon son type et la présence d'une preuve de paiement.
   * Contexte fonctionnel:
   * Uniformise la règle d'entrée: un crédit sans paiement reste en attente, un crédit payé passe en validation.
   * Exemple:
   * Crédit sans `refInterac` -> `awaiting_payment`; crédit payé -> `pending`.
   */
  private resolveStatusOnCreate(
    input: CreateTransactionInput,
    amount: number,
    normalizedRefInterac: string
  ): TransactionStatusValue {
    if (input.type === TransactionType.DEBIT) {
      return normalizeStatus(input.status || TransactionStatus.COMPLETED)
    }

    const hasPayment = amount > 0 && normalizedRefInterac.length > 0
    return hasPayment ? TransactionStatus.PENDING : TransactionStatus.AWAITING_PAYMENT
  }

  /**
   * Summary:
   * Synchronise les indicateurs du compte juste après la création d'une transaction.
   * Contexte fonctionnel:
   * Met à jour `paymentMethod`, `isAwaitingFirstPayment` et la référence Interac quand applicable.
   * Exemple:
   * Création en `pending` avec `refInterac`: la référence est ajoutée si absente dans `account.interac`.
   */
  private async ensureAccountAfterCreate({
    userId,
    status,
    refInterac,
    amount,
  }: {
    userId: string
    status: TransactionStatusValue
    refInterac?: string
    amount: number
  }) {
    const account = await this.getOrCreateAccount(userId)

    account.paymentMethod = 'interac'

    if (status === TransactionStatus.AWAITING_PAYMENT) {
      account.isAwaitingFirstPayment = true
    }

    if (status === TransactionStatus.PENDING) {
      account.isAwaitingFirstPayment = false
      if (refInterac) {
        this.pushInteracTransferIfMissing(account, {
          amountInterac: amount,
          refInterac,
        })
      }
    }

    if (account.isModified() || account.isNew) {
      await account.save()
    }
  }

  /**
   * Summary:
   * Ajoute une entrée Interac au compte seulement si la référence est valide et non dupliquée.
   * Contexte fonctionnel:
   * Empêche les doublons de preuve de paiement dans l'historique financier utilisateur.
   * Exemple:
   * Si `refInterac` existe déjà, aucune nouvelle ligne n'est ajoutée.
   */
  private pushInteracTransferIfMissing(
    account: AccountDocument,
    interac: { amountInterac: number; refInterac: string }
  ) {
    const normalizedRef = normalizeInteracRef(interac.refInterac)
    if (!normalizedRef) {
      return
    }

    const existingRefs = (account.interac ?? []).map((entry) =>
      normalizeInteracRef(entry.refInterac)
    )

    if (existingRefs.includes(normalizedRef)) {
      return
    }

    if (!account.interac) {
      account.interac = []
    }

    account.interac.push({
      amountInterac: toPositiveAmount(interac.amountInterac),
      refInterac: normalizedRef,
      dateInterac: new Date(),
    })
  }

  /**
   * Summary:
   * Retourne le compte utilisateur existant ou le crée à partir des données profil.
   * Contexte fonctionnel:
   * Garantit qu'une transaction peut toujours s'appuyer sur un compte persistant.
   * Exemple:
   * Si aucun compte n'existe pour `userId`, un nouveau compte est créé avec soldes à 0.
   */
  private async getOrCreateAccount(userId: string): Promise<AccountDocument> {
    const account = await AccountModel.findOne({ userId })
    if (account) {
      return account
    }

    const user = await UserModel.findById(userId)
    if (!user) {
      throw new TransactionDomainError('Utilisateur introuvable pour creer le compte.', 404)
    }

    const accountToCreate = new AccountModel({
      membership_balance: 0,
      rpn_balance: 0,
      paymentMethod: 'interac',
      firstName: user.origines.firstName,
      lastName: user.origines.lastName,
      userTel: user.infos.tel,
      userResidenceCountry: user.infos.residenceCountry,
      userId: user._id,
      isAwaitingFirstPayment: true,
    })

    await accountToCreate.save()
    return accountToCreate
  }

  /**
   * Summary:
   * Active ou renouvelle le membership annuel puis tente l'envoi de l'email de confirmation.
   * Contexte fonctionnel:
   * Utilisé après confirmation d'un paiement contenant une composante membership.
   * Exemple:
   * Paiement membership validé: `subscription.status=active`, dates mises à jour, email envoyé.
   */
  private async activateMembership(userId: string, membershipAmount: number) {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new TransactionDomainError(
        "Impossible d'activer le membership: utilisateur introuvable.",
        404
      )
    }

    const currentYear = new Date().getFullYear()

    user.subscription.status = 'active'
    user.subscription.lastMembershipPaymentYear = currentYear
    user.subscription.membershipPaidThisYear = true
    user.subscription.startDate = new Date()
    user.subscription.endDate = new Date(
      new Date().setFullYear(currentYear + 1)
    )
    user.subscription.missedRemindersCount = 0
    user.subscription.scheduledDeactivationDate = undefined

    await user.save()

    try {
      await sendMembershipSuccessEmail(
        user.register.email,
        membershipAmount,
        currentYear
      )
    } catch (error) {
      console.error(
        'Erreur email de confirmation membership apres confirmation transaction:',
        error
      )
    }
  }

  /**
   * Summary:
   * Envoie un courriel d'information au membre apres rejet d'un paiement.
   * Contexte fonctionnel:
   * Utilise lorsque l'administration rejette une transaction pending.
   */
  private async notifyPaymentRejected(transaction: TransactionDocument): Promise<void> {
    if (transaction.type !== TransactionType.CREDIT) {
      return
    }

    const user = await UserModel.findById(transaction.userId)
    if (!user) {
      console.error('Utilisateur introuvable pour envoi email paiement rejete.', {
        transactionId: transaction._id,
      })
      return
    }

    const receivedAmount = toPositiveAmount(transaction.amount)
    const reference = transaction.refInterac || 'non fourni'

    try {
      await sendPaymentRejectedEmail({
        email: user.register.email,
        receivedAmount,
        reference,
      })
    } catch (error) {
      console.error('Erreur envoi email paiement rejete:', error)
    }
  }

  /**
   * Summary:
   * Vérifie la cohérence des montants membership/RPN selon `fundType` avant application.
   * Contexte fonctionnel:
   * Sécurise les règles financières, notamment pour `fundType=both` où la somme doit égaler `amount`.
   * Exemple:
   * Si `membershipAmount + rpnAmount !== amount`, la transaction est rejetée avec erreur 400.
   */
  private validateCreditAllocation(
    transaction: Pick<
      Transaction,
      'type' | 'fundType' | 'amount' | 'membershipAmount' | 'rpnAmount'
    >,
    options: {
      strictFundTypePresence: boolean
      strictForBothFundType: boolean
    }
  ) {
    if (transaction.type !== TransactionType.CREDIT) {
      return
    }

    const fundType = transaction.fundType

    if (!fundType) {
      if (options.strictFundTypePresence) {
        throw new TransactionDomainError(
          'fundType est requis pour appliquer une transaction credit.',
          400
        )
      }
      return
    }

    if (
      fundType !== TransactionFundType.MEMBERSHIP &&
      fundType !== TransactionFundType.RPN &&
      fundType !== TransactionFundType.BOTH
    ) {
      throw new TransactionDomainError('fundType est invalide.', 400)
    }

    if (fundType === TransactionFundType.BOTH && options.strictForBothFundType) {
      const membershipAmount = toPositiveAmount(transaction.membershipAmount)
      const rpnAmount = toPositiveAmount(transaction.rpnAmount)
      const amount = toPositiveAmount(transaction.amount)

      if (!almostEqual(membershipAmount + rpnAmount, amount)) {
        throw new TransactionDomainError(
          'Pour fundType=both, membershipAmount + rpnAmount doit etre egal a amount.',
          400
        )
      }
    }
  }

  /**
   * Summary:
   * Traduit une transaction crédit en allocation exploitable (`membershipAmount`, `rpnAmount`).
   * Contexte fonctionnel:
   * Point unique pour calculer l'impact financier réel appliqué au compte utilisateur.
   * Exemple:
   * `fundType=rpn` et `amount=50` retourne `{ membershipAmount: 0, rpnAmount: 50 }`.
   */
  private resolveCreditAllocation(transaction: TransactionDocument): CreditAllocation {
    const amount = toPositiveAmount(transaction.amount)

    if (transaction.fundType === TransactionFundType.MEMBERSHIP) {
      return {
        membershipAmount: toPositiveAmount(transaction.membershipAmount) || amount,
        rpnAmount: 0,
      }
    }

    if (transaction.fundType === TransactionFundType.RPN) {
      return {
        membershipAmount: 0,
        rpnAmount: toPositiveAmount(transaction.rpnAmount) || amount,
      }
    }

    if (transaction.fundType === TransactionFundType.BOTH) {
      const membershipAmount = toPositiveAmount(transaction.membershipAmount)
      const rpnAmount = toPositiveAmount(transaction.rpnAmount)

      if (!almostEqual(membershipAmount + rpnAmount, amount)) {
        throw new TransactionDomainError(
          'Transaction BOTH invalide: membershipAmount + rpnAmount doit etre egal a amount.',
          400
        )
      }

      return {
        membershipAmount,
        rpnAmount,
      }
    }

    throw new TransactionDomainError('fundType manquant ou invalide pour appliquer la transaction.', 400)
  }

  /**
   * Summary:
   * Charge une transaction par id ou lève une erreur métier 404 si absente.
   * Contexte fonctionnel:
   * Sert de garde central avant toute transition pour éviter des traitements sur des ids invalides.
   * Exemple:
   * Si une ancienne transaction est encore en statut `success`, elle est normalisée vers `completed`.
   */
  private async getTransactionOrThrow(transactionId: string): Promise<TransactionDocument> {
    const transaction = await TransactionModel.findById(transactionId)

    if (!transaction) {
      throw new TransactionDomainError('Transaction introuvable.', 404)
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      transaction.status = TransactionStatus.COMPLETED
      await transaction.save()
    }

    return transaction
  }
}

export const transactionDomainService = new TransactionDomainService()
