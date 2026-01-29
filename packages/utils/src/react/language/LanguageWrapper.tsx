import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { DEFAULT_LANGUAGE, getLanguagePrefix, hasLanguagePrefix } from "../../lib"

interface LanguageWrapperProps {
  children: ReactNode
}

export default function LanguageWrapper({ children }: LanguageWrapperProps) {
  const location = useLocation()

  if (!hasLanguagePrefix(location.pathname)) {
    const redirectPath = `${getLanguagePrefix(DEFAULT_LANGUAGE)}${location.pathname}${location.search}`
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}

