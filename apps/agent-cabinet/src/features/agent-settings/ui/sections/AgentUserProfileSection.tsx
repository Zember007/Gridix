import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { BadgeCheck, Save } from "lucide-react";
import type { AgentUserProfileSectionProps } from "../types";
import {
  BillingDetailsForm,
  CompanyDetailsForm,
  PersonalDetailsForm,
  PersonTypeSwitcher,
} from "../profile";

export function AgentUserProfileSection(props: AgentUserProfileSectionProps) {
  const value = props.value;
  const personType =
    value.person_type === "company" || value.person_type === "individual"
      ? value.person_type
      : "company";

  return (
    <Card className="overflow-hidden border-[var(--admin-border)] shadow-sm transition-all hover:shadow-md">
      <CardHeader className="border-b border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--admin-text-primary)]">
              {props.t("adminSettings.profileInfo")}
            </CardTitle>
            <CardDescription className="text-[var(--admin-text-muted)]">
              {props.t("adminSettings.profileInfoDesc")}
            </CardDescription>
          </div>
          <BadgeCheck className="text-[var(--admin-primary)]" size={24} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {props.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-3 h-8 w-8 animate-spin rounded-full border-[var(--admin-primary)] border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PersonTypeSwitcher
                personType={personType}
                onChange={(next) =>
                  props.onChange({ ...value, person_type: next })
                }
                t={props.t}
              />
            </div>

            <PersonalDetailsForm
              personType={personType}
              value={value}
              onChange={props.onChange}
              t={props.t}
            />

            <CompanyDetailsForm
              personType={personType}
              value={value}
              onChange={props.onChange}
              t={props.t}
            />

            <BillingDetailsForm
              value={value}
              onChange={props.onChange}
              t={props.t}
            />

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => void props.onSave()}
                className="h-11 rounded-xl bg-[var(--admin-primary)] px-8 font-bold shadow-lg hover:bg-[var(--admin-primary-hover)]"
              >
                <Save size={18} className="mr-2" />
                {props.t("adminSettings.save")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
