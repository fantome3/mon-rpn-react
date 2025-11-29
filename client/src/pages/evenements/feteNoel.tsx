import { SearchEngineOptimization } from "@/components/SearchEngine/SearchEngineOptimization";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import decorationNoel from "@/assets/image-noel.jpg";
import floconNeige from "@/assets/flocon-neige-anime.gif";
import { differenceInSeconds } from "date-fns";
import { motion } from "framer-motion";
import { Forfait, ForfaitType, MembershipStatus } from "@/pages/evenements/forfait";
import { Personne } from "@/pages/evenements/personne";
import { Compte } from "@/pages/evenements/compte";
import { Reservation } from "@/pages/evenements/reservation";
import { useNewReservationMutation } from "@/hooks/evenementsAnnuelHook";

const PROMO_END = new Date("2025-12-17T23:59:59");

const MEMBERSHIP_OPTIONS: {
  value: MembershipStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "membre",
    label: "Membre ACQ",
    description: "Tarif privilégié -90 %",
  },
  {
    value: "nouveau-arrivant",
    label: "Nouvel étudiant / arrivant",
    description: "Découverte -90 %",
  },
  {
    value: "non-membre",
    label: "Non membre",
    description: "Tarif invité -50 %",
  },
];

const formatCurrency = (value: number) => value.toFixed(2);

