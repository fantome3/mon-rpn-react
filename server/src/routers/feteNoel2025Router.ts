import express from "express";
import expressAsyncHandler from "express-async-handler";
import {
  createReservation,
  CreateReservationInput,
  listReservations,
  confirmReservation,
  updateReservationAmount,
  deleteReservation,
} from "../services/reservationFeteNoel2025Service";

export const reservationRouter = express.Router();

reservationRouter.post(
  "/new",
  expressAsyncHandler(async (req, res) => {
    console.log("Creating new reservation with data:", req.body);
    const reservation = await createReservation(
      req.body as CreateReservationInput
    );
    res.status(201).json(reservation);
  })
);

reservationRouter.get(
  "/all",
  expressAsyncHandler(async (_req, res) => {
    const reservations = await listReservations();
    res.json(reservations);
  })
);

reservationRouter.post(
  "/:id/confirm",
  expressAsyncHandler(async (req, res) => {
    const reservation = await confirmReservation(req.params.id);
    //if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.json(reservation);
  })
);

reservationRouter.patch(
  "/:id/amount",
  expressAsyncHandler(async (req, res) => {
    const { totalAmount } = req.body as { totalAmount: number };
    const reservation = await updateReservationAmount(req.params.id, totalAmount);
    // if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.json(reservation);
  })
);

reservationRouter.delete(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const deleted = await deleteReservation(req.params.id);
    // if (!deleted) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(204).end();
  })
);
