import { useMemo, useState } from "react";
import {
  useGetReservationsQuery,
  useConfirmReservationMutation,
  useRefundReservationMutation,
  useUpdateReservationAmountMutation,
  ReservationRecord,
} from "@/hooks/evenementsAnnuelHook";
import { motion } from "framer-motion";

export default function AdminBookingList() {
  const { data, isLoading, isError, error } = useGetReservationsQuery();
  const { mutateAsync: confirmReservation, isPending: isConfirming } = useConfirmReservationMutation();
  const { mutateAsync: refundReservation, isPending: isRefunding } = useRefundReservationMutation();
  const { mutateAsync: updateReservationAmount, isPending: isUpdating } = useUpdateReservationAmountMutation();

  const bookings = useMemo(() => data ?? [], [data]);

  const [selected, setSelected] = useState<ReservationRecord | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAmount, setUpdateAmount] = useState<number>(0);

  const totalCaisse = useMemo(() => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [bookings]);

  const formatCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: "CAD",
      }).format(n);
    } catch (_e) {
      return `${n} $`;
    }
  };

  const onConfirmPayment = (bookingId: string) => confirmReservation(bookingId);
  const onRefund = (bookingId: string) => refundReservation(bookingId);

  const onOpenUpdate = (booking: ReservationRecord) => {
    setSelected(booking);
    setUpdateAmount(booking.totalAmount);
    setShowUpdateModal(true);
  };

  const onSaveUpdate = () => {
    if (!selected) return;
    updateReservationAmount({ id: selected._id, totalAmount: Number(updateAmount) });
    setShowUpdateModal(false);
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 animate-pulse">Chargement…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <span className="text-red-500 font-medium">
          Impossible de récupérer les réservations<br />{String(error)}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6">
      {/* Header */}
      <header className="mb-4 sticky top-0 bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Réservations — Admin</h1>
          <p className="text-xs text-slate-500 mt-0.5">Vue optimisée mobile</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Total en caisse</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalCaisse)}</p>
        </div>
      </header>

      <main className="space-y-3 pb-10">
        {bookings.map((b) => (
          <motion.article
            key={b._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow p-4 border border-slate-100 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[13px] text-slate-400">Forfait</p>
                <p className="font-semibold text-slate-700">
                  {b.forfaitType}
                  <span className="ml-2 text-[11px] uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {b.status}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Participants</p>
                <p className="font-semibold text-slate-700">{b.participantCount}</p>
              </div>
            </div>

            {/* Titulaire */}
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-slate-400 text-xs">Titulaire:</span>{" "}
                <span className="font-medium text-slate-700">
                  {b.compte.titulaire.prenom} {b.compte.titulaire.nom}
                </span>
              </p>
              <p>
                <span className="text-slate-400 text-xs">Tél:</span>{" "}
                <a href={`tel:${b.compte.telephone}`} className="text-sky-600 underline font-medium">
                  {b.compte.telephone}
                </a>
              </p>
              <p>
                <span className="text-slate-400 text-xs">Email:</span>{" "}
                <a href={`mailto:${b.compte.email}`} className="text-sky-600 underline truncate">
                  {b.compte.email}
                </a>
              </p>
              <p>
                <span className="text-slate-400 text-xs">Code Interac:</span>{" "}
                <span className="font-medium text-slate-700">{b.interacCode}</span>
              </p>
            </div>

            {/* Montant */}
            <div className="mt-4 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
              <div>
                <p className="text-xs text-slate-400">Montant payé</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(b.totalAmount)}</p>
              </div>
              <p className="text-[11px] text-slate-500">
                {formatCurrency(b.unitPrice)} /u · Remise x{b.discountMultiplier ?? 1}
              </p>
            </div>

            {/* Accompagnateurs */}
            {b.accompagnateurs?.length > 0 && (
              <div className="mt-3 text-sm bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-400 mb-1">Accompagnateurs</p>
                <ul className="list-disc list-inside text-slate-700">
                  {b.accompagnateurs.map((a, i) => (
                    <li key={i}>{a.prenom} {a.nom}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => onConfirmPayment(b._id)}
                className="py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                disabled={isConfirming}
              >
                Confirmer
              </button>
              <button
                onClick={() => onOpenUpdate(b)}
                className="py-2 rounded-xl bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500"
              >
                Modifier
              </button>
              <button
                onClick={() => onRefund(b._id)}
                className="py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                disabled={isRefunding}
              >
                Rembourser
              </button>
            </div>
          </motion.article>
        ))}

        {bookings.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">Aucune réservation trouvée.</div>
        )}
      </main>

      {/* Update Modal */}
      {showUpdateModal && selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpdateModal(false)} />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold">Modifier paiement</h3>
            <p className="text-sm text-slate-500 mt-1">
              {selected.compte.titulaire.prenom} {selected.compte.titulaire.nom}
            </p>

            <div className="mt-4">
              <label className="block text-sm text-slate-600">Montant total (CAD)</label>
              <input
                type="number"
                value={updateAmount}
                onChange={(e) => setUpdateAmount(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border p-2 text-center font-semibold"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={onSaveUpdate}
                className="py-2 rounded-lg bg-sky-600 text-white font-semibold disabled:opacity-50"
                disabled={isUpdating}
              >
                Enregistrer
              </button>
              <button onClick={() => setShowUpdateModal(false)} className="py-2 rounded-lg border">
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
