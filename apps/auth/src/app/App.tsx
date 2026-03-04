import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@gridix/utils";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import AuthPage from "@/pages/AuthPage";
import CallbackPage from "@/pages/CallbackPage";
import CompleteProfilePage from "@/pages/CompleteProfilePage";
import RootPage from "@/pages/RootPage";

function LangFallbackRoute() {
  const { lang } = useParams<{ lang?: string }>();
  const location = useLocation();
  return (
    <Navigate
      replace
      to={{
        pathname: `/${lang ?? DEFAULT_LANGUAGE}/auth/signin`,
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}

function NotFoundRoute() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={{
        pathname: `/${DEFAULT_LANGUAGE}/auth/signin`,
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <Routes>
            <Route path="/" element={<RootPage />} />
            {/* After LanguageWrapper adds /:lang prefix, land here */}
            <Route path="/:lang" element={<RootPage />} />
            <Route path="/:lang/" element={<RootPage />} />
            <Route path="/:lang/auth/signin" element={<AuthPage />} />
            <Route path="/:lang/auth/signup" element={<AuthPage />} />
            <Route path="/:lang/auth/callback" element={<CallbackPage />} />
            <Route
              path="/:lang/auth/complete-profile"
              element={<CompleteProfilePage />}
            />
            <Route path="/:lang/*" element={<LangFallbackRoute />} />
            <Route path="*" element={<NotFoundRoute />} />
          </Routes>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