export default function BalNoelLanding() {
  const { mutateAsync: createReservation } = useNewReservationMutation();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const formRef = useRef<HTMLDivElement | null>(null);

  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus>("membre");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const membershipDiscount = useMemo(
    () => Forfait.getDiscountFor(membershipStatus),
    [membershipStatus]
  );

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

  const clearErrors = useCallback((...keys: string[]) => {
    if (keys.length === 0) return;
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  }, []);

  const registerError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  const validateEmail = useCallback((value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }, []);

  const validateStep1 = useCallback(() => {
    const keysToClear = ["etablissement", "numEtudiant"];
    clearErrors(...keysToClear);
    if (forfaitType !== "etudiant") {
      return true;
    }
    const nextErrors: Record<string, string> = {};
    if (!etablissement.trim()) {
      nextErrors.etablissement = "Veuillez indiquer l'établissement.";
    }
    if (!numEtudiant.trim()) {
      nextErrors.numEtudiant = "Veuillez indiquer votre numéro d'étudiant.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return false;
    }
    return true;
  }, [clearErrors, forfaitType, etablissement, numEtudiant]);

  const validateStep2 = useCallback(() => {
    const keysToClear = ["prenom", "nom", "email", "telephone"];
    clearErrors(...keysToClear);
    const nextErrors: Record<string, string> = {};
    if (!prenom.trim()) nextErrors.prenom = "Le prénom est requis.";
    if (!nom.trim()) nextErrors.nom = "Le nom est requis.";
    if (!email.trim()) nextErrors.email = "Le courriel est requis.";
    else if (!validateEmail(email)) nextErrors.email = "Le courriel n'est pas valide.";
    if (!telephone.trim()) nextErrors.telephone = "Le téléphone est requis.";
    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return false;
    }
    return true;
  }, [clearErrors, email, nom, prenom, telephone, validateEmail]);

  const validateStep3 = useCallback(() => {
    const keysToClear = personnes.flatMap((_, index) => [
      `accompagnateur-${index}-prenom`,
      `accompagnateur-${index}-nom`,
    ]);
    if (keysToClear.length) clearErrors(...keysToClear);
    const nextErrors: Record<string, string> = {};
    personnes.forEach((personne, index) => {
      if (!personne.prenom.trim()) {
        nextErrors[`accompagnateur-${index}-prenom`] =
          "Le prénom de l'accompagnateur est requis.";
      }
      if (!personne.nom.trim()) {
        nextErrors[`accompagnateur-${index}-nom`] =
          "Le nom de l'accompagnateur est requis.";
      }
    });
    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return false;
    }
    return true;
  }, [clearErrors, personnes]);

  const validateStep4 = useCallback(() => {
    clearErrors("interacCode");
    const trimmed = interacCode.trim().toUpperCase();
    if (!trimmed) {
      registerError("interacCode", "Le code Interac est requis.");
      return false;
    }
    if (!trimmed.startsWith("C")) {
      registerError("interacCode", 'Le code Interac doit commencer par "C".');
      return false;
    }
    if (trimmed.length < 5) {
      registerError("interacCode", 'Le code Interac n\'est pas valide.');
      return false;
    }
    return true;
  }, [clearErrors, interacCode, registerError]);

  const handleStep1Next = useCallback(() => {
    if (validateStep1()) {
      setStep(2);
    }
  }, [validateStep1]);

  const handleStep2Next = useCallback(() => {
    if (validateStep2()) {
      setStep(accompanyingPersonsCount > 0 ? 3 : 4);
    }
  }, [accompanyingPersonsCount, validateStep2]);

  const handleStep3Next = useCallback(() => {
    if (validateStep3()) {
      setStep(4);
    }
  }, [validateStep3]);

  const handlePersonneChange = useCallback(
    (index: number, field: "prenom" | "nom", value: string) => {
      clearErrors(`accompagnateur-${index}-${field}`);
      setPersonnes((prev) => {
        const next = [...prev];
        const current = next[index] ?? Personne.empty();
        next[index] =
          field === "prenom" ? current.withPrenom(value) : current.withNom(value);
        return next;
      });
    },
    [clearErrors]
  );

  const closeSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setSubmitted(false);
    setSubmissionError(null);

    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (accompanyingPersonsCount > 0 && !validateStep3()) {
      setStep(3);
      return;
    }

    if (!validateStep4()) {
      return;
    }

    const titulaire = new Personne(prenom, nom);
    const compte = new Compte(titulaire, email, telephone);

    if (!compte.isValid()) {
      validateStep2();
      return;
    }

    const reservation = new Reservation(
      selectedForfait,
      compte,
      personnes,
      interacCode,
      membershipDiscount,
      membershipStatus,
      forfaitType === "etudiant"
        ? {
            ...(etablissement.trim() ? { etablissement: etablissement.trim() } : {}),
            ...(numEtudiant.trim() ? { numEtudiant: numEtudiant.trim() } : {}),
          }
        : {}
    );

    try {
      setIsSubmitting(true);
      console.log("Submitting reservation:", reservation.toPayload());
      await createReservation(
        reservation.toPayload()
      );
      setSubmitted(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      setSubmissionError(
        "Impossible de confirmer votre réservation pour le moment. Veuillez réessayer plus tard."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateStep2,
    validateStep3,
    validateStep4,
    accompanyingPersonsCount,
    prenom,
    nom,
    email,
    telephone,
    personnes,
    interacCode,
    membershipDiscount,
    membershipStatus,
    forfaitType,
    createReservation,
    etablissement,
    numEtudiant,
  ]);

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
    () => selectedForfait.getPrice(membershipStatus),
    [selectedForfait, membershipStatus]
  );
  const totalParticipants = accompanyingPersonsCount + 1;
  const totalAmount = useMemo(
    () => Number((unitPrice * totalParticipants).toFixed(2)),
    [unitPrice, totalParticipants]
  );

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
                  Profitez des réductions de{" "}
                  <span className="text-yellow-300 font-extrabold">
                    -{Math.round(membershipDiscount * 100)} %
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
                      Le Bal de Noël Chic & Élégant
                    </h1>
                    <p className="text-xs opacity-80">
                      20 décembre 2025 · Pavillon Desjardins — Université Laval
                    </p>
                  </div>
                </div>
              </div>

              <section className="mb-4 mt-5">
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Déjà 14 femmes inscrites
                      </div>
                      <div className="text-xs opacity-80">Et 11 hommes inscrits</div>
                    </div>
                    <div className="text-right text-xs opacity-70">
                      Il reste <span className="font-semibold">25 places</span>
                    </div>
                  </div>

