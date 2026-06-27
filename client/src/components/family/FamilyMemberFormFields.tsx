import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/CustomCalendar'
import {
  relations,
  canadianResidenceStatus,
  age_maximal_personne,
  academicInstitutionsList,
} from '@/lib/constant'
import { cn } from '@/lib/utils'
import clsx from 'clsx'
import {
  RELATION_CONJOINT,
  isParentRelation,
} from '@/lib/familyMemberRules'
import type { FamilyMemberFormValues } from '@/lib/familyMemberFormSchema'

type Props = {
  control: Control<FamilyMemberFormValues>
}

export const FamilyMemberFormFields = ({ control }: Props) => {
  const relationship = useWatch({ control, name: 'relationship' })
  const occupation = useWatch({ control, name: 'occupation' })
  const institution = useWatch({ control, name: 'institution' })

  const isConjoint = relationship === RELATION_CONJOINT
  const isParent = isParentRelation(relationship ?? '')
  const showOccupation = isConjoint
  const showStudentFields = isConjoint && occupation === 'student'
  const showTel = isConjoint

  return (
    <div className='space-y-6'>
      {/* Relation */}
      <FormField
        control={control}
        name='relationship'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm'>Relation</FormLabel>
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Votre lien familial' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {relations.map((relation) => (
                  <SelectItem key={relation.name} value={relation.name}>
                    {relation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Identite */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='firstName'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm'>Prenoms</FormLabel>
              <FormControl>
                <Input placeholder='Son prenom' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name='lastName'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm'>Nom</FormLabel>
              <FormControl>
                <Input placeholder='Son nom' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Sexe */}
      <FormField
        control={control}
        name='sex'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm'>
              Sexe{' '}
              <span className='text-muted-foreground font-normal'>(optionnel)</span>
            </FormLabel>
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selectionner le sexe' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='M'>Masculin</SelectItem>
                <SelectItem value='F'>Feminin</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date de naissance */}
      <FormField
        control={control}
        name='birthDate'
        render={({ field }) => (
          <FormItem className='flex flex-col'>
            <FormLabel className={clsx('mb-0.5 text-sm')}>Date de naissance</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant='outline'
                    className={cn('w-full pl-3 text-left text-sm', !field.value && 'text-muted-foreground')}
                  >
                    {field.value ? (
                      format(field.value, 'dd/MM/yyyy')
                    ) : (
                      <span>Choisir une date</span>
                    )}
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  captionLayout='dropdown-buttons'
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() ||
                    date < new Date(new Date().getFullYear() - age_maximal_personne, 0, 1)
                  }
                  initialFocus
                  fromYear={new Date().getFullYear() - age_maximal_personne}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Statut au Canada */}
      <FormField
        control={control}
        name='residenceCountryStatus'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='mb-0.5 text-sm'>Statut immigration au Canada</FormLabel>
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Statut au Canada' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {canadianResidenceStatus.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vit au Canada — parents seulement */}
      {isParent && (
        <FormField
          control={control}
          name='livesInCanada'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Reside maintenant au Canada ?</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* Occupation — conjoint seulement */}
      {showOccupation && (
        <FormField
          control={control}
          name='occupation'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm'>Occupation</FormLabel>
              <FormControl>
                <ToggleGroup
                  type='single'
                  value={field.value ?? ''}
                  onValueChange={(val) => field.onChange(val || undefined)}
                  className='justify-start gap-2'
                >
                  <ToggleGroupItem
                    value='student'
                    className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                  >
                    Etudiant(e)
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value='worker'
                    className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                  >
                    Travailleur(se)
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Champs etudiant — conjoint etudiant seulement */}
      {showStudentFields && (
        <>
          <FormField
            control={control}
            name='studentStatus'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Type d'etudes</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type='single'
                    value={field.value ?? ''}
                    onValueChange={(val) => field.onChange(val || undefined)}
                    className='justify-start gap-2'
                  >
                    <ToggleGroupItem
                      value='full-time'
                      className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                    >
                      A temps plein
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value='part-time'
                      className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                    >
                      A temps partiel
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormDescription className='text-xs text-amber-600'>
                  Temps partiel = cotisation travailleur (50 $)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='institution'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='mb-0.5 text-sm'>Etablissement</FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Choisir un etablissement' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {academicInstitutionsList.map((inst) => (
                      <SelectItem key={inst.value} value={inst.value}>
                        {inst.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {institution === 'other' && (
            <FormField
              control={control}
              name='institution'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm'>Autre etablissement</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'etablissement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name='studentNumber'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>
                  Numero etudiant{' '}
                  <span className='text-muted-foreground font-normal'>(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Ex. 111 234 567'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {/* Telephone — conjoint seulement */}
      {showTel && (
        <FormField
          control={control}
          name='tel'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm'>
                Telephone{' '}
                <span className='text-muted-foreground font-normal'>(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='Numero de telephone'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
