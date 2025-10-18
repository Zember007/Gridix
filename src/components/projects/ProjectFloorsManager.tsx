
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, ChevronRight, Layers3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import FloorPlanEditor from '@/components/visualization/FloorPlanEditor';
import PolygonCustomizationSettings from '@/components/visualization/PolygonCustomizationSettings';

interface ProjectFloorsManagerProps {
    projectId: string;
}

interface PolygonSettings {
    colors: {
        available: string;
        sold: string;
        reserved: string;
    };
    hoverEffects: {
        scale: boolean;
        colorChange: boolean;
        opacityChange: boolean;
        glow: boolean;
    };
    display: {
        showNumbers: boolean;
        showTooltip: boolean;
        showArea: boolean;
        showPrice: boolean;
    };
    opacity: {
        normal: number;
        hover: number;
    };
}

const ProjectFloorsManager = ({ projectId }: ProjectFloorsManagerProps) => {
    const [floorStates, setFloorStates] = useState<Record<number, boolean>>({});
    const [showSettings, setShowSettings] = useState(false);
    const [polygonSettings, setPolygonSettings] = useState<PolygonSettings | null>(null);
    const [currentFloor, setCurrentFloor] = useState<number>(1);

    const { t } = useLanguage();
    const { project } = useProject(projectId);

    useEffect(() => {
        if (project) {
            // Инициализируем состояния для всех этажей
            const floors = Array.from({ length: project.floors }, (_, i) => i);
            const initialStates: Record<number, boolean> = {};
            floors.forEach(floor => {
                initialStates[floor] = false;
            });
            setFloorStates(initialStates);
        }
    }, [project]);

    const toggleFloorCollapse = (floor: number) => {
        setFloorStates(prev => ({
            ...prev,
            [floor]: !prev[floor]
        }));
    };

    const handleSettingsChange = (newSettings: PolygonSettings) => {
        setPolygonSettings(newSettings);
    };

    const renderFloorPlanTabs = () => {
        if (!project) return null;

        const floors = Array.from({ length: project.floors }, (_, i) => i);

        return (
            <div className="space-y-2">
                {floors.map((floor) => {
                    const isOpen = floorStates[floor] || false;

                    return (
                        <Collapsible key={floor} open={isOpen} onOpenChange={() => toggleFloorCollapse(floor)}>
                            <Card className="overflow-hidden">
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    {isOpen ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronRight className="h-3 w-3" />
                                                    )}
                                                    <Layers3 className="h-3 w-3" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xs">{t('projectEditor.floor')} {floor}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {t('projectEditor.floorPlanDesc', { floor })}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs px-1">
                                                {t('projectEditor.plan')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <FloorPlanEditor
                                            projectId={projectId}
                                            floorNumber={floor}
                                            onFloorChange={setCurrentFloor}
                                        />
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('projectEditor.floorPlans')}</CardTitle>
                    <CardDescription>
                        {t('projectEditor.floorPlansDesc')}
                    </CardDescription>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('floorPlan.apartments.settings')}
                    </Button>
                    {showSettings && (

                        <PolygonCustomizationSettings
                            projectId={projectId}
                            type="floor"
                            onSettingsChange={handleSettingsChange}
                        />
                    )}
                </CardHeader>



                <CardContent>
                    {renderFloorPlanTabs()}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectFloorsManager;