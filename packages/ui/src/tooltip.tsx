import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@gridix/utils/lib"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

// Helper hook to detect if we're in a Shadow DOM (widget context)
const useShadowRootContainer = () => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  
  React.useEffect(() => {
    // Try to find the portal container in Shadow DOM
    const currentElement = document.getElementById('gridix-widget-root');
    if (currentElement?.shadowRoot) {
      const portalContainer = currentElement.shadowRoot.getElementById('gridix-portal-container');
      if (portalContainer) {
        setContainer(portalContainer as HTMLElement);
      }
    }
  }, []);
  
  return container;
};

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const shadowContainer = useShadowRootContainer();
  
  return (
    <TooltipPrimitive.Portal container={shadowContainer}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
