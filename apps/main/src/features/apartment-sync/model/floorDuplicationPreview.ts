export type FloorDuplicationMatchingRule =
  | "number_with_floor_prefix"
  | "exact_number"
  | "area_rooms_type";

export type FloorDuplicationCopyOption = "floor_image" | "apartment_polygons";

export interface FloorDuplicationSourceApartment {
  id: string;
  apartment_number: string;
  rooms: number | string;
  area: number;
  polygon: Array<{ x: number; y: number }>;
  type?: "apartment" | "commercial" | "parking";
}

export interface FloorDuplicationTargetApartment {
  id: string;
  floor_number: number;
  apartment_number: string;
  rooms: number | string;
  area: number;
  type: "apartment" | "commercial" | "parking";
}

export interface FloorDuplicationPlanRecord {
  id: string;
  floor_number: number;
  image_url: string | null;
}

export interface FloorDuplicationLoadedData {
  targetApartmentsByFloor: Record<number, FloorDuplicationTargetApartment[]>;
  floorPlansByFloor: Record<number, FloorDuplicationPlanRecord | null>;
}

export interface FloorDuplicationMatch {
  sourceApartmentId: string;
  sourceApartmentNumber: string;
  targetApartmentId: string;
  targetApartmentNumber: string;
  strategy: FloorDuplicationMatchingRule;
}

export interface FloorDuplicationSkippedApartment {
  sourceApartmentId: string;
  sourceApartmentNumber: string;
  reason: "no_match" | "ambiguous";
}

export interface FloorDuplicationFloorPreview {
  floorNumber: number;
  floorPlanAction: "none" | "create" | "update" | "skip";
  polygonMatches: FloorDuplicationMatch[];
  skippedApartments: FloorDuplicationSkippedApartment[];
}

export interface FloorDuplicationPreviewSummary {
  targetFloorCount: number;
  floorPlanOperations: number;
  polygonOperations: number;
  skippedMatches: number;
  ambiguousMatches: number;
  totalOperations: number;
}

export interface FloorDuplicationPreview {
  floors: FloorDuplicationFloorPreview[];
  summary: FloorDuplicationPreviewSummary;
}

interface BuildFloorDuplicationPreviewParams {
  sourceFloorNumber: number;
  targetFloorNumbers: number[];
  sourceImageUrl: string;
  sourceApartments: FloorDuplicationSourceApartment[];
  loadedData: FloorDuplicationLoadedData;
  selectedMatchingRules: FloorDuplicationMatchingRule[];
  selectedCopyOptions: FloorDuplicationCopyOption[];
}

const POLYGON_MIN_POINTS = 3;

const AREA_PRECISION_MULTIPLIER = 100;

const roundArea = (value: number) =>
  Math.round(value * AREA_PRECISION_MULTIPLIER) / AREA_PRECISION_MULTIPLIER;

const buildAreaRoomsTypeKey = ({
  area,
  rooms,
  type,
}: {
  area: number;
  rooms: number | string;
  type: "apartment" | "commercial" | "parking";
}) => `${roundArea(area)}::${String(rooms)}::${type}`;

const buildApartmentNumberCandidatesMap = (
  apartments: FloorDuplicationTargetApartment[],
) => {
  const candidatesByNumber = new Map<
    string,
    FloorDuplicationTargetApartment[]
  >();

  apartments.forEach((apartment) => {
    const existing = candidatesByNumber.get(apartment.apartment_number);
    if (existing) {
      existing.push(apartment);
      return;
    }

    candidatesByNumber.set(apartment.apartment_number, [apartment]);
  });

  return candidatesByNumber;
};

const getAvailableNumberMatch = ({
  apartmentNumber,
  candidatesByNumber,
  usedTargetIds,
}: {
  apartmentNumber: string;
  candidatesByNumber: Map<string, FloorDuplicationTargetApartment[]>;
  usedTargetIds: Set<string>;
}) => {
  const candidates = (candidatesByNumber.get(apartmentNumber) ?? []).filter(
    (candidate) => !usedTargetIds.has(candidate.id),
  );

  if (candidates.length === 1) {
    return { apartment: candidates[0], ambiguous: false };
  }

  if (candidates.length > 1) {
    return { apartment: null, ambiguous: true };
  }

  return { apartment: null, ambiguous: false };
};

