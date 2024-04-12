import { Button } from './ui/button'

const AddMemberSection = () => {
  return (
    <div className='flex justify-between gap-4'>
      <Button className='w-full'>Parrainer</Button>
      <Button variant='outline' className='w-full text-primary border-primary'>
        Ajouter une personne
      </Button>
    </div>
  )
}

export default AddMemberSection
