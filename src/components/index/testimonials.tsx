import { AnimatedTestimonials, type Testimonial } from "@/components/blocks/animated-testimonials"
import { useLanguage } from '@/contexts/LanguageContext';

export const Testimonials = () => {
  const { t } = useLanguage();
  
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: t('landing.testimonials.items.marketing.name'),
      role: t('landing.testimonials.items.marketing.role'),
      company: t('landing.testimonials.items.marketing.company'),
      content: t('landing.testimonials.items.marketing.content'),
      rating: 5,
      avatar: "",
    },
    {
      id: 2,
      name: t('landing.testimonials.items.salesManager.name'),
      role: t('landing.testimonials.items.salesManager.role'),
      company: t('landing.testimonials.items.salesManager.company'),
      content: t('landing.testimonials.items.salesManager.content'),
      rating: 5,
      avatar: "",
    },
    {
      id: 3,
      name: t('landing.testimonials.items.commercialDirector.name'),
      role: t('landing.testimonials.items.commercialDirector.role'),
      company: t('landing.testimonials.items.commercialDirector.company'),
      content: t('landing.testimonials.items.commercialDirector.content'),
      rating: 5,
      avatar: "",
    },
  ]

  return (
    <AnimatedTestimonials
      title={t('landing.testimonials.title')}
      subtitle={t('landing.testimonials.subtitle')}
      badgeText={t('landing.testimonials.badge')}
      testimonials={testimonials}
      autoRotateInterval={5000}
    />
  )
}

