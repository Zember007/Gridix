import { useCallback, useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { ApartmentPhoto, CoverageFilter } from "./useApartmentPhotosManager";

export const useApartmentPhotosData = (
  projectId: string,
  subProjectId?: string,
) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<string>("");
  const [photos, setPhotos] = useState<ApartmentPhoto[]>([]);
  const [photoCountsByApartment, setPhotoCountsByApartment] = useState<
    Record<string, number>
  >({});
  const [isCoverageExpanded, setIsCoverageExpanded] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [loading, setLoading] = useState(true);
  const editorData = useProjectEditorDataContext();

  const loadApartments = useCallback(async () => {
    try {
      let query = supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId);
      if (subProjectId) query = query.eq("sub_project_id", subProjectId);
      query = query
        .order("floor_number", { ascending: true })
        .order("apartment_number", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setApartments((data || []).map(normalizeApartmentData));
    } catch (error) {
      console.error("Error loading apartments:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, subProjectId]);

  useEffect(() => {
    if (editorData) {
      if (editorData.loading) {
        setLoading(true);
        return;
      }

      if (editorData?.data?.apartments == null) {
        setApartments([]);
        setLoading(false);
        return;
      }

      setApartments(editorData.data.apartments.map(normalizeApartmentData));
      setLoading(false);
      return;
    }

    void loadApartments();
  }, [editorData, editorData?.data?.apartments, loadApartments]);

  const loadPhotos = useCallback(async () => {
    if (!selectedApartment) return;

    try {
      const { data, error } = await supabase
        .from("apartment_photos")
        .select("*")
        .eq("apartment_id", selectedApartment)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  }, [selectedApartment]);

  useEffect(() => {
    if (!selectedApartment) return;
    void loadPhotos();
  }, [selectedApartment, loadPhotos]);

  const loadPhotoCoverage = useCallback(async () => {
    const apartmentIds = apartments.map((apartment) => apartment.id);
    if (apartmentIds.length === 0) {
      setPhotoCountsByApartment({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("apartment_photos")
        .select("apartment_id")
        .in("apartment_id", apartmentIds);

      if (error) throw error;

      const defaultCounts = apartmentIds.reduce<Record<string, number>>(
        (acc, apartmentId) => {
          acc[apartmentId] = 0;
          return acc;
        },
        {},
      );

      const counts = (data || []).reduce<Record<string, number>>(
        (acc, photo) => {
          acc[photo.apartment_id] = (acc[photo.apartment_id] || 0) + 1;
          return acc;
        },
        defaultCounts,
      );

      setPhotoCountsByApartment(counts);
    } catch (error) {
      console.error("Error loading apartment photo coverage:", error);
    }
  }, [apartments]);

  useEffect(() => {
    void loadPhotoCoverage();
  }, [loadPhotoCoverage]);

  const apartmentsWithPhotos = apartments.filter(
    (apartment) => (photoCountsByApartment[apartment.id] || 0) > 0,
  );
  const apartmentsWithoutPhotos = apartments.filter(
    (apartment) => (photoCountsByApartment[apartment.id] || 0) === 0,
  );
  const orderedApartments = [
    ...apartmentsWithoutPhotos,
    ...apartmentsWithPhotos,
  ];
  const filteredApartments =
    coverageFilter === "with"
      ? apartmentsWithPhotos
      : coverageFilter === "without"
        ? apartmentsWithoutPhotos
        : orderedApartments;

  return {
    apartments,
    selectedApartment,
    setSelectedApartment,
    photos,
    loading,
    photoCountsByApartment,
    isCoverageExpanded,
    setIsCoverageExpanded,
    coverageFilter,
    setCoverageFilter,
    apartmentsWithPhotos,
    apartmentsWithoutPhotos,
    filteredApartments,
    loadPhotos,
    loadPhotoCoverage,
  };
};
