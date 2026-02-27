import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type NextStepsDialogAction = {
  label: string
  onClick: () => void
  variant?: ButtonProps['variant']
}

type NextStepsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  steps: string[]
  actions: NextStepsDialogAction[]
}

const NextStepsDialog = ({
  open,
  onOpenChange,
  title,
  description,
  steps,
  actions,
}: NextStepsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='font-bold text-xl'>{title}</DialogTitle>
          <DialogDescription className='text-justify'>
            {description}
          </DialogDescription>
        </DialogHeader>

        {steps.length > 0 ? (
          <div className='space-y-2 text-sm'>
            <p className='font-semibold'>Prochaines étapes :</p>
            <ol className='list-decimal space-y-1 pl-4'>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className='flex flex-col gap-2 pt-2 sm:flex-row'>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              className='w-full'
            >
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NextStepsDialog