export const buildRenumberedApartmentNumber = (
  apartmentNumber: string,
  sourceFloorNumber: number,
  targetFloorNumber: number,
) => {
  const sourceFloorPrefix = String(sourceFloorNumber);

  if (
    apartmentNumber.length <= sourceFloorPrefix.length ||
    !apartmentNumber.startsWith(sourceFloorPrefix)
  ) {
    return null;
  }

  return `${targetFloorNumber}${apartmentNumber.slice(sourceFloorPrefix.length)}`;
};

export const buildFloorDuplicationPreview = ({
  sourceFloorNumber,
  targetFloorNumbers,
  sourceImageUrl,
  sourceApartments,
  loadedData,
  selectedMatchingRules,
  selectedCopyOptions,
}: BuildFloorDuplicationPreviewParams): FloorDuplicationPreview => {
  const canCopyFloorImage =
    selectedCopyOptions.includes("floor_image") && Boolean(sourceImageUrl);
  const canCopyPolygons =
    selectedCopyOptions.includes("apartment_polygons") &&
    selectedMatchingRules.length > 0;

  const sourceApartmentsWithPolygon = canCopyPolygons
    ? sourceApartments.filter(
        (apartment) => apartment.polygon.length >= POLYGON_MIN_POINTS,
      )
    : [];

  const floors = targetFloorNumbers.map((targetFloorNumber) => {
    const floorPlan = loadedData.floorPlansByFloor[targetFloorNumber];
    const targetApartments =
      loadedData.targetApartmentsByFloor[targetFloorNumber] ?? [];
    const floorPlanAction: FloorDuplicationFloorPreview["floorPlanAction"] =
      !canCopyFloorImage
        ? "none"
        : !floorPlan
          ? "create"
          : floorPlan.image_url === sourceImageUrl
            ? "skip"
            : "update";

    const polygonMatches: FloorDuplicationMatch[] = [];
    const skippedApartments: FloorDuplicationSkippedApartment[] = [];

    if (!canCopyPolygons || sourceApartmentsWithPolygon.length === 0) {
      return {
        floorNumber: targetFloorNumber,
        floorPlanAction,
        polygonMatches,
        skippedApartments,
      };
    }

    const candidatesByNumber =
      buildApartmentNumberCandidatesMap(targetApartments);
    const usedTargetIds = new Set<string>();
    const blockedSourceIds = new Set<string>();
    const unmatchedSources = new Map(
      sourceApartmentsWithPolygon.map((apartment) => [apartment.id, apartment]),
    );

    const consumeSourceApartment = (
      apartment: FloorDuplicationSourceApartment,
      targetApartment: FloorDuplicationTargetApartment,
      strategy: FloorDuplicationMatchingRule,
    ) => {
      usedTargetIds.add(targetApartment.id);
      unmatchedSources.delete(apartment.id);
      polygonMatches.push({
        sourceApartmentId: apartment.id,
        sourceApartmentNumber: apartment.apartment_number,
        targetApartmentId: targetApartment.id,
        targetApartmentNumber: targetApartment.apartment_number,
        strategy,
      });
    };

    const skipSourceApartment = (
      apartment: FloorDuplicationSourceApartment,
      reason: FloorDuplicationSkippedApartment["reason"],
    ) => {
      blockedSourceIds.add(apartment.id);
      unmatchedSources.delete(apartment.id);
      skippedApartments.push({
        sourceApartmentId: apartment.id,
        sourceApartmentNumber: apartment.apartment_number,
        reason,
      });
    };

    if (selectedMatchingRules.includes("number_with_floor_prefix")) {
      Array.from(unmatchedSources.values()).forEach((apartment) => {
        const renumberedApartmentNumber = buildRenumberedApartmentNumber(
          apartment.apartment_number,
          sourceFloorNumber,
          targetFloorNumber,
        );

        if (!renumberedApartmentNumber) {
          return;
        }

        const { apartment: matchedApartment, ambiguous } =
          getAvailableNumberMatch({
            apartmentNumber: renumberedApartmentNumber,
            candidatesByNumber,
            usedTargetIds,
          });

        if (ambiguous) {
          skipSourceApartment(apartment, "ambiguous");
          return;
        }

        if (matchedApartment) {
          consumeSourceApartment(
            apartment,
            matchedApartment,
            "number_with_floor_prefix",
          );
        }
      });
    }

    if (selectedMatchingRules.includes("exact_number")) {
      Array.from(unmatchedSources.values()).forEach((apartment) => {
        const { apartment: matchedApartment, ambiguous } =
          getAvailableNumberMatch({
            apartmentNumber: apartment.apartment_number,
            candidatesByNumber,
            usedTargetIds,
          });

        if (ambiguous) {
          skipSourceApartment(apartment, "ambiguous");
          return;
        }

        if (matchedApartment) {
          consumeSourceApartment(apartment, matchedApartment, "exact_number");
        }
      });
    }

    if (selectedMatchingRules.includes("area_rooms_type")) {
      const sourceGroups = new Map<string, FloorDuplicationSourceApartment[]>();
      Array.from(unmatchedSources.values()).forEach((apartment) => {
        const key = buildAreaRoomsTypeKey({
          area: apartment.area,
          rooms: apartment.rooms,
          type: apartment.type ?? "apartment",
        });
        const existing = sourceGroups.get(key);

        if (existing) {
          existing.push(apartment);
          return;
        }

        sourceGroups.set(key, [apartment]);
      });

      const targetGroups = new Map<string, FloorDuplicationTargetApartment[]>();
      targetApartments
        .filter((apartment) => !usedTargetIds.has(apartment.id))
        .forEach((apartment) => {
          const key = buildAreaRoomsTypeKey(apartment);
          const existing = targetGroups.get(key);

          if (existing) {
            existing.push(apartment);
            return;
          }

          targetGroups.set(key, [apartment]);
        });

      sourceGroups.forEach((sourceGroup, key) => {
        const targetGroup = targetGroups.get(key) ?? [];

        if (sourceGroup.length === 1 && targetGroup.length === 1) {
          const [sourceApartment] = sourceGroup;
          const [targetApartment] = targetGroup;

          if (sourceApartment && targetApartment) {
            consumeSourceApartment(
              sourceApartment,
              targetApartment,
              "area_rooms_type",
            );
          }
          return;
        }

        sourceGroup.forEach((apartment) => {
          if (
            !unmatchedSources.has(apartment.id) ||
            blockedSourceIds.has(apartment.id)
          ) {
            return;
          }

          skipSourceApartment(
            apartment,
            targetGroup.length > 0 ? "ambiguous" : "no_match",
          );
        });
      });
    }

    Array.from(unmatchedSources.values()).forEach((apartment) => {
      if (blockedSourceIds.has(apartment.id)) {
        return;
      }

      skippedApartments.push({
        sourceApartmentId: apartment.id,
        sourceApartmentNumber: apartment.apartment_number,
        reason: "no_match",
      });
    });

    return {
      floorNumber: targetFloorNumber,
      floorPlanAction,
      polygonMatches,
      skippedApartments,
    };
  });

  const summary = floors.reduce<FloorDuplicationPreviewSummary>(
    (acc, floor) => {
      acc.targetFloorCount += 1;
      if (
        floor.floorPlanAction === "create" ||
        floor.floorPlanAction === "update"
      ) {
        acc.floorPlanOperations += 1;
      }
      acc.polygonOperations += floor.polygonMatches.length;
      acc.skippedMatches += floor.skippedApartments.length;
      acc.ambiguousMatches += floor.skippedApartments.filter(
        (apartment) => apartment.reason === "ambiguous",
      ).length;
      return acc;
    },
    {
      targetFloorCount: 0,
      floorPlanOperations: 0,
      polygonOperations: 0,
      skippedMatches: 0,
      ambiguousMatches: 0,
      totalOperations: 0,
    },
  );

  summary.totalOperations =
    summary.floorPlanOperations + summary.polygonOperations;

  return { floors, summary };
};
