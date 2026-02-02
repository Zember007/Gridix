import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import AuthPage from "@/pages/AuthPage";
import CallbackPage from "@/pages/CallbackPage";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <Routes>
            <Route path="/:lang/auth" element={<AuthPage />} />
            <Route path="/:lang/auth/signin" element={<AuthPage />} />
            <Route path="/:lang/auth/signup" element={<AuthPage />} />
            <Route path="/:lang/auth/callback" element={<CallbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}

