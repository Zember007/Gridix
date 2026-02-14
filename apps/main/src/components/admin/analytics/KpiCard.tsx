import type { ReactNode } from "react";
import { Card, CardContent } from "@gridix/ui";

type KpiCardProps = {
    title: ReactNode;
    value: ReactNode;
    icon: ReactNode;
    className?: string;
};

export function KpiCard({ title, value, icon, className }: KpiCardProps) {
    return (
        <Card className={className}>
            <CardContent className="p-6 h-full flex items-center justify-between">
                <div className="flex flex-1 h-full justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className="self-center h-8 w-8 text-muted-foreground">{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}
