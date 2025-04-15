import React from 'react'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { cn } from '@/lib/utils'

type IconButtonWithTooltipProps = {
  icon: React.ReactNode
  tooltip: string
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'icon'
  variant?: 'ghost' | 'outline' | 'default' | 'link'
  className?: string
}

const IconButtonWithTooltip = ({
  icon,
  tooltip,
  onClick,
  disabled = false,
  size = 'sm',
  variant = 'ghost',
  className,
}: IconButtonWithTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            disabled={disabled}
            size={size}
            variant={variant}
            className={cn(className)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className='text-xs text-muted-foreground'>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default IconButtonWithTooltip
