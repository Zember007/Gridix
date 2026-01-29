import React from 'react';

interface Feature {
  icon: React.ReactNode;
  text: string;
}

export interface PricingCardProps {
  title: string;
  price: string;
  pricePeriod: string;
  description: string;
  features: Feature[];
  limitations: Feature[];
  suitability: string;
  ctaText: string;
  isFeatured: boolean;
  onClick?: () => void;
  disabled?: boolean;
  includedLabel?: string;
  limitationsLabel?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  pricePeriod,
  description,
  features,
  limitations,
  suitability,
  ctaText,
  isFeatured,
  onClick,
  disabled,
  includedLabel = 'Включено:',
  limitationsLabel = 'Ограничения:',
}) => {
  const cardClasses = isFeatured
    ? 'bg-white border-2 border-blue-500 shadow-2xl shadow-blue-500/10'
    : 'bg-white border border-gray-200';

  return (
    <div className={`rounded-2xl p-8 flex flex-col h-full ${cardClasses}`}>
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      <p className="mt-4">
        <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{price}</span>
        <span className="text-lg text-gray-600 ml-1">{pricePeriod}</span>
      </p>
      <p className="mt-4 text-gray-600">{description}</p>
      
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full mt-8 py-3 rounded-lg font-semibold transition-colors ${
          disabled 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : isFeatured 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {ctaText}
      </button>

      <div className="mt-8 pt-8 border-t border-gray-200 flex-grow">
        <p className="font-semibold text-gray-900 mb-4">{includedLabel}</p>
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 text-blue-600 mt-0.5">{feature.icon}</span>
              <span className="text-gray-700">{feature.text}</span>
            </li>
          ))}
        </ul>

        {limitations.length > 0 && (
          <>
            <p className="font-semibold text-gray-900 mt-8 mb-4">{limitationsLabel}</p>
            <ul className="space-y-4">
              {limitations.map((limitation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 text-red-600 mt-0.5">{limitation.icon}</span>
                  <span className="text-gray-600">{limitation.text}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">{suitability}</p>
    </div>
  );
};

export default PricingCard;

