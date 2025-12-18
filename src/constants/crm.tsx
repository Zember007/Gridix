import React from 'react';
import {
  Clock,
  Users,
  CheckSquare,
  Repeat,
  Edit,
  Tag,
  Bell,
  Home,
} from 'lucide-react';
import { FunnelTrigger, CardField } from '@/types/crm';

export const getTriggerIcons = (
  t: (key: string) => string,
): {
  [key in FunnelTrigger['icon']]: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
} => ({
  clock: {
    icon: React.createElement(Clock, { size: 16 }),
    color: 'bg-gray-100 text-gray-600',
    label: t('leads.triggers.icons.clock'),
  },
  distribution: {
    icon: React.createElement(Users, { size: 16 }),
    color: 'bg-green-50 text-green-600',
    label: t('leads.triggers.icons.distribution'),
  },
  task: {
    icon: React.createElement(CheckSquare, { size: 16 }),
    color: 'bg-green-50 text-green-600',
    label: t('leads.triggers.icons.task'),
  },
  status_change: {
    icon: React.createElement(Repeat, { size: 16 }),
    color: 'bg-blue-50 text-blue-600',
    label: t('leads.triggers.icons.statusChange'),
  },
  edit_field: {
    icon: React.createElement(Edit, { size: 16 }),
    color: 'bg-purple-50 text-purple-600',
    label: t('leads.triggers.icons.editField'),
  },
  add_tag: {
    icon: React.createElement(Tag, { size: 16 }),
    color: 'bg-blue-50 text-blue-600',
    label: t('leads.triggers.icons.addTag'),
  },
  notification: {
    icon: React.createElement(Bell, { size: 16 }),
    color: 'bg-amber-50 text-amber-600',
    label: t('leads.triggers.icons.notification'),
  },
  apartment_status: {
    icon: React.createElement(Home, { size: 16 }),
    color: 'bg-indigo-50 text-indigo-600',
    label: t('leads.triggers.icons.apartmentStatus'),
  },
});

export const getCardFieldOptions = (
  t: (key: string) => string,
): { value: CardField; label: string }[] => [
  { value: 'none', label: t('leads.cardFields.none') },
  { value: 'name', label: t('leads.cardFields.name') },
  { value: 'project', label: t('leads.cardFields.project') },
  { value: 'price', label: t('leads.cardFields.price') },
  { value: 'tags', label: t('leads.cardFields.tags') },
  { value: 'assignedTo', label: t('leads.cardFields.assignedTo') },
];
