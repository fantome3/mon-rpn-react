import type React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

type ModalType = {
  title?: string
  description?: string
  children: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  size?: ModalSize
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

function CustomModal({
  title,
  description,
  children,
  open,
  setOpen,
  size = 'md',
  showCloseButton = true,
  footer,
  className,
  contentClassName,
}: ModalType) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-[90vw]',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(sizeClasses[size], 'p-6 gap-6', contentClassName)}
      >
        {showCloseButton && (
          <DialogClose className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Fermer</span>
          </DialogClose>
        )}
        {(title || description) && (
          <DialogHeader className={cn('text-center', className)}>
            {title && (
              <DialogTitle className='text-xl font-semibold'>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className='text-sm text-muted-foreground mt-1'>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className='flex items-center justify-center'>{children}</div>
        {footer && (
          <DialogFooter className='flex justify-end gap-2 pt-2'>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal
