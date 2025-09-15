import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion"

export default function ConditionUtilisation() {
    return (
        <Accordion type="single" collapsible className="w-full mt-8">
            <AccordionItem value="conditions">
                <AccordionTrigger className="text-xl font-bold">⚖️ Conditions d’utilisation de la plateforme</AccordionTrigger>
                <AccordionContent>
                    <h2 className='font-semibold text-lg mt-4'>1. Acceptation des conditions</h2>
                    <p className='text-slate-700 mb-4'>En utilisant cette plateforme, vous reconnaissez avoir lu et accepté ces conditions. Si vous n’acceptez pas, veuillez cesser d’utiliser le service.</p>

                    <h2 className='font-semibold text-lg mt-4'>2. Gestion et divulgation des données</h2>
                    <p className='text-slate-700 mb-4'>Vous consentez à ce que les données que vous fournissez soient collectées, stockées et traitées par l’Association afin de fournir les services proposés. Vos données peuvent être partagées uniquement dans les cas prévus par la loi ou lorsqu’une autorité compétente l’exige.</p>

                    <h2 className='font-semibold text-lg mt-4'>3. Sécurité et responsabilité</h2>
                    <p className='text-slate-700 mb-4'>Bien que nous mettions en œuvre des mesures de sécurité appropriées, vous reconnaissez que tout système peut être sujet à des piratages ou des accès non autorisés. En utilisant la plateforme, vous acceptez de ne pas tenir l’Association responsable des dommages causés par de tels incidents, sauf en cas de négligence grave ou faute intentionnelle.</p>

                    <h2 className='font-semibold text-lg mt-4'>4. Limitation de responsabilité</h2>
                    <p className='text-slate-700 mb-4'>La plateforme ne pourra être tenue responsable des pertes de données, interruptions de service ou dommages indirects découlant de l’utilisation du service, sauf disposition légale contraire.</p>

                    <h2 className='font-semibold text-lg mt-4'>5. Modifications</h2>
                    <p className='text-slate-700'>L’Association se réserve le droit de modifier ces conditions à tout moment. La poursuite de l’utilisation du service après mise à jour vaut acceptation des nouvelles conditions.</p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
