import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ModalType = {
  title: string
  description: string
  children: React.ReactNode
  open: boolean
  setOpen: () => void
}

function CustomModal({
  title,
  description,
  children,
  open,
  setOpen,
}: ModalType) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='mx-12 mb-3'>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='flex items-center justify-center'>{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal
