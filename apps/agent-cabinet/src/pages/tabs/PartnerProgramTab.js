import { jsx as _jsx } from "react/jsx-runtime";
import { PartnerProgram } from "@gridix/partner-program";
export function PartnerProgramTab() {
  return _jsx("div", {
    className: "p-4 md:p-6",
    children: _jsx(PartnerProgram, { navigationMode: "tabs" }),
  });
}
