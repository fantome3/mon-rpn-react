import { Button } from '@/components/ui/button'
import CustomModal from '@/components/CustomModal'
import ConditionsContent from '@/components/ConditionsContent'

type ConditionsModalProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onAccept: () => void
  onRefuse: () => void
}

const ConditionsModal = ({ open, setOpen, onAccept, onRefuse }: ConditionsModalProps) => {
  return (
    <CustomModal
      open={open}
      setOpen={setOpen}
      title="Conditions d'utilisation"
      size='xl'
      footer={(
        <>
          <Button
            variant='destructive'
            onClick={() => {
              onRefuse();
              setOpen(false);
            }}
          >
            Je refuse
          </Button>
          <Button
            variant='default'
            onClick={() => {
              onAccept();
              setOpen(false);
            }}
          >
            J'accepte
          </Button>
        </>
      )}
    >
      <ConditionsContent />
    </CustomModal>
  )
}

export default ConditionsModal
