import { useManagerContacts } from '@/hooks/useManagerContacts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, User, Building } from 'lucide-react';

interface ManagerContactInfoProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const ManagerContactInfo = ({ className = '', showTitle = true, compact = false }: ManagerContactInfoProps) => {
  const { contacts, loading, error } = useManagerContacts();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !contacts) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">
            {t('project.contactManagerNotConfigured')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Проверяем, есть ли хотя бы один контакт
  const hasContacts = contacts.contact_name || contacts.contact_phone || contacts.contact_email;

  if (!hasContacts) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">
            {t('project.contactManagerNotConfigured')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {contacts.contact_name && (
          <div className="flex items-center gap-1 text-sm">
            <User className="h-3 w-3" />
            <span>{contacts.contact_name}</span>
          </div>
        )}
        {contacts.contact_phone && (
          <Button variant="ghost" size="sm" className="h-auto p-1">
            <Phone className="h-3 w-3 mr-1" />
            <span className="text-sm">{contacts.contact_phone}</span>
          </Button>
        )}
        {contacts.contact_email && (
          <Button variant="ghost" size="sm" className="h-auto p-1">
            <Mail className="h-3 w-3 mr-1" />
            <span className="text-sm">{contacts.contact_email}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        {showTitle && (
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('project.contactManager')}
          </CardTitle>
        )}
        {contacts.company_name && (
          <CardDescription className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            {contacts.company_name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.contact_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contacts.contact_name}</span>
          </div>
        )}
        
        {contacts.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" className="h-auto p-0 font-normal">
              <a href={`tel:${contacts.contact_phone}`} className="hover:underline">
                {contacts.contact_phone}
              </a>
            </Button>
          </div>
        )}
        
        {contacts.contact_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" className="h-auto p-0 font-normal">
              <a href={`mailto:${contacts.contact_email}`} className="hover:underline">
                {contacts.contact_email}
              </a>
            </Button>
          </div>
        )}
        
        {contacts.contact_address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm text-muted-foreground">{contacts.contact_address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerContactInfo; 