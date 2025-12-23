import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load domain pages
const DomainProjectPage = lazy(() => import("@/pages/DomainProjectPage"));
const DomainApartmentPage = lazy(() => import("@/pages/DomainApartmentPage"));

export function DomainRoutes() {
  return (
    <Routes>
      {/* Custom domain routes - for when site is accessed via custom domain */}
      <Route index element={<DomainProjectPage />} />
      <Route path="apartment/:apartmentId" element={<DomainApartmentPage />} />
    </Routes>
  );
}

