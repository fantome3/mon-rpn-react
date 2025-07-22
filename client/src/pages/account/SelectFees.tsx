import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  calculateSubtotal,
  calculateTotal,
  FeeDetail,
  MONTANT_MINIMUM_RPN,
  MONTANT_OBLIGATOIRE,
} from '@/lib/fees'

/**
 * Composant : SelectFeesWithFamily
 * --------------------------------------------------
 * • L’utilisateur saisit le **nombre d’adultes** (≥ 1) et de **mineurs** (≥ 0).
 * • Barème fixe :
 *     - Adulte : 70 $ (50 $ ACQ + 10 $ traitement + 10 $ RPN)
 *     - Mineur : 20 $ (10 $ traitement + 10 $ RPN)
 */

type SelectFeesProps = {
  updateTotal: (total: number) => void; // Callback pour mettre à jour le total
};

const defaultFeeDetails: FeeDetail[] = [
  {
    id: 'me',
    feeDescription: 'Vous (Adulte)',
    quantity: 1,
    type: 'adult',
    isRpnActive: true,
  },
]

export default function SelectFees({ updateTotal }: SelectFeesProps) {
  /* ---------------------- États principaux ---------------------- */
  const [adultCount, setAdultCount] = useState(0); // adultes supplémentaires
  const [minorCount, setMinorCount] = useState(0);
  const [feeDetails, setFeeDetails] = useState<FeeDetail[]>(defaultFeeDetails);

  /* -------------- Synchronisation lignes du tableau ------------- */
  const updateFeeRows = (newAdult: number, newMinor: number) => {
    const extraAdults = Math.max(0, newAdult)
    const extraMinors = Math.max(0, newMinor)

    const currentFeeItems: FeeDetail[] = [defaultFeeDetails[0]]
    if (extraAdults > 0)
      currentFeeItems.push({
        id: 'adults',
        feeDescription: `${extraAdults} × autre(s) adulte(s)`,
        quantity: extraAdults,
        type: 'adult',
        isRpnActive: true,
      })
    if (extraMinors > 0)
      currentFeeItems.push({
        id: 'minors',
        feeDescription: `${extraMinors} × mineur(s)`,
        quantity: extraMinors,
        type: 'minor',
        isRpnActive: true,
      })

    setFeeDetails(currentFeeItems)
    updateTotal(calculateTotal(currentFeeItems))
  }

  /* ---------------- Handlers de quantité saisie ----------------- */
  const handleAdultsChange = (newAdultCount: number) => {
    setAdultCount(newAdultCount);
    updateFeeRows(newAdultCount, minorCount);
  };
  const handleMinorsChange = (newMinorCount: number) => {
    setMinorCount(newMinorCount);
    updateFeeRows(adultCount, newMinorCount);
  };

  /* ---------------------- Toggle case RPN ----------------------- */
  const toggleRpn = (id: string) => {
    const updated = feeDetails.map((r) =>
      r.id === id ? { ...r, isRpnActive: !r.isRpnActive } : r,
    )
    setFeeDetails(updated)
    updateTotal(calculateTotal(updated))
  }

  /* ------------------- Calculs sous‑totaux & total -------------- */
  const getSubtotal = (row: FeeDetail) => calculateSubtotal(row)
  const total = useMemo(() => calculateTotal(feeDetails), [feeDetails])

  return (
    <div className="container mx-auto my-8 max-w-4xl px-4 space-y-8">
      <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-2">
        <h2 className="text-xl font-semibold">Instructions de sélection des frais</h2>
        <p>
          Ajoutez les membres de votre famille afin de régler <strong>tous les frais en une seule transaction</strong>.
        </p>

        <div className="text-left bg-white rounded shadow p-4 mt-4 overflow-x-auto">
          <h3 className="font-semibold mb-2">Grille des frais</h3>
          <table className="w-full text-sm border min-w-[520px]">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="p-2 border">Catégorie</th>
                <th className="p-2 border">Frais d’adhésion ACQ</th>
                <th className="p-2 border">Frais de traitement</th>
                <th className="p-2 border">Frais minimum RPN</th>
                <th className="p-2 border">Total / personne</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td className="p-2 border text-left">Adulte (18 ans et +)</td>
                <td className="p-2 border">50 $</td>
                <td className="p-2 border">10 $</td>
                <td className="p-2 border">10 $</td>
                <td className="p-2 border font-semibold">70 $</td>
              </tr>
              <tr className="text-center">
                <td className="p-2 border text-left">Mineur (&lt; 18 ans)</td>
                <td className="p-2 border">—</td>
                <td className="p-2 border">10 $</td>
                <td className="p-2 border">10 $</td>
                <td className="p-2 border font-semibold">20 $</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-4 text-sm">
            <strong>Comment procéder :</strong><br />
            Indiquez simplement le nombre d’adultes et de mineurs à inscrire. Le montant total se met à jour automatiquement.<br />
            Exemple : 1 adulte + 2 mineurs = 70 $ + 20 $ + 20 $ = 110 $.
          </p>
        </div>
      </div>

      {/* ------------- Sélecteurs de quantité (cartes tailles égales) ------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col bg-white p-6 shadow rounded grow">
          <h3 className="text-lg font-medium mb-4 text-center">Vous souhaité ajouter combien d'adultes supplémentaires</h3>
          <Input
            type="number"
            min={0}
            value={adultCount}
            onChange={(e) => handleAdultsChange(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
        <div className="flex flex-col bg-white p-6 shadow rounded grow">
          <h3 className="text-lg font-medium mb-4 text-center">Nombre de mineurs que vous allez ajouté</h3>
          <Input
            type="number"
            min={0}
            value={minorCount}
            onChange={(e) => handleMinorsChange(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* --------------------- Tableau récapitulatif ------------------ */}
      <div className="overflow-x-auto bg-white shadow rounded animate-in fade-in slide-in-from-bottom-6">
        <table className="min-w-[520px] w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="p-2 border whitespace-nowrap">&nbsp;</th>
              <th className="p-2 border whitespace-normal sm:whitespace-nowrap">
                <span className="block sm:inline">Frais </span>
                <span className="block sm:inline">adhésion</span>
              </th>
              <th className="p-2 border whitespace-normal sm:whitespace-nowrap">
                <span className="block sm:inline">Transition </span>
                <span className="block sm:inline">numérique</span>
              </th>
              <th className="p-2 border whitespace-normal sm:whitespace-nowrap">RPN</th>
              <th className="p-2 border whitespace-nowrap">Sous‑total</th>
            </tr>
          </thead>
          <tbody>
            {feeDetails.map((row) => (
              <tr key={row.id} className="text-center">
                <td className="p-2 border text-left font-medium whitespace-nowrap">{row.feeDescription}</td>
                {/* ACQ obligatoire adultes */}
                <td className="p-2 border">
                  {row.type === 'adult' ? <Checkbox checked disabled /> : '—'}
                </td>
                {/* Traitement obligatoire */}
                <td className="p-2 border">
                  <Checkbox checked disabled />
                </td>
                {/* RPN optionnel */}
                <td className="p-2 border">
                  <Checkbox checked={row.isRpnActive} onCheckedChange={() => toggleRpn(row.id)} />
                </td>
                {/* Sous-total */}
                <td className="p-2 border font-semibold whitespace-nowrap">{getSubtotal(row)} $</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-lg font-bold">Total : {total} $</p>
      </div>
    </div>
  );
}
