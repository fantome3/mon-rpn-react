import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BILLING_FAQ_ITEMS, type BillingFaqItem } from '@/lib/billingFaq'

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const buildSearchText = (item: BillingFaqItem) =>
  normalizeText(
    [
      item.question,
      ...item.answer,
      ...(item.steps ?? []),
      ...(item.tags ?? []),
    ].join(' ')
  )

const BillingFaq = () => {
  const [query, setQuery] = useState('')

  const indexedItems = useMemo(
    () =>
      BILLING_FAQ_ITEMS.map((item) => ({
        item,
        searchText: buildSearchText(item),
      })),
    [BILLING_FAQ_ITEMS]
  )

  const normalizedQuery = useMemo(() => normalizeText(query), [query])
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return BILLING_FAQ_ITEMS

    return indexedItems
      .filter((entry) => entry.searchText.includes(normalizedQuery))
      .map((entry) => entry.item)
  }, [indexedItems, normalizedQuery])
  const hasSingleResult = filteredItems.length === 1

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Foire aux questions</CardTitle>
          <CardDescription>
            Trouvez rapidement une réponse et continuez votre paiement sans
            blocage.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <label htmlFor='billing-faq-search' className='sr-only'>
              Rechercher une réponse
            </label>
            <Input
              id='billing-faq-search'
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Rechercher un sujet, un mot-clé, un statut...'
              className='pl-9'
            />
          </div>
          <p className='text-xs text-muted-foreground'>
            {filteredItems.length} réponse{hasSingleResult ? '' : 's'}{' '}
            correspondante{hasSingleResult ? '' : 's'}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réponses les plus consultées</CardTitle>
          <CardDescription>
            Nous avons regroupé les questions qui reviennent le plus souvent.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {filteredItems.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Aucun résultat. Essayez un autre mot-clé.
            </p>
          ) : (
            <Accordion type='single' collapsible className='w-full'>
              {filteredItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className='text-left text-sm sm:text-base'>
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className='space-y-3'>
                    {item.tags?.length ? (
                      <div className='flex flex-wrap gap-2'>
                        {item.tags.map((tag) => (
                          <Badge key={`${item.id}-${tag}`} variant='secondary'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className='space-y-3'>
                      {item.answer.map((paragraph, index) => (
                        <p
                          key={`${item.id}-answer-${index}`}
                          className={
                            index === 0
                              ? 'text-sm text-foreground'
                              : 'text-sm text-muted-foreground'
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {item.steps?.length ? (
                      <div className='rounded-lg bg-muted/40 p-3'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          Étapes rapides
                        </p>
                        <ol className='mt-2 list-decimal space-y-1 pl-4 text-sm text-foreground'>
                          {item.steps.map((step) => (
                            <li key={`${item.id}-${step}`}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {item.image ? (
                      <figure className='overflow-hidden rounded-lg border bg-background'>
                        <img
                          src={item.image.src}
                          alt={item.image.alt}
                          loading='lazy'
                          className='h-auto w-full'
                        />
                        {item.image.caption ? (
                          <figcaption className='px-3 py-2 text-xs text-muted-foreground'>
                            {item.image.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BillingFaq
