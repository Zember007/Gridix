import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, UserCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccountTypeSelectorProps {
  onSelect: (accountType: 'developer' | 'manager') => void;
  loading?: boolean;
}

export const AccountTypeSelector = ({ onSelect, loading = false }: AccountTypeSelectorProps) => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<'developer' | 'manager' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.whoAreYou')}</CardTitle>
          <CardDescription>{t('auth.selectAccountType')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <button
              onClick={() => setSelectedType('developer')}
              className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedType === 'developer'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className={`h-6 w-6 ${selectedType === 'developer' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{t('auth.developer')}</h3>
                  <p className="text-sm text-gray-500">{t('auth.developerDescription')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedType('manager')}
              className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedType === 'manager'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <UserCheck className={`h-6 w-6 ${selectedType === 'manager' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{t('auth.manager')}</h3>
                  <p className="text-sm text-gray-500">{t('auth.managerDescription')}</p>
                </div>
              </div>
            </button>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedType || loading}
            className="w-full"
          >
            {loading ? t('auth.creating') : t('auth.continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
