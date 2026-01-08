import React from 'react';
import { Button } from '@/shared/ui/button';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { ProjectSubscription } from '@/entities/subscription/queries/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectSubscriptionsListProps {
  projects: ProjectSubscription[];
  onOpenInvoice: (projectId: string, currentPlanId?: string | null) => void;
}

export const ProjectSubscriptionsList: React.FC<ProjectSubscriptionsListProps> = ({
  projects,
  onOpenInvoice,
}) => {
  const { t } = useLanguage();

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 size={24} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">
          {t('admin.subscriptionPage.projects.emptyTitle')}
        </h3>
        <p className="text-slate-500 text-sm mt-1 mb-4 max-w-md mx-auto">
          {t('admin.subscriptionPage.projects.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        const sub = project.user_subscriptions?.[0];
        const isActive = sub?.status === 'active';
        const isExpired = sub?.status === 'expired';

        const daysLeft = isActive
          ? Math.ceil(
              (new Date(sub.current_period_end || '').getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const isUrgent = daysLeft > 0 && daysLeft <= 5;

        return (
          <div
            key={project.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
          >
            <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
              {/* Project Info */}
              <div className="flex items-center gap-4 min-w-[250px]">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-bold text-lg uppercase ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {project.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 truncate max-w-[200px] blur">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 blur">
                    <Building2 size={10} />{' '}
                    {project.user_profiles?.company_name ||
                      project.user_profiles?.full_name ||
                      project.user_profiles?.email ||
                      project.user_id.substring(0, 8)}
                  </p>
                </div>
              </div>

              {/* Subscription Status Info */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                {/* Plan Name */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {t('admin.subscriptionPage.projects.tariff')}
                  </span>
                  {sub?.subscription_plans ? (
                    <div className="font-bold text-slate-800 mt-0.5">
                      {sub.subscription_plans.name}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 mt-0.5 italic">
                      {t('admin.subscriptionPage.projects.notSelected')}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {t('admin.subscriptionPage.projects.expiresAt')}
                  </span>
                  {sub?.current_period_end ? (
                    <div className="mt-0.5">
                      <div
                        className={`text-sm font-medium ${
                          isUrgent && isActive ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {new Date(sub.current_period_end).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ) : project.subscription_expires_at ? (
                    <div className="mt-0.5 text-sm text-slate-700">
                      {new Date(project.subscription_expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300 mt-0.5">—</div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center sm:justify-start">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircle2 size={14} /> {t('admin.subscriptionPage.projects.status.active')}
                    </span>
                  ) : isExpired ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertTriangle size={14} /> {t('admin.subscriptionPage.projects.status.expired')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                      {t('admin.subscriptionPage.projects.status.inactive')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex md:justify-end pt-2 md:pt-0">
                {isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
                    onClick={() => onOpenInvoice(project.id, sub?.plan_id)}
                  >
                    {t('admin.subscriptionPage.projects.buttons.extend')}{' '}
                    <ArrowRight size={16} className="opacity-50" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                    onClick={() => onOpenInvoice(project.id, sub?.plan_id)}
                  >
                    <Plus size={18} /> {t('admin.subscriptionPage.projects.buttons.activate')}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar for Active Subs */}
            {isActive && daysLeft > 0 && daysLeft < 30 && (
              <div className="h-1 w-full bg-slate-100">
                <div
                  className={`h-full ${isUrgent ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

