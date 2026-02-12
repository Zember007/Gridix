import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { DEFAULT_LANGUAGE, getLanguagePrefix, hasLanguagePrefix } from "../../lib"
import { useLanguage } from "./LanguageContext"

interface LanguageWrapperProps {
  children: ReactNode
}

export default function LanguageWrapper({ children }: LanguageWrapperProps) {
  const location = useLocation()
  // Ensures i18n language + document direction (LTR/RTL) stay in sync with URL.
  useLanguage()

  if (!hasLanguagePrefix(location.pathname)) {
    const redirectPathname = `${getLanguagePrefix(DEFAULT_LANGUAGE)}${location.pathname}`
    // IMPORTANT: preserve hash (#access_token=... etc.) so magic links keep working during lang redirect
    return (
      <Navigate
        to={{ pathname: redirectPathname, search: location.search, hash: location.hash }}
        replace
      />
    )
  }

  return <>{children}</>
}

