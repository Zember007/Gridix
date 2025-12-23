import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import GoogleSheetsImportDemo from '@/components/data-import/GoogleSheetsImportDemo';
import { useNavigate } from 'react-router-dom';

const GoogleSheetsTestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Тестирование импорта Google Sheets
              </h1>
              <p className="text-gray-600">
                Проверка функциональности преобразования и импорта данных из Google Sheets
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <GoogleSheetsImportDemo />
      </div>
    </div>
  );
};

export default GoogleSheetsTestPage;
