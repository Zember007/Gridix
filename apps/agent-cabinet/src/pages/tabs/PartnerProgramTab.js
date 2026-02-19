import { jsx as _jsx } from "react/jsx-runtime";
import { PartnerProgram } from "@gridix/partner-program";
export function PartnerProgramTab() {
  return _jsx("div", {
    className: "mx-auto max-w-[1600px] p-4 md:p-6",
    children: _jsx(PartnerProgram, { navigationMode: "tabs" }),
  });
}
