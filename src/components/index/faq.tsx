import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const FAQ = () => {
  const { t } = useLanguage();

  const faqGroups = [
    {
      title: t('landing.faq.general.title'),
      items: [
        {
          id: 'general-1',
          question: t('landing.faq.general.q1.question'),
          answer: t('landing.faq.general.q1.answer'),
        },
        {
          id: 'general-2',
          question: t('landing.faq.general.q2.question'),
          answer: t('landing.faq.general.q2.answer'),
        },
        {
          id: 'general-3',
          question: t('landing.faq.general.q3.question'),
          answer: t('landing.faq.general.q3.answer'),
        },
        {
          id: 'general-4',
          question: t('landing.faq.general.q4.question'),
          answer: t('landing.faq.general.q4.answer'),
        },
      ],
    },
    {
      title: t('landing.faq.technical.title'),
      items: [
        {
          id: 'tech-1',
          question: t('landing.faq.technical.q1.question'),
          answer: t('landing.faq.technical.q1.answer'),
        },
        {
          id: 'tech-2',
          question: t('landing.faq.technical.q2.question'),
          answer: t('landing.faq.technical.q2.answer'),
        },
        {
          id: 'tech-3',
          question: t('landing.faq.technical.q3.question'),
          answer: t('landing.faq.technical.q3.answer'),
        },
        {
          id: 'tech-4',
          question: t('landing.faq.technical.q4.question'),
          answer: t('landing.faq.technical.q4.answer'),
        },
      ],
    },
    {
      title: t('landing.faq.payment.title'),
      items: [
        {
          id: 'payment-1',
          question: t('landing.faq.payment.q1.question'),
          answer: t('landing.faq.payment.q1.answer'),
        },
        {
          id: 'payment-2',
          question: t('landing.faq.payment.q2.question'),
          answer: t('landing.faq.payment.q2.answer'),
        },
        {
          id: 'payment-3',
          question: t('landing.faq.payment.q3.question'),
          answer: t('landing.faq.payment.q3.answer'),
        },
        {
          id: 'payment-4',
          question: t('landing.faq.payment.q4.question'),
          answer: t('landing.faq.payment.q4.answer'),
        },
        {
          id: 'payment-5',
          question: t('landing.faq.payment.q5.question'),
          answer: t('landing.faq.payment.q5.answer'),
        },
      ],
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">
            {t('landing.faq.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div className="space-y-12">
          {faqGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {group.title}
              </h3>
              <Accordion
                type="single"
                collapsible
                className="bg-card ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0 text-left">
                {group.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border-dashed">
                    <AccordionTrigger className="cursor-pointer text-base hover:no-underline text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-base">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 px-8">
          {(() => {
            const text = t('landing.faq.supportLink');
            const parts = text.split('{link}');
            if (parts.length === 2) {
              const [before, after] = parts;
              if(!after) return
              const [linkText, afterLink] = after.split('{/link}');
              return (
                <>
                  {before}
                  <Link
                    to={`contacts`}
                    className="text-primary font-medium hover:underline">
                    {linkText}
                  </Link>
                  {afterLink || ''}
                </>
              );
            }
            return text;
          })()}
        </p>
      </div>
    </section>
  );
};


