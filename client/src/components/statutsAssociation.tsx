import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function StatutsAssociation() {
  return (
    <div className='w-full bg-slate-50 rounded-xl max-h-[90vh] overflow-y-auto p-6 shadow-lg scrollbar-hide'>
      <h1 className='font-extrabold text-primary md:text-5xl text-3xl p-4 text-center'>
        Statuts de l’Association des Camerounais·es de Québec (ACQ)
      </h1>

      {/* PRÉAMBULE & ARTICLE 0 visibles en permanence */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">PRÉAMBULE</h2>
        <p className="text-slate-700 text-justify leading-relaxed">
          Le présent texte consacre les statuts de l’Association des Camerounaises et Camerounais de Québec, en abrégé ACQ ci‑après « l’Association ».
          Il définit son objet, ses objectifs, ses organes et leurs missions et encadre l’exercice des activités en son sein.
        </p>

        <h2 className="text-2xl font-bold mt-6">Article 0 : Des Définitions</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>
            <strong>Cotisations</strong> : contributions en somme d’argent non remboursable que chaque membre inscrit verse pour entretenir la caisse de dépense de l’Association.
          </li>
          <li>
            <strong>Membre inscrit ou Membre</strong> : membre qui s’est acquitté des frais d’inscription lors de son adhésion.
          </li>
          <li>
            <strong>Membre effectif</strong> : membre qui, en plus de s’être acquitté de ses frais d’adhésion, paye ses cotisations.
          </li>
          <li>
            <strong>Membre à jour</strong> : membre qui, à date, est en règle avec ses cotisations.
          </li>
          <li>
            <strong>Membres actifs</strong> : membre à jour de ses cotisations et qui participe régulièrement aux activités (AG, réunions mensuelles, activités sportives et culturelles, etc.).
          </li>
          <li>
            <strong>Membre d’honneur</strong> : membre spécial, différent de membre inscrit, qui par ses qualités d’honorabilité et de probité est coopté par le Bureau Exécutif et voté par l’AG ou nommé d’office.
          </li>
        </ul>
      </section>

      {/* TITRES en accordéon */}
      <Accordion type="single" collapsible className="w-full mt-8">
        <AccordionItem value="titre1">
          <AccordionTrigger className="text-xl font-bold">TITRE 1 : DE LA CRÉATION</AccordionTrigger>
          <AccordionContent>
            <h3 className="font-semibold mt-2">Chapitre 1 : Dénomination, Objet, Durée, Siège social et Champ d’activités</h3>
            <h4 className="mt-4 font-semibold">Article 1 : De la création et de la dénomination</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Il est constitué entre les fondateurs et toute autre personne adhérente aux présents statuts, une association apolitique et à but non lucratif dénommée Association des Camerounaises et Camerounais de Québec (ACQ) régie par le présent statut, le Règlement d’ordre intérieur qui lui est associé, et soumise à la réglementation québécoise portant sur l’organisation et le fonctionnement des Associations et Organisations non gouvernementales.
            </p>
            <h4 className="mt-4 font-semibold">Article 2 : De l’objet</h4>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Promouvoir l’intégration de ses membres dans la société québécoise et canadienne ;</li>
              <li>Promouvoir l’unité et la solidarité entre les membres de l’Association au Québec ;</li>
              <li>Apporter un soutien moral, matériel ou autre aux membres de l’Association, aux Camerounais de Québec, tel que prévu dans les présents Statuts, le Règlement Intérieur et dans tous les cas où l’Assemblée Générale le juge approprié ;</li>
              <li>Promouvoir, sur son territoire de compétence, la culture camerounaise ;</li>
              <li>Œuvrer à la réalisation des initiatives visant les intérêts communs et mutuels des membres ;</li>
              <li>Se préoccuper du bien‑être de la Communauté Camerounaise de Québec ;</li>
              <li>Développer les liens de fraternité et de solidarité avec les populations québécoises.</li>
            </ul>
            <h4 className="mt-4 font-semibold">Article 3 : Du siège social</h4>
            <p className="text-slate-700">Le siège social est établi dans la Ville de Québec. Il peut être transféré en tout autre lieu à l’intérieur de Québec par décision de l’Assemblée Générale à la majorité des 2/3 des membres.</p>
            <h4 className="mt-4 font-semibold">Article 4 : Du territoire et de la durée</h4>
            <p className="text-slate-700">L’Association exerce ses activités sur tout le territoire de Québec et est constituée pour une durée indéterminée.</p>
            <h4 className="mt-4 font-semibold">Article 5 : Du champ d’action</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Les principaux objectifs visés par l’Association sont entre autres : assurer l’accueil et l’intégration de ses membres ; développer une plateforme de fraternité, de solidarité et d’assistance mutuelle ; vulgariser auprès de ses membres la connaissance des lois et règlements en vigueur à Québec et au Canada. L’Association peut accomplir tout acte se rapportant directement ou indirectement à son objet, acquérir des biens et droits, louer, engager du personnel, conclure des contrats, rassembler des fonds et créer ou gérer tout service ou institution poursuivant tout ou partie de son objet. Dans ce cadre, elle peut poser des actes commerciaux.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="titre2">
          <AccordionTrigger className="text-xl font-bold">TITRE 2 : DES MEMBRES</AccordionTrigger>
          <AccordionContent>
            <h3 className="font-semibold mt-2">Chapitre 2 : Adhésion, Démission, Droits et Obligations</h3>
            <h4 className="mt-4 font-semibold">Article 6 : De l’adhésion</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              L’adhésion est ouverte à tout citoyen camerounais et personne d’origine camerounaise, ainsi qu’à tout étranger conjoint de Camerounais résidant à Québec. Toute personne non camerounaise mais soucieuse des intérêts du Cameroun peut demander son adhésion. Les membres d’honneur, proposés par le Bureau Exécutif et agréés par l’Assemblée Générale, jouent un rôle consultatif sans droit de vote. Les anciens Présidents, Vice‑Présidents et Secrétaires Généraux exemplaires sont d’office membres d’honneur.
            </p>
            <h4 className="mt-4 font-semibold">Article 7 : De l’égalité des membres</h4>
            <p className="text-slate-700">Tous les membres mentionnés à l’article 6, à l’exception des membres d’honneur, sont des membres actifs à égalité de droits et de devoirs.</p>
            <h4 className="mt-4 font-semibold">Article 8 : De la perte de la qualité de membre</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              La qualité de membre se perd par démission, exclusion (AG à la majorité des 2/3) ou décès. En cas de démission, une lettre est adressée au Bureau Exécutif. Les démissionnaires ou exclus et leurs ayants droit ne peuvent, sauf épargne ou actifs, faire valoir des droits sur le patrimoine ni demander le remboursement de cotisations.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="titre3">
          <AccordionTrigger className="text-xl font-bold">TITRE 3 : DE L’ORGANISATION ET FONCTIONNEMENT</AccordionTrigger>
          <AccordionContent>
            <h3 className="font-semibold mt-2">Chapitre 3 : Des organes</h3>
            <p className="text-slate-700">Les organes : Assemblée Générale ; Bureau Exécutif ; Comité d’Audit ; Comité de Résolution des Conflits.</p>
            <h3 className="font-semibold mt-4">Chapitre 4 : De l’Assemblée Générale</h3>
            <h4 className="mt-2 font-semibold">Article 10 : Définition</h4>
            <p className="text-slate-700">Organe suprême, souverain ; ses décisions s’imposent à tous.</p>
            <h4 className="mt-2 font-semibold">Article 11 : Convocation et réunions</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Trois AG ordinaires par an (dernier samedi d’avril, août, décembre). Convocation par le Président (ou suppléants selon l’ordre). Réunions mensuelles entre deux AG (sans pouvoir modifier les textes ni organiser des élections) avec décisions obligatoires si quorum.
            </p>
            <h4 className="mt-2 font-semibold">Article 12 : Vacance à la présidence</h4>
            <p className="text-slate-700">En cas de vacance, le Vice‑Président remplace pour 6 mois max et convoque l’AG pour élire un nouveau Président.</p>
            <h4 className="mt-2 font-semibold">Article 13 : Quorum</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Quorum : 1/3 des membres inscrits. Décisions par consensus ou majorité absolue ; en cas d’égalité, la voix du Président compte double. À défaut de quorum, seconde AG sous 15 jours siégeant quel que soit le nombre. Procuration possible (une par membre).
            </p>
            <h4 className="mt-2 font-semibold">Article 14 : Compétences exclusives</h4>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Modification des statuts</li>
              <li>Désignation/révocation du Bureau Exécutif</li>
              <li>Suspension/exclusion d’un membre</li>
              <li>Approbation des budgets et comptes</li>
              <li>Acceptation des dons et legs</li>
              <li>Dissolution volontaire</li>
              <li>Mandat et validation des accords de coopération/financement</li>
              <li>Nomination des membres d’honneur</li>
            </ul>

            <h3 className="font-semibold mt-4">Chapitre 5 : Du Bureau Exécutif</h3>
            <h4 className="mt-2 font-semibold">Article 15 : Composition</h4>
            <p className="text-slate-700">Président(e) ; Vice‑Président(e) ; Secrétaire Général(e) ; Secrétaire Général(e) adjoint(e) ; Trésorier(ère) ; Trésorier(ère) adjoint(e) ; Censeur(e) ; Chargé(e) de la communication. Déchéance possible par AG (2/3) pour manquements graves.</p>
            <h4 className="mt-2 font-semibold">Article 16 : Élections</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Mandat 2 ans non renouvelable. Conditions : ancienneté ≥ 1 an, cotisations à jour, pas de condamnation pénale, régularité aux réunions. En cas de vacance, élection à la prochaine AG (sauf Présidence : voir art. 12) pour terminer le mandat.
            </p>
            <h4 className="mt-2 font-semibold">Articles 17 à 24 : Fonctions, réunions et attributions</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Représentation par le/la Président(e) ; suppléances par Vice‑Président(e) puis SG ; rôles du/de la SG (convocations, PV, listes), du/de la Trésorier(ère) (gestion financière), du/de la Chargé(e) de communication (médias, TIC), du/de la Censeur(e) (discipline). Réunions mensuelles ; quorum 2/3 ; décisions à la majorité simple. Attributions : exécuter décisions de l’AG, gérer le quotidien, rapports annuels, budget, comptabilité, propositions de modifications, préparation des sessions, négocier accords, relations avec autorités, création de commissions.
            </p>

            <h3 className="font-semibold mt-4">Chapitre 6 : Comité d’Audit (Art. 25)</h3>
            <p className="text-slate-700">Trois membres (hors Bureau) nommés annuellement par l’AG ; contrôle des finances et patrimoine ; accès illimité aux écritures ; mêmes conditions d’éligibilité que l’art. 16.</p>

            <h3 className="font-semibold mt-4">Chapitre 7 : Comité de Résolution des Conflits (Art. 26‑29)</h3>
            <p className="text-slate-700 text-justify leading-relaxed">
              Six membres (parité exigée), élus parmi membres actifs et d’honneur ; mandat 2 ans renouvelable une fois. Médiation des conflits ; saisine par tout membre/ organe/ AG ; auditions et consultations possibles ; recommandations soumises à l’AG ; possibilité de recommander une AG extraordinaire et, à défaut d’exécution, de la convoquer et présider.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="titre4">
          <AccordionTrigger className="text-xl font-bold">TITRE 4 : DU PATRIMOINE</AccordionTrigger>
          <AccordionContent>
            <h4 className="font-semibold mt-2">Article 30 : Du patrimoine</h4>
            <p className="text-slate-700">Possession des biens meubles et immeubles nécessaires.</p>
            <h4 className="font-semibold mt-2">Article 31 : Des ressources</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Cotisations et amendes ; dons, subventions, legs ; revenus de manifestations. Comptes bancaires à Québec ouverts par le Président ; signataires : Président, Vice‑Président, Secrétaire Général, Trésorier — toute opération requiert deux signatures dont celle du Trésorier. Ce dernier administre le compte et versements sous 2 jours ouvrables.
            </p>
            <h4 className="font-semibold mt-2">Article 32 : De l’utilisation des ressources</h4>
            <p className="text-slate-700 text-justify leading-relaxed">
              Affectation aux objectifs ; aucun droit individuel de possession ; toute disposition nécessite décision d’un organe habilité.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="titre5">
          <AccordionTrigger className="text-xl font-bold">TITRE 5 : DES DIVERS</AccordionTrigger>
          <AccordionContent>
            <h3 className="font-semibold mt-2">Chapitre 8 : Modification des statuts et dissolution (Art. 33)</h3>
            <p className="text-slate-700 text-justify leading-relaxed">
              Modifications adoptées à 2/3 des membres effectifs et à jour, sur proposition du Bureau ou d’au moins 1/3 des membres (procédure de signatures). Dissolution : AG extraordinaire (quorum 2/3), décision à 3/4 des suffrages ; nomination des liquidateurs ; transfert de l’actif à une association poursuivant des objectifs similaires.
            </p>
            <h3 className="font-semibold mt-4">Chapitre 9 : Dispositions transitoires et finales</h3>
            <h4 className="font-semibold mt-2">Article 33 : Cession des droits</h4>
            <p className="text-slate-700">Toute adhésion implique l’acceptation que l’identité soit partagée entre les membres et que l’image puisse être associée aux activités de l’Association.</p>
            <h4 className="font-semibold mt-2">Article 34 : Disposition sur les premières élections</h4>
            <p className="text-slate-700">Premières élections à l’AG constitutive ou au plus tard un mois après ; Bureau chargé des démarches de légalisation ; certaines conditions d’éligibilité non requises pour ce premier scrutin.</p>
            <h4 className="font-semibold mt-2">Article 35 : Règlement d’ordre intérieur</h4>
            <p className="text-slate-700">Précise l’exécution des statuts et comble les vides, adopté à la majorité absolue.</p>
            <h4 className="font-semibold mt-2">Article 36 : Entrée en vigueur</h4>
            <p className="text-slate-700">Entrée en vigueur le jour de l’adoption par l’AG constitutive. Fait à Québec le 27‑05‑2023. Président : Nguewou Dzalli Ghislain Brice.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
