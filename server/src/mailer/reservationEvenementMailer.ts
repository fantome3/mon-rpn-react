import { sendEmail } from "./core";
import { emailTemplate } from "./templates/emailTemplate";

type ReservationEmailStatus = "pending" | "confirmed" | "refunded";
type ReservationEmailScenario = "created" | "refunded";

interface ReservationEmailParams {
  to: string;
  prenom: string;
  nom: string;
  forfaitType: string;
  participantCount: number;
  eventDate?: Date | string | null;
  totalAmount: number;
  interacCode: string;
  status: ReservationEmailStatus;
  // reservationDate: Date | string;
  scenario: ReservationEmailScenario;
  contactEmail?: string;
  contactPhone?: string;
  organisationName?: string;
}

const DEFAULT_CONTACT_PHONE =
  process.env.RESERVATION_CONTACT_PHONE ?? "+1 (418) 261-3989";
const DEFAULT_ORGANISATION_NAME =
  process.env.RESERVATION_ORG_NAME ?? "Comité Bal de Noël - ACQ";

const STATUS_LABELS: Record<ReservationEmailStatus, string> = {
  pending: "En attente de confirmation",
  confirmed: "Paiement confirmé",
  refunded: "Remboursement effectué",
};

const STATUS_ICONS: Record<ReservationEmailStatus, string> = {
  pending: "⏳",
  confirmed: "✅",
  refunded: "💸",
};

const SUBJECTS: Record<ReservationEmailScenario, string> = {
  created: "Confirmation de votre réservation",
  refunded: "Mise à jour de votre réservation – remboursement effectué",
};

const SCENARIO_INTRO: Record<ReservationEmailScenario, string> = {
  created:
    "Nous avons le plaisir de vous confirmer la réception de votre réservation.",
  refunded:
    "Nous vous confirmons que votre réservation a été remboursée.",
};

const SCENARIO_FOOTER: Record<ReservationEmailScenario, string> = {
  created: "Nous vous tiendrons informé(e) dès que le paiement sera confirmé.",
  refunded:
    "Le remboursement sera visible sur votre relevé bancaire sous peu. N’hésitez pas à nous écrire pour toute question.",
};

const formatDateFr = (value?: Date | string | null) => {
  if (!value) return "À confirmer";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "À confirmer";
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

const formatAmount = (amount: number) =>
  `${amount.toFixed(2)} $ CAD`.replace(".", ",");

export const sendReservationStatusEmail = async ({
  to,
  prenom,
  nom,
  forfaitType,
  participantCount,
  eventDate,
  totalAmount,
  interacCode,
  status,
  // reservationDate,
  scenario,
  contactPhone = DEFAULT_CONTACT_PHONE,
  organisationName = DEFAULT_ORGANISATION_NAME,
}: ReservationEmailParams) => {
  // const formattedReservationDate = formatDateFr(reservationDate);
  const formattedEventDate = formatDateFr(eventDate);
  const formattedAmount = formatAmount(totalAmount);
  const statusLine = `${STATUS_ICONS[status]} ${STATUS_LABELS[status]}`;

  const bodyHtml = `
    <p>Bonjour ${prenom} ${nom},</p>
    <p>${SCENARIO_INTRO[scenario]}</p>
    <p>📌 <strong>Détails de votre réservation :</strong></p>
    <ul>
      <li>Type de forfait : <strong>${forfaitType}</strong></li>
      <li>Nombre de participants : <strong>${participantCount}</strong></li>
      <li>Date de l’événement : <strong>${formattedEventDate}</strong></li>
      <li>Montant total : <strong>${formattedAmount}</strong></li>
      <li>Code Interac : <strong>${interacCode}</strong></li>
    </ul>
    <p>Votre statut actuel : <strong>${statusLine}</strong></p>
    <p>${SCENARIO_FOOTER[scenario]}</p>
    <p>📞 Pour toute question ou modification, contactez-nous au <a href="tel:${contactPhone}">${contactPhone}</a>.</p>
    <p>Merci pour votre confiance,<br/>L’équipe ${organisationName}</p>
  `;

  const plainText = [
    `Bonjour ${prenom} ${nom},`,
    ``,
    `${SCENARIO_INTRO[scenario]}`,
    ``,
    `Détails de votre réservation :`,
    `- Type de forfait : ${forfaitType}`,
    `- Nombre de participants : ${participantCount}`,
    `- Date de l’événement : ${formattedEventDate}`,
    `- Montant total : ${formattedAmount}`,
    `- Code Interac : ${interacCode}`,
    ``,
    `Votre statut actuel : ${statusLine}`,
    ``,
    `${SCENARIO_FOOTER[scenario]}`,
    ``,
    `Pour toute question ou modification, contactez-nous au ${contactPhone}.`,
    ``,
    `Merci pour votre confiance,`,
    `L’équipe ${organisationName}`,
  ].join("\n");

  await sendEmail({
    to,
    subject: SUBJECTS[scenario],
    text: plainText,
    html: emailTemplate({ content: bodyHtml }),
  });
};