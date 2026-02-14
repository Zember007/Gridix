import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@gridix/utils/lib";

const Tabs = TabsPrimitive.Root;

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    /**
     * Allow tab triggers to wrap onto multiple lines.
     * Useful when there are many tabs (e.g. Admin settings).
     */
    wrap?: boolean;
};

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    TabsListProps
>(({ className, wrap = true, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            // base container
            "flex items-center justify-start rounded-md bg-muted p-1 text-muted-foreground",
            // wrapping behavior
            wrap ? "flex-wrap gap-2" : "flex-nowrap gap-1 overflow-x-auto",
            // allow wrapped lines to actually wrap text if needed
            "whitespace-normal",
            className
        )}
        {...props}
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            // trigger styles
            "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium",
            "transition-all ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            // active state
            "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            // keep trigger content in one line (icon + text)
            "whitespace-nowrap",
            className
        )}
        {...props}
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            "mt-2 ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
        )}
        {...props}
    />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
