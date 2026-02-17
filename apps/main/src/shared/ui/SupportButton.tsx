import { Button } from "@gridix/ui";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { MessageCircleQuestionMark } from "lucide-react";

export function SupportButton() {
  return (
    <Button
      size="icon"
      className="support_usertour fixed z-[60] h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
      style={{
        right: "calc(16px + env(safe-area-inset-right))",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        backgroundColor: ADMIN_THEME.primary,
        color: ADMIN_THEME.textOnPrimary,
        borderColor: ADMIN_THEME.primary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
        e.currentTarget.style.transform = "scale(1)";
      }}
      onClick={() => {
        window.open("https://t.me/gridix_bot", "_blank");
      }}
    >
      <MessageCircleQuestionMark />
    </Button>
  );
}
