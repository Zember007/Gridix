import React from 'react';
import {
  Map,
  BarChart3,
  FileText,
  File,
  Link as LinkIcon,
  Globe,
  TrendingUp,
  Building,
  Upload,
  PenTool,
  Wrench,
  Users,
  Palette,
  Code,
  Rocket,
  Handshake,
  PiggyBank,
  Gift,
  Clock,
  CreditCard,
  Briefcase,
  Lock,
  Sparkles,
  Check,
  XCircle,
} from 'lucide-react';

type IconProps = {
  className?: string;
};

const iconDefaults = "w-[18px] h-[18px] min-w-[18px] min-h-[18px] stroke-current";

export const MapIcon: React.FC<IconProps> = ({ className }) => (
  <Map className={`${iconDefaults} ${className}`} />
);

export const BarChartSquareIcon: React.FC<IconProps> = ({ className }) => (
  <BarChart3 className={`${iconDefaults} ${className}`} />
);

export const FileTextIcon: React.FC<IconProps> = ({ className }) => (
  <FileText className={`${iconDefaults} ${className}`} />
);

export const FilePdfIcon: React.FC<IconProps> = ({ className }) => (
  <File className={`${iconDefaults} ${className}`} />
);

export const LinkIconComponent: React.FC<IconProps> = ({ className }) => (
  <LinkIcon className={`${iconDefaults} ${className}`} />
);

export const GlobeIcon: React.FC<IconProps> = ({ className }) => (
  <Globe className={`${iconDefaults} ${className}`} />
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className }) => (
  <TrendingUp className={`${iconDefaults} ${className}`} />
);

export const BuildingIcon: React.FC<IconProps> = ({ className }) => (
  <Building className={`${iconDefaults} ${className}`} />
);

export const UploadCloudIcon: React.FC<IconProps> = ({ className }) => (
  <Upload className={`${iconDefaults} ${className}`} />
);

export const PenToolIcon: React.FC<IconProps> = ({ className }) => (
  <PenTool className={`${iconDefaults} ${className}`} />
);

export const WrenchIcon: React.FC<IconProps> = ({ className }) => (
  <Wrench className={`${iconDefaults} ${className}`} />
);

export const XCircleIcon: React.FC<IconProps> = ({ className }) => (
  <XCircle className={`${iconDefaults} ${className}`} />
);

export const UsersIcon: React.FC<IconProps> = ({ className }) => (
  <Users className={`${iconDefaults} ${className}`} />
);

export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
  <Palette className={`${iconDefaults} ${className}`} />
);

export const CodeIcon: React.FC<IconProps> = ({ className }) => (
  <Code className={`${iconDefaults} ${className}`} />
);

export const HandshakeIcon: React.FC<IconProps> = ({ className }) => (
  <Handshake className={`${iconDefaults} ${className}`} />
);

export const RocketIcon: React.FC<IconProps> = ({ className }) => (
  <Rocket className={`${iconDefaults} ${className}`} />
);

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
  <Check className={`${iconDefaults} ${className}`} strokeWidth={3} />
);

export const PiggyBankIcon: React.FC<IconProps> = ({ className }) => (
  <PiggyBank className={`${iconDefaults} ${className}`} />
);

export const GiftIcon: React.FC<IconProps> = ({ className }) => (
  <Gift className={`${iconDefaults} ${className}`} />
);

export const ClockIcon: React.FC<IconProps> = ({ className }) => (
  <Clock className={`${iconDefaults} ${className}`} />
);

export const CreditCardIcon: React.FC<IconProps> = ({ className }) => (
  <CreditCard className={`${iconDefaults} ${className}`} />
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
  <Sparkles className={`${iconDefaults} ${className}`} />
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className }) => (
  <Briefcase className={`${iconDefaults} ${className}`} />
);

export const LockIcon: React.FC<IconProps> = ({ className }) => (
  <Lock className={`${iconDefaults} ${className}`} />
);

