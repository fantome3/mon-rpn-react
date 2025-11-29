import { ReservationModel } from "../models/feteNoel2025Model";
import { sendReservationStatusEmail } from "../mailer/reservationEvenementMailer";

export interface ReservationPersonneDTO {
  prenom: string;
  nom: string;
}

export interface ReservationCompteDTO {
  titulaire: ReservationPersonneDTO;
  email: string;
  telephone: string;
}

export interface ReservationMetaDTO {
  etablissement?: string;
  numEtudiant?: string;
  eventDate?: string;
  membershipStatus?: string;
}

export interface CreateReservationInput {
  forfaitType: "etudiant" | "travailleur" | "famille";
  compte: ReservationCompteDTO;
  accompagnateurs: ReservationPersonneDTO[];
  interacCode: string;
  participantCount: number;
  unitPrice: number;
  totalAmount: number;
  discountMultiplier: number;
  meta?: ReservationMetaDTO;
}

const sanitizePersonne = (personne: ReservationPersonneDTO) => ({
  prenom: personne.prenom.trim(),
  nom: personne.nom.trim(),
});

const sanitizeMeta = (meta?: ReservationMetaDTO) => {
  if (!meta) return undefined;
  const { eventDate, ...rest } = meta;
  const cleaned = Object.fromEntries(
    Object.entries(rest).filter(
      ([, value]) =>
        value !== undefined && value !== null && String(value).trim() !== ""
    )
  );
  return {
    ...cleaned,
    ...(eventDate ? { eventDate } : {}),
  };
};

export async function createReservation(
  input: CreateReservationInput
) {
  const {
    forfaitType,
    compte,
    accompagnateurs,
    interacCode,
    participantCount,
    unitPrice,
    totalAmount,
    discountMultiplier,
    meta,
  } = input;

  const reservationDoc = await ReservationModel.create({
    forfaitType,
    compte: {
      titulaire: sanitizePersonne(compte.titulaire),
      email: compte.email.trim(),
      telephone: compte.telephone.trim(),
    },
    accompagnateurs: accompagnateurs.map(sanitizePersonne),
    interacCode: interacCode.trim().toUpperCase(),
    participantCount,
    unitPrice,
    totalAmount,
    discountMultiplier,
    meta: sanitizeMeta(meta),
    eventDate: "2025-12-20 19:00:00.000Z",
    // eventDate: meta?.eventDate ? new Date(meta.eventDate) : undefined,
  });

  const reservation = reservationDoc.toObject();

  try {
    await sendReservationStatusEmail({
      to: reservation.compte.email,
      prenom: reservation.compte.titulaire.prenom,
      nom: reservation.compte.titulaire.nom,
      forfaitType: reservation.forfaitType,
      participantCount: reservation.participantCount,
      eventDate: reservation.eventDate,
      totalAmount: reservation.totalAmount,
      interacCode: reservation.interacCode,
      status: reservation.status ?? "pending",
      scenario: "created",
    });
  } catch (error) {
    console.error("Failed to send reservation confirmation email:", error);
  }

  return reservation;
}

export async function listReservations() {
  return ReservationModel.find()
    .sort({ createdAt: -1 })
  .lean()
    .exec();
}

export async function confirmReservation(id: string) {
  return ReservationModel.findByIdAndUpdate(
    id,
    { status: "confirmed", paymentConfirmedAt: new Date() },
    { new: true }
  )
    .lean()
    .exec();
}

export async function updateReservationAmount(id: string, totalAmount: number) {
  return ReservationModel.findByIdAndUpdate(
    id,
    { totalAmount },
    { new: true }
  )
    .lean()
    .exec();
}

export async function deleteReservation(id: string) {
  const reservationDoc = await ReservationModel.findByIdAndDelete(id);
  if (!reservationDoc) return null;

  const reservation = reservationDoc.toObject();

  try {
    await sendReservationStatusEmail({
      to: reservation.compte.email,
      prenom: reservation.compte.titulaire.prenom,
      nom: reservation.compte.titulaire.nom,
      forfaitType: reservation.forfaitType,
      participantCount: reservation.participantCount,
      eventDate: reservation.eventDate,
      totalAmount: reservation.totalAmount,
      interacCode: reservation.interacCode,
      status: "refunded",
      scenario: "refunded",
    });
  } catch (error) {
    console.error("Failed to send reservation refund email:", error);
  }

  return reservation;
}