{/* était cencer être une image ou video animée */}
                  {/* <div>
                    <img
                      src={decorationNoel}
                      alt="Souvenir 1"
                      className="w-full h-24 object-cover rounded"
                    />
                  </div> */}
                </div>
              </section>

              <div className="p-4">
                <div className="text-xs uppercase text-amber-300 font-semibold">
                  Offre spéciale
                </div>

                {/* {instantBonusActive && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="relative bg-yellow-400 text-red-700 px-4 py-2 rounded-full font-bold shadow-md animate-pulse"
                  >
                    🎁 -10 % en bonus si tu fais des démarches pour être membre au compte de l'année 2026
                  </motion.div>
                )} */}

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
              <h2 className="text-sm font-semibold mb-2">Votre statut :</h2>
              <div className="grid gap-2">
                {MEMBERSHIP_OPTIONS.map((option) => {
                  const checked = membershipStatus === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                        checked
                          ? "border-amber-400/70 bg-amber-900/20"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      <input
                        type="radio"
                        className="h-4 w-4 accent-amber-400"
                        checked={checked}
                        onChange={() => setMembershipStatus(option.value)}
                      />
                      <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs opacity-70">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl p-3 bg-white/5 border border-white/5 mt-4">
              <h2 className="text-sm font-semibold mb-2">Choisis ton forfait :</h2>
              <div className="grid gap-2">
                {forfaits.map((f) => {
                  const isSelected = forfaitType === f.type;
                  const finalPrice = f.getPrice(membershipStatus);
                  const referencePrice = f.getReferencePrice(membershipStatus);
                  return (
                    <div
                      key={f.type}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                        isSelected
                          ? "bg-amber-800/20 border border-amber-400/20"
                          : "bg-black/10 border border-white/5"
                      }`}
                      onClick={() => setForfaitType(f.type)}
                      role="button"
                    >
                      <div>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-xs opacity-70">{f.description}</div>
                      </div>
                      <div className="text-right">
                        {referencePrice > finalPrice && (
                          <div className="text-sm line-through opacity-60">
                            ${formatCurrency(referencePrice)}
                          </div>
                        )}
                        <div className="text-lg font-semibold">
                          ${formatCurrency(finalPrice)}
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
                    onChange={(e) => {
                      clearErrors(
                        ...personnes.flatMap((_, index) => [
                          `accompagnateur-${index}-prenom`,
                          `accompagnateur-${index}-nom`,
                        ])
                      );
                      setAccompanyingPersonsCount(Number(e.target.value));
                    }}
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
                        onChange={(e) => {
                          setEtablissement(e.target.value);
                          clearErrors("etablissement");
                        }}
                        className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                          errors.etablissement ? "ring-1 ring-red-400" : ""
                        }`}
                      />
                      {errors.etablissement && (
                        <p className="text-xs text-red-300">{errors.etablissement}</p>
                      )}
                      <input
                        placeholder="Numéro d'étudiant"
                        value={numEtudiant}
                        onChange={(e) => {
                          setNumEtudiant(e.target.value);
                          clearErrors("numEtudiant");
                        }}
                        className={`w-full p-3 rounded-lg bg-black/10 ${
                          errors.numEtudiant ? "ring-1 ring-red-400" : ""
                        }`}
                      />
                      {errors.numEtudiant && (
                        <p className="text-xs text-red-300">{errors.numEtudiant}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold"
                      onClick={handleStep1Next}
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
                    onChange={(e) => {
                      setPrenom(e.target.value);
                      clearErrors("prenom");
                    }}
                    className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                      errors.prenom ? "ring-1 ring-red-400" : ""
                    }`}
                  />
                  {errors.prenom && (
                    <p className="text-xs text-red-300">{errors.prenom}</p>
                  )}
                  <input
                    placeholder="Nom"
                    value={nom}
                    onChange={(e) => {
                      setNom(e.target.value);
                      clearErrors("nom");
                    }}
                    className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                      errors.nom ? "ring-1 ring-red-400" : ""
                    }`}
                  />
                  {errors.nom && <p className="text-xs text-red-300">{errors.nom}</p>}
                  <input
                    placeholder="Courriel"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearErrors("email");
                    }}
                    className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                      errors.email ? "ring-1 ring-red-400" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-300">{errors.email}</p>
                  )}
                  <input
                    placeholder="Téléphone"
                    value={telephone}
                    onChange={(e) => {
                      setTelephone(e.target.value);
                      clearErrors("telephone");
                    }}
                    className={`w-full p-3 rounded-lg bg-black/10 ${
                      errors.telephone ? "ring-1 ring-red-400" : ""
                    }`}
                  />
                  {errors.telephone && (
                    <p className="text-xs text-red-300">{errors.telephone}</p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-lg bg-black/20"
                      onClick={() => setStep(1)}
                    >
                      Retour
                    </button>
                    <button
                      className="flex-1 py-3 rounded-lg bg-amber-500 text-black font-semibold"
                      onClick={handleStep2Next}
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
                        className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                          errors[`accompagnateur-${i}-prenom`]
                            ? "ring-1 ring-red-400"
                            : ""
                        }`}
                      />
                      {errors[`accompagnateur-${i}-prenom`] && (
                        <p className="text-xs text-red-300">
                          {errors[`accompagnateur-${i}-prenom`]
                          }
                        </p>
                      )}
                      <input
                        placeholder={`Nom ${i + 1}`}
                        value={personne.nom}
                        onChange={(e) =>
                          handlePersonneChange(i, "nom", e.target.value)
                        }
                        className={`w-full p-3 rounded-lg bg-black/10 ${
                          errors[`accompagnateur-${i}-nom`]
                            ? "ring-1 ring-red-400"
                            : ""
                        }`}
                      />
                      {errors[`accompagnateur-${i}-nom`] && (
                        <p className="text-xs text-red-300">
                          {errors[`accompagnateur-${i}-nom`]
                          }
                        </p>
                      )}
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
                      onClick={handleStep3Next}
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
                    Envoyez le montant total à :{" Imelda au "}
                    <span className="font-semibold text-red-500">
                      acq.quebec@gmail.com
                    </span>
                  </div>
                  <div className="text-xs opacity-80 mb-4">
                    Veuillez entrer le code de transaction Interac reçu après votre
                    paiement. Il doit commencer par "CA".
                  </div>
                  <input
                    placeholder="Code référence Interac: CA122222"
                    value={interacCode}
                    onChange={(e) => {
                      setInteracCode(e.target.value);
                      clearErrors("interacCode");
                    }}
                    className={`w-full p-3 rounded-lg bg-black/10 mb-2 ${
                      errors.interacCode ? "ring-1 ring-red-400" : ""
                    }`}
                  />
                  {errors.interacCode && (
                    <p className="text-xs text-red-300">{errors.interacCode}</p>
                  )}

                  <div className="text-sm opacity-80 mb-3">
                    Total à envoyer :{" "}
                    <span className="font-semibold">
                      ${formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {submissionError && (
                    <div className="mb-3 rounded-lg border border-red-500/40 bg-red-900/30 px-3 py-2 text-sm text-red-200">
                      {submissionError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-lg bg-black/20"
                      onClick={() =>
                        setStep(
                          Math.max(1, accompanyingPersonsCount > 0 ? 3 : 2)
                        )
                      }
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

                  {submitted && !showSuccessModal && (
                    <div className="mt-3 rounded-xl border border-emerald-400/50 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-200">
                      Merci pour votre engagement.
                    </div>
                  )}
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

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeSuccessModal}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="relative w-full max-w-sm rounded-3xl bg-white/95 p-6 text-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                ✅
              </div>
            </div>
            <h2 className="mt-4 text-center text-xl font-semibold">
              Réservation enregistrée
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Merci pour votre réservation. Vous recevrez un courriel de confirmation
              avec tous les détails.
            </p>
            <button
              className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
              onClick={closeSuccessModal}
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
