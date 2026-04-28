import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, LatLngBounds } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Eye, MapPin } from "lucide-react";

import { Button } from "./button";
import type {
  InteractiveMapProject,
  InteractiveProjectsMapProps,
} from "./interactive-projects-map";

const createCustomIcon = (
  project: InteractiveMapProject,
  isSelected: boolean = false,
) => {
  const iconSize = isSelected ? 60 : 50;

  return new Icon({
    iconUrl:
      project.building_image_url ||
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9IiMxRTFFMUUiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMjFoMTh2LTJIM3Yyem0wLTE2aDMuNUw3IDlsMy41LTRIMTd2MTJIM3Y5eiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4KPC9zdmc+",
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
    className: isSelected ? "selected-project-marker" : "project-marker",
  });
};

const FitBounds = ({ projects }: { projects: InteractiveMapProject[] }) => {
  const map = useMap();

  useEffect(() => {
    const validProjects = projects.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    if (validProjects.length === 0) return;

    const bounds = new LatLngBounds(
      validProjects.map((p) => [Number(p.latitude), Number(p.longitude)]),
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [projects, map]);

  return null;
};

export function InteractiveProjectsMapImpl({
  projects,
  selectedProjectId,
  onProjectSelect,
  onOpenProject,
  className,
  defaultCenter = [41.7151, 44.8271], // Tbilisi
  defaultZoom = 10,
}: InteractiveProjectsMapProps) {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] =
    useState<InteractiveMapProject | null>(null);

  const center = useMemo<[number, number]>(() => {
    const valid = projects.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    if (valid.length === 0) return defaultCenter;

    const lat =
      valid.reduce((sum, p) => sum + Number(p.latitude ?? 0), 0) /
      Math.max(1, valid.length);
    const lng =
      valid.reduce((sum, p) => sum + Number(p.longitude ?? 0), 0) /
      Math.max(1, valid.length);
    return [lat, lng];
  }, [projects, defaultCenter]);

  const handleOpenProject = (project: InteractiveMapProject) => {
    if (onOpenProject) return onOpenProject(project);
    if (onProjectSelect) return onProjectSelect(project.id);

    const url = project.slug
      ? `/embed/project/${project.slug}`
      : `/embed/project/id/${project.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={["relative h-[calc(100vh-60px)] grow", className]
        .filter(Boolean)
        .join(" ")}
    >
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds projects={projects} />

        {projects.map((project) => {
          if (project.latitude == null || project.longitude == null)
            return null;

          const isSelected =
            selectedProjectId === project.id ||
            selectedProject?.id === project.id;

          return (
            <Marker
              key={project.id}
              position={[Number(project.latitude), Number(project.longitude)]}
              icon={createCustomIcon(project, isSelected)}
              eventHandlers={{
                click: () => setSelectedProject(project),
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <h2 className="mb-2 text-lg font-bold">{project.name}</h2>

                  {project.building_image_url ? (
                    <img
                      src={project.building_image_url}
                      alt={project.name}
                      loading="lazy"
                      decoding="async"
                      className="mb-3 h-32 w-full rounded-lg object-cover"
                    />
                  ) : null}

                  {project.address ? (
                    <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{project.address}</span>
                    </div>
                  ) : null}

                  <Button
                    onClick={() => handleOpenProject(project)}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("embed.viewApartments")}
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
