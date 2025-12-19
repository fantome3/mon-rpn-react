import { ResetPwdParams, 
         NewUserParams, 
         PassTempParams, 
         AlerteParams, 
         AccountStatusParams, 
         FailMemberRegistrationParams, 
         DeceasedParams, 
         PaymentFailedParams, 
         FuneralCostParams, 
         ContributionConfirmationParams 
} from "./emailModel";

export const emailContents = {
  motDePasseOublie: {
    sujet: '🔒 Réinitialisation de votre mot de passe – ACQ-RPN',
    texte: ({ userId, token }: ResetPwdParams) => `
      <p>Bonjour,</p>
      <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte ACQ-RPN.</p>
      <p>Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous&nbsp;:</p>
      <p><a href="https://www.acq-rpn.org/reset-password/${userId}/${token}" style="color:#1a73e8;">Réinitialiser mon mot de passe</a></p>
      <br/>
      <p>Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce courriel.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  nouvelUtilisateur: {
    sujet: '🎉 Nouvelle inscription sur la plateforme ACQ-RPN',
    texte: ({
      firstName, lastName, email,
      nativeCountry, residenceCountry, contactNumber: tel,
      paymentMethod, accountBalance: solde
    }: NewUserParams) => `
      <h1 style="font-size:18px;margin-top:0;">Nouvel utilisateur inscrit</h1>
      <p style="line-height:1.6;">Bonjour,</p>
      <p style="line-height:1.6;">Un nouvel utilisateur vient de s'inscrire sur votre plateforme ACQ-RPN. Voici ses informations&nbsp;:</p>
      <ul style="line-height:1.6;padding-left:20px;">
        <li>Prénom(s)&nbsp;: ${firstName}</li>
        <li>Nom&nbsp;: ${lastName}</li>
        <li>Courriel&nbsp;: ${email}</li>
        <li>Pays d'origine&nbsp;: ${nativeCountry}</li>
        <li>Pays de résidence&nbsp;: ${residenceCountry}</li>
        <li>Numéro&nbsp;: ${tel}</li>
        <li>Méthode de paiement&nbsp;: ${paymentMethod}</li>
        <li>Solde de départ : ${solde}$, veuillez le renflouer afin de maintenir vos avantages.</li>
      </ul>`
  },

  envoiMotDePasse: {
    sujet: '🛡 Votre mot de passe temporaire – ACQ-RPN',
    texte: ({ password }: PassTempParams) => `
      <p>Bonjour,</p>
      <p>Bienvenue sur la plateforme ACQ-RPN&nbsp;!</p>
      <p>Voici votre mot de passe temporaire&nbsp;: <span style="font-weight:bold;font-size:16px;color:#e67e22;">${password}</span></p>
      <p>Pour des raisons de sécurité, changez-le dès votre première connexion dans votre <a href="https://www.acq-rpn.org/reset-password/profil" style="color:#1a73e8;">profil</a>.</p>
      <p style="margin-top:20px;">Au plaisir de vous accompagner,</p>`
  },

  alerteDesactivation: {
    sujet: '⚠️ Action requise – risque de désactivation de votre compte',
    texte: ({ raison, dateLimite }: AlerteParams) => `
      <p>Bonjour,</p>
      <p>Suite à <strong>${raison}</strong>, votre compte ACQ-RPN pourrait être désactivé le <strong>${dateLimite}</strong>.</p>
      <p>Merci de régulariser votre situation avant cette date afin d’éviter toute interruption de service.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  compteDesactive: {
    sujet: '🚫 Votre compte ACQ-RPN a été désactivé',
    texte: () => `
      <h2>Compte désactivé</h2>
      <p>Bonjour,</p>
      <p>Votre compte a été désactivé faute de régularisation dans les délais impartis.</p>
      <p>Pour toute réactivation, veuillez contacter l’administration à l’adresse <a href="mailto:acq.quebec@gmail.com">acq.quebec@gmail.com</a>.</p>
      <p style="margin-top:20px;">Merci de votre compréhension.</p>`
  },

  soldeInsuffisant: {
    sujet: '🚨 Solde insuffisant pour les prélèvements RPN',
    texte: ({ minimumRequiredBalance, current }: AccountStatusParams) => `
      <p>Bonjour,</p>
      <p>Votre solde actuel est de <strong>${current} $ CAD</strong>, alors que le minimum requis pour les prélèvements RPN est de <strong>${minimumRequiredBalance} $ CAD</strong>
      pour les personnes seules et de <strong>25 $ CAD</strong> pour les familles ou des personnes à charge.</p>
      <p>Merci d’alimenter votre compte afin de maintenir vos avantages.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  inscriptionExterneEchec: {
    sujet: '❌ Échec d’inscription sur l’application externe',
    texte: ({ member, detail }: FailMemberRegistrationParams) => `
      <p>Bonjour,</p>
      <p>L’inscription du membre <strong>${member}</strong> sur l’application externe a échoué.</p>
      <p>Détail&nbsp;: ${detail}</p>
      <p style="margin-top:20px;">Nous vous invitons à prendre contact avec lui.</p>`
  },

  notificationDeces: {
    sujet: ({ name }: Pick<DeceasedParams,'name'>) => `🕊 Avis de décès – ${name}`,
    texte: ({ name, place, date }: DeceasedParams) => `
      <h2>Avis de décès</h2>
      <p>Bonjour,</p>
      <p>Nous avons la profonde tristesse de vous informer du décès de <strong>${name}</strong>, survenu au <strong>${place}</strong> le <strong>${date}</strong>.</p>
      <p>Plus d’informations sont disponibles sur la plateforme ACQ-RPN.</p>
      <p style="margin-top:20px;">Nos pensées accompagnent la famille.</p>`
  },

  prelevementEchecCotisation: {
    sujet: '❌ Cotisation annuelle – prélèvement échoué',
    texte: ({ amount, current }: PaymentFailedParams) => `
      <p>Bonjour,</p>
      <p>Nous n’avons pas pu prélever votre cotisation annuelle de <strong>${amount} $CAD</strong>.</p>
      <p>Votre solde actuel est de <strong>${current} $CAD</strong>. Merci de renflouer votre compte afin de régulariser votre situation.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  prelevementEchecDeces: {
    sujet: '❌ Prélèvement fonds décès – échec',
    texte: ({ amount, current }: FuneralCostParams) => `
      <p>Bonjour,</p>
      <p>Le prélèvement décès de <strong>${amount} $CAD</strong> n’a pas pu être effectué, votre solde est de <strong>${current} $CAD</strong>.</p>
      <p>Merci de recharger votre compte afin de participer au fonds de solidarité communautaire.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  rappelCotisation: {
    sujet: '⏰ Rappel – cotisation annuelle en attente',
    texte: ({ minimumRequiredBalance: required, current }: AccountStatusParams) => `
      <p>Bonjour,</p>
      <p>Votre cotisation annuelle de <strong>${required} $CAD</strong> n’a pas été réglée ; votre solde est actuellement de <strong>${current} $CAD</strong>.</p>
      <p>Merci de procéder au paiement afin de conserver vos privilèges.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  },

  cotisationReussie: {
    sujet: ({ year }: Pick<ContributionConfirmationParams,'year'>) => `✅ Cotisation ${year} réglée avec succès`,
    texte: ({ amount, year }: ContributionConfirmationParams) => `
      <p>Bonjour,</p>
      <p>Nous confirmons la réception de votre cotisation annuelle <strong>${year}</strong> d’un montant de <strong>${amount} $CAD</strong>.</p>
      <p>Merci pour votre engagement et votre confiance.</p>
      <p style="margin-top:20px;">Cordialement,</p>`
  }
} as const;
