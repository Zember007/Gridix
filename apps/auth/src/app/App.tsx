import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import AuthPage from "@/pages/AuthPage";
import CallbackPage from "@/pages/CallbackPage";
import RootPage from "@/pages/RootPage";

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <Routes>
            <Route path="/" element={<RootPage />} />
            <Route path="/:lang/auth" element={<AuthPage />} />
            <Route path="/:lang/auth/signin" element={<AuthPage />} />
            <Route path="/:lang/auth/signup" element={<AuthPage />} />
            <Route path="/:lang/auth/callback" element={<CallbackPage />} />
            <Route path="*" element={<Navigate replace to="/auth" />} />
          </Routes>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}

