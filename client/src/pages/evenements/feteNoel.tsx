import { SearchEngineOptimization } from "@/components/SearchEngine/SearchEngineOptimization";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import decorationNoel from "@/assets/image-noel.jpg";
import floconNeige from "@/assets/flocon-neige-anime.gif";
import { differenceInSeconds } from "date-fns";
import { motion } from "framer-motion";
import { Forfait, ForfaitType } from "@/pages/evenements/forfait";
import { Personne } from "@/pages/evenements/personne";
import { Compte } from "@/pages/evenements/compte";
import { Reservation } from "@/pages/evenements/reservation";
import { useNewReservationMutation } from "@/hooks/evenementsAnnuelHook";

const PROMO_END = new Date("2025-12-17T23:59:59");
const FIRST_VISIT_KEY = "first_visit";
const baseDiscount = 40;

const formatCurrency = (value: number) => value.toFixed(2);

export default function BalNoelLanding() {
  const { mutateAsync: createReservation } = useNewReservationMutation();
  
  const [now, setNow] = useState(() => new Date());
  const [firstVisitTime, setFirstVisitTime] = useState<number | null>(() => {
    const v = localStorage.getItem(FIRST_VISIT_KEY);
    return v ? Number(v) : null;
  });
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!firstVisitTime) {
      const dateNow = Date.now();
      localStorage.setItem(FIRST_VISIT_KEY, String(dateNow));
      setFirstVisitTime(dateNow);
    }
  }, [firstVisitTime]);

  const promoActive = now < PROMO_END;

  const instantBonusActive = useMemo(() => {
    if (!firstVisitTime) return false;
    const diffMs = Date.now() - firstVisitTime;
    return diffMs <= 24 * 60 * 60 * 1000;
  }, [firstVisitTime, now]);

  const discountMultiplier = useMemo(() => {
    let d = 0;
    if (promoActive) d += 0.4;
    if (instantBonusActive) d += 0.1;
    return d;
  }, [promoActive, instantBonusActive]);

  const [step, setStep] = useState(1);
  const [forfaitType, setForfaitType] = useState<ForfaitType>("travailleur");
  const [accompanyingPersonsCount, setAccompanyingPersonsCount] = useState(0);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [etablissement, setEtablissement] = useState("");
  const [numEtudiant, setNumEtudiant] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [interacCode, setInteracCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const secondsLeft = Math.max(0, differenceInSeconds(PROMO_END, now));
  const days = Math.floor(secondsLeft / (60 * 60 * 24));
  const hours = Math.floor((secondsLeft / (60 * 60)) % 24);
  const minutes = Math.floor((secondsLeft / 60) % 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    setPersonnes((prev) => {
      if (accompanyingPersonsCount === prev.length) {
        return prev;
      }
      if (accompanyingPersonsCount > prev.length) {
        return [
          ...prev,
          ...Array.from(
            { length: accompanyingPersonsCount - prev.length },
            () => Personne.empty()
          ),
        ];
      }
      return prev.slice(0, accompanyingPersonsCount);
    });
  }, [accompanyingPersonsCount]);

  const forfaits = useMemo(() => Forfait.all(), []);
  const selectedForfait = useMemo(
    () => Forfait.fromType(forfaitType),
    [forfaitType]
  );
  const unitPrice = useMemo(
    () => selectedForfait.getDiscountedPrice(discountMultiplier),
    [selectedForfait, discountMultiplier]
  );
  const totalParticipants = accompanyingPersonsCount + 1;
  const totalAmount = useMemo(
    () => Number((unitPrice * totalParticipants).toFixed(2)),
    [unitPrice, totalParticipants]
  );

  const handlePersonneChange = useCallback(
    (index: number, field: "prenom" | "nom", value: string) => {
      setPersonnes((prev) => {
        const next = [...prev];
        const current = next[index] ?? Personne.empty();
        next[index] =
          field === "prenom" ? current.withPrenom(value) : current.withNom(value);
        return next;
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (!nom.trim() || !prenom.trim() || !email.trim() || !interacCode.trim()) {
      alert(
        "Veuillez remplir les champs obligatoires (Nom, Prénom, Courriel, Code Interac)."
      );
      return;
    }

    if (!interacCode.trim().toUpperCase().startsWith("CA")) {
      alert('Le code Interac doit commencer par "CA".');
      return;
    }

    if (telephone.trim().length === 0) {
      alert("Veuillez indiquer un numéro de téléphone valide.");
      return;
    }

    if (
      accompanyingPersonsCount > 0 &&
      personnes.some((personne) => !personne.isComplete())
    ) {
      alert("Veuillez compléter les informations de tous les accompagnateurs.");
      return;
    }

    if (forfaitType === "etudiant" && (!etablissement.trim() || !numEtudiant.trim())) {
      alert("Veuillez préciser l'établissement et le numéro d'étudiant.");
      return;
    }

    const titulaire = new Personne(prenom, nom);
    const compte = new Compte(titulaire, email, telephone);

    if (!compte.isValid()) {
      alert(
        "Les informations du compte principal sont incomplètes. Vérifiez le courriel et le téléphone."
      );
      return;
    }

    const reservation = new Reservation(
      selectedForfait,
      compte,
      personnes,
      interacCode,
      discountMultiplier
    );
    console.log("Reservation payload:", reservation.toPayload());

    try {
      setIsSubmitting(true);
      await createReservation(reservation.toPayload());

      setSubmitted(true);
      alert(
        "Réservation enregistrée ! Vous recevrez une confirmation par courriel sous 24h."
      );
    } catch (error) {
      console.error(error);
      alert(
        "Impossible de confirmer votre réservation pour le moment. Veuillez réessayer plus tard."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accompanyingPersonsCount,
    discountMultiplier,
    email,
    etablissement,
    interacCode,
    isSubmitting,
    nom,
    numEtudiant,
    personnes,
    prenom,
    selectedForfait,
    telephone,
    forfaitType,
  ]);

  return (
    <>
      <SearchEngineOptimization title="Fête de Noël" />
      <div className="min-h-screen bg-[linear-gradient(180deg,#081126,rgba(2,6,23,0.6))] text-white">
        <div
          className="fixed inset-0 -z-10 bg-center bg-cover opacity-90"
          style={{ backgroundImage: `url(${floconNeige})` }}
        />

        <div className="max-w-md mx-auto px-4 pt-6 pb-24">
          <header className="mb-4">
            <div className="rounded-xl overflow-hidden shadow-2xl bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent border border-white/5">
              <div className="bg-gradient-to-r via-[#ff4d79] rounded-2xl px-6 py-4 shadow-lg max-w-sm w-full mb-5">
                <p className="text-sm font-medium mb-2">
                  Profitez de{" "}
                  <span className="text-yellow-300 font-extrabold">
                    -{baseDiscount} %
                  </span>{" "}
                  jusqu’au <span className="underline">17 décembre</span>
                </p>
                <div className="flex justify-around font-bold text-xl sm:text-2xl">
                  <div>
                    <p>{String(days).padStart(2, "0")}</p>
                    <span className="text-xs font-normal">JOURS</span>
                  </div>
                  <div>
                    <p>{String(hours).padStart(2, "0")}</p>
                    <span className="text-xs font-normal">HEURES</span>
                  </div>
                  <div>
                    <p>{String(minutes).padStart(2, "0")}</p>
                    <span className="text-xs font-normal">MINUTES</span>
                  </div>
                  <div>
                    <p>{String(seconds).padStart(2, "0")}</p>
                    <span className="text-xs font-normal">SECONDES</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-40 sm:h-52 relative">
                <img
                  src={decorationNoel}
                  alt="Bal de Noël - aperçu"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                  <div>
                    <h1 className="text-xl font-semibold">
                      Le Bal de Noël Chic — Université Laval
                    </h1>
                    <p className="text-sm opacity-80">
                      23 décembre 2025 · Pavillon Desjardins
                    </p>
                  </div>
                </div>
              </div>

              <section className="mb-4 mt-5">
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Déjà 64 femmes inscrites
                      </div>
                      <div className="text-xs opacity-80">Et 34 hommes inscrits</div>
                    </div>
                    <div className="text-right text-xs opacity-70">
                      Il reste <span className="font-semibold">58 places</span>
                    </div>
                  </div>

                  <div>
                    <img
                      src={decorationNoel}
                      alt="Souvenir 1"
                      className="w-full h-24 object-cover rounded"
                    />
                  </div>
                </div>
              </section>

              <div className="p-4">
                <div className="text-xs uppercase text-amber-300 font-semibold">
                  Offre spéciale
                </div>

                {instantBonusActive && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="relative bg-yellow-400 text-red-700 px-4 py-2 rounded-full font-bold shadow-md animate-pulse"
                  >
                    🎁 -10 % en bonus si tu réserves avec minimum 25$ dans les 4h qui
                    suivent !
                  </motion.div>
                )}

                <div className="mt-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      formRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold shadow-md"
                  >
                    Je réserve ma place maintenant
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section ref={formRef} className="mb-4">
            <div className="rounded-xl p-3 bg-white/5 border border-white/5">
              <h2 className="text-sm font-semibold mb-2">Choisi ton forfait :</h2>
              <div className="grid gap-2">
                {forfaits.map((f) => {
                  const isSelected = forfaitType === f.type;
                  const discounted = f.getDiscountedPrice(discountMultiplier);
                  return (
                    <div
                      key={f.type}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isSelected
                          ? "bg-amber-800/20 border border-amber-400/20"
                          : "bg-black/10"
                      }`}
                      onClick={() => setForfaitType(f.type)}
                      role="button"
                    >
                      <div>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-xs opacity-70">{f.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm line-through opacity-60">
                          ${formatCurrency(f.basePrice)}
                        </div>
                        <div className="text-lg font-semibold">
                          ${formatCurrency(discounted)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-6">
            <div className="rounded-xl p-4 bg-gradient-to-b from-black/10 to-transparent border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">Réservation</div>
                  <div className="text-xs opacity-80">Étape {step} / 4</div>
                </div>
                <div className="text-right text-xs opacity-80">
                  Total:{" "}
                  <span className="font-semibold">
                    ${formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {step === 1 && (
                <div>
                  <label className="block text-xs mb-1">
                    Combien de personnes t'accompagnent ?
                  </label>
                  <select
                    value={accompanyingPersonsCount}
                    onChange={(e) =>
                      setAccompanyingPersonsCount(Number(e.target.value))
                    }
                    className="w-full p-3 rounded-lg bg-black/10"
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>

                  {forfaitType === "etudiant" && (
                    <div className="mt-3">
                      <input
                        placeholder="Établissement"
                        value={etablissement}
                        onChange={(e) => setEtablissement(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black/10 mb-2"
                      />
                      <input
                        placeholder="Numéro d'étudiant"
                        value={numEtudiant}
                        onChange={(e) => setNumEtudiant(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black/10"
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold"
                      onClick={() => setStep(2)}
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <label className="block text-xs mb-1">Contact principal</label>
                  <input
                    placeholder="Prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/10 mb-2"
                  />
                  <input
                    placeholder="Nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/10 mb-2"
                  />
                  <input
                    placeholder="Courriel"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/10 mb-2"
                  />
                  <input
                    placeholder="Téléphone"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/10"
                  />

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-lg bg-black/20"
                      onClick={() => setStep(1)}
                    >
                      Retour
                    </button>
                    <button
                      className="flex-1 py-3 rounded-lg bg-amber-500 text-black font-semibold"
                      onClick={() => setStep(accompanyingPersonsCount > 0 ? 3 : 4)}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && accompanyingPersonsCount > 0 && (
                <div>
                  <label className="block text-xs mb-1">
                    Informations des accompagnateurs
                  </label>
                  {personnes.map((personne, i) => (
                    <div key={i} className="mb-2">
                      <input
                        placeholder={`Prénom ${i + 1}`}
                        value={personne.prenom}
                        onChange={(e) =>
                          handlePersonneChange(i, "prenom", e.target.value)
                        }
                        className="w-full p-3 rounded-lg bg-black/10 mb-2"
                      />
                      <input
                        placeholder={`Nom ${i + 1}`}
                        value={personne.nom}
                        onChange={(e) =>
                          handlePersonneChange(i, "nom", e.target.value)
                        }
                        className="w-full p-3 rounded-lg bg-black/10"
                      />
                    </div>
                  ))}

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-lg bg-black/20"
                      onClick={() => setStep(2)}
                    >
                      Retour
                    </button>
                    <button
                      className="flex-1 py-3 rounded-lg bg-amber-500 text-black font-semibold"
                      onClick={() => setStep(4)}
                    >
                      Paiement
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="block text-xs mb-1">Paiement Interac</label>
                  <div className="text-xs opacity-80 mb-2">
                    Envoyez le montant total à :{" "}
                    <span className="font-semibold text-red-500">
                      balnoel@association.com
                    </span>
                  </div>
                  <div className="text-xs opacity-80 mb-4">
                    Veuillez entrer le code de transaction Interac reçu après votre
                    paiement. Il doit commencer par "CA".
                  </div>
                  <input
                    placeholder="Code référence Interac: CA122222"
                    value={interacCode}
                    onChange={(e) => setInteracCode(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/10 mb-3"
                  />

                  <div className="text-sm opacity-80 mb-3">
                    Total à envoyer :{" "}
                    <span className="font-semibold">
                      ${formatCurrency(totalAmount)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-lg bg-black/20"
                      onClick={() => setStep(Math.max(1, accompanyingPersonsCount > 0 ? 3 : 2))}
                    >
                      Retour
                    </button>
                    <button
                      className="flex-1 py-3 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Envoi en cours..." : "Confirmer la réservation"}
                    </button>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="mt-3 p-3 rounded-lg bg-green-800/30">
                  Merci ! Votre réservation a été enregistrée.
                </div>
              )}
            </div>
          </section>

          <footer className="text-xs opacity-80 mb-10">
            <div className="mb-2">📍 Pavillon Desjardins — Université Laval</div>
            <div className="mb-2">🎩 Code vestimentaire: Chic & Élégant</div>
            <div className="mb-2">
              ❗ Toutes les réservations sont confirmées après réception du code Interac.
            </div>
          </footer>
        </div>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 w-[min(640px,calc(100%-32px))]">
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-white/5">
            <div>
              <div className="text-xs opacity-80">Total</div>
              <div className="font-semibold text-lg">
                ${formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="flex-1">
              <button
                onClick={() => {
                  setStep(1);
                  formRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold"
              >
                Je réserve ma place →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
