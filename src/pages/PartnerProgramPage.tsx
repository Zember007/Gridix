import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLanguageNavigation } from "@/hooks/useLanguageNavigation";
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';
import { IncomeCalculator } from "@/components/partners/IncomeCalculator";

export default function PartnerProgramPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const { navigate } = useLanguageNavigation();

  const faqItems = [
    {
      id: "become-partner",
      question: t('partnerProgram.faq.becomePartner.question'),
      answer: t('partnerProgram.faq.becomePartner.answer'),
    },
    {
      id: "first-payout",
      question: t('partnerProgram.faq.firstPayout.question'),
      answer: t('partnerProgram.faq.firstPayout.answer'),
    },
    {
      id: "integrator-requirements",
      question: t('partnerProgram.faq.integratorRequirements.question'),
      answer: t('partnerProgram.faq.integratorRequirements.answer'),
    },
    {
      id: "share-link",
      question: t('partnerProgram.faq.shareLink.question'),
      answer: t('partnerProgram.faq.shareLink.answer'),
    },
    {
      id: "support",
      question: t('partnerProgram.faq.support.question'),
      answer: t('partnerProgram.faq.support.answer'),
    },
    {
      id: "sales-increase",
      question: t('partnerProgram.faq.salesIncrease.question'),
      answer: t('partnerProgram.faq.salesIncrease.answer'),
    },
    {
      id: "setup-time",
      question: t('partnerProgram.faq.setupTime.question'),
      answer: t('partnerProgram.faq.setupTime.answer'),
    },
    {
      id: "languages",
      question: t('partnerProgram.faq.languages.question'),
      answer: t('partnerProgram.faq.languages.answer'),
    },
    {
      id: "crm-integration",
      question: t('partnerProgram.faq.crmIntegration.question'),
      answer: t('partnerProgram.faq.crmIntegration.answer'),
    },
    {
      id: "profit-example",
      question: t('partnerProgram.faq.profitExample.question'),
      answer: t('partnerProgram.faq.profitExample.answer'),
    },
  ];

  const whyEasyToSell = [
    {
      num: "1",
      title: t('partnerProgram.whyEasyToSell.item1.title'),
      desc: t('partnerProgram.whyEasyToSell.item1.desc'),
    },
    {
      num: "2",
      title: t('partnerProgram.whyEasyToSell.item2.title'),
      desc: t('partnerProgram.whyEasyToSell.item2.desc'),
    },
    {
      num: "3",
      title: t('partnerProgram.whyEasyToSell.item3.title'),
      desc: t('partnerProgram.whyEasyToSell.item3.desc'),
    },
    {
      num: "4",
      title: t('partnerProgram.whyEasyToSell.item4.title'),
      desc: t('partnerProgram.whyEasyToSell.item4.desc'),
    },
    {
      num: "5",
      title: t('partnerProgram.whyEasyToSell.item5.title'),
      desc: t('partnerProgram.whyEasyToSell.item5.desc'),
    },
    {
      num: "6",
      title: t('partnerProgram.whyEasyToSell.item6.title'),
      desc: t('partnerProgram.whyEasyToSell.item6.desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <HeroHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-32 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl -top-20 -right-20"></div>
          <div className="absolute w-96 h-96 rounded-full bg-accent/10 blur-3xl -bottom-20 -left-20"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">
                {t('partnerProgram.hero.badge')}
              </span>
            </div>
            <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl md:text-8xl ">
              {t('partnerProgram.hero.title')}
              <div className="text-2xl md:text-5xl font-bold">
                {t('partnerProgram.hero.subtitle')}
              </div>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 mb-8 leading-relaxed">
              {t('partnerProgram.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('partnerProgram.hero.ctaPrimary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <a
                href="#calculator"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-primary/30 px-8 text-base font-semibold text-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors"
              >
                {t('partnerProgram.hero.ctaSecondary')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Gridix is Easy to Sell */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
              {t('partnerProgram.whyEasyToSell.title')}
            </h2>
            <p className="text-lg text-foreground/60 text-center mb-12">
              {t('partnerProgram.whyEasyToSell.description')}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {whyEasyToSell.map((item) => (
                <div key={item.num} className="p-6 rounded-lg border border-border bg-secondary/30 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary-foreground">{item.num}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-foreground/60">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              {t('partnerProgram.valueProposition.title')}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Builders */}
              <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 5 7 13 17 13 17 5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{t('partnerProgram.valueProposition.builders.title')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.builders.item1')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.builders.item2')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.builders.item3')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.builders.item4')}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Managers */}
              <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{t('partnerProgram.valueProposition.managers.title')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.managers.item1')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.managers.item2')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.managers.item3')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.managers.item4')}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Clients */}
              <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5h4m-11 0h4m-4-3v4m0-8v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{t('partnerProgram.valueProposition.clients.title')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.clients.item1')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.clients.item2')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.clients.item3')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">
                      {t('partnerProgram.valueProposition.clients.item4')}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types Section */}
      <section id="types" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('partnerProgram.partnerTypes.title')}
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              {t('partnerProgram.partnerTypes.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Partner */}
            <div className="group rounded-xl border border-border bg-secondary/30 p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {t('partnerProgram.partnerTypes.basic.commission')}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t('partnerProgram.partnerTypes.basic.title')}
              </h3>
              <p className="text-foreground/60 mb-6 text-sm">
                {t('partnerProgram.partnerTypes.basic.subtitle')}
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.basic.item1')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.basic.item2')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.basic.item3')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.basic.item4')}
                  </span>
                </li>
              </ul>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
                <p className="text-sm text-foreground/70">
                  {t('partnerProgram.partnerTypes.basic.note')}
                </p>
              </div>

              <button
                onClick={() => navigate('/auth')}
                className="inline-flex w-full h-10 items-center justify-center rounded-md border border-primary/30 text-foreground font-medium hover:bg-primary/5 transition-colors"
              >
                {t('partnerProgram.partnerTypes.basic.cta')}
              </button>
            </div>

            {/* Integrator Partner */}
            <div className="group rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-8 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {t('partnerProgram.partnerTypes.integrator.recommended')}
              </div>
              <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {t('partnerProgram.partnerTypes.integrator.commission')}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t('partnerProgram.partnerTypes.integrator.title')}
              </h3>
              <p className="text-foreground/60 mb-6 text-sm">
                {t('partnerProgram.partnerTypes.integrator.subtitle')}
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.integrator.item1')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.integrator.item2')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.integrator.item3')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/70">
                    {t('partnerProgram.partnerTypes.integrator.item4')}
                  </span>
                </li>
              </ul>

              <div className="p-4 rounded-lg bg-primary/20 border border-primary/30 mb-6">
                <p className="text-sm font-semibold text-foreground">
                  {t('partnerProgram.partnerTypes.integrator.note')}
                </p>
              </div>

              <button
                onClick={() => navigate('/auth')}
                className="inline-flex w-full h-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {t('partnerProgram.partnerTypes.integrator.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Income Calculator */}
      <section id="calculator">
        <IncomeCalculator />
      </section>

      {/* Case Studies Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('partnerProgram.caseStudies.title')}
            </h2>
            <p className="text-lg text-foreground/60">
              {t('partnerProgram.caseStudies.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Case 1 - Batumi */}
            <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t('partnerProgram.caseStudies.batumi.title')}
              </h3>
              <p className="text-sm text-primary font-semibold mb-1 blur-sm">{t('partnerProgram.caseStudies.batumi.company')}</p>
              <p className="text-xs text-foreground/60 mb-4">{t('partnerProgram.caseStudies.batumi.type')}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.problemLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.batumi.problem')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.solutionLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.batumi.solution')}
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-primary">{t('partnerProgram.caseStudies.resultLabel')}</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.batumi.result1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.batumi.result2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.batumi.result3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Case 2 - Izmir */}
            <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m6 2a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM12 9v3m0 0v3m0-3h3m-3 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t('partnerProgram.caseStudies.izmir.title')}
              </h3>
              <p className="text-sm text-primary font-semibold mb-1 blur-sm">{t('partnerProgram.caseStudies.izmir.company')}</p>
              <p className="text-xs text-foreground/60 mb-4">{t('partnerProgram.caseStudies.izmir.type')}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.problemLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.izmir.problem')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.solutionLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.izmir.solution')}
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-primary">{t('partnerProgram.caseStudies.resultLabel')}</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.izmir.result1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.izmir.result2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.izmir.result3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Case 3 - Dubai */}
            <div className="rounded-xl border border-border bg-background p-8 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9m-9 4v4m4-4v4m-8-8v.5a2.5 2.5 0 0 0 5 0V9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t('partnerProgram.caseStudies.dubai.title')}
              </h3>
              <p className="text-sm text-primary font-semibold mb-1 blur-sm">{t('partnerProgram.caseStudies.dubai.company')}</p>
              <p className="text-xs text-foreground/60 mb-4">{t('partnerProgram.caseStudies.dubai.type')}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.problemLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.dubai.problem')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">{t('partnerProgram.caseStudies.solutionLabel')}</p>
                  <p className="text-sm text-foreground/70">
                    {t('partnerProgram.caseStudies.dubai.solution')}
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-primary">{t('partnerProgram.caseStudies.resultLabel')}</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.dubai.result1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.dubai.result2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span className="text-sm text-foreground/70">{t('partnerProgram.caseStudies.dubai.result3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              {t('partnerProgram.faq.title')}
            </h2>

            <div className="space-y-4">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-secondary/30 overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === item.id ? null : item.id)
                    }
                    className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-foreground text-left">
                      {item.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 flex-shrink-0 transition-transform ${
                        expandedFaq === item.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === item.id && (
                    <div className="px-6 pb-6 text-foreground/70 border-t border-border">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl -top-20 -right-20"></div>
          <div className="absolute w-96 h-96 rounded-full bg-accent/5 blur-3xl -bottom-20 -left-20"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('partnerProgram.finalCta.title')}
            </h2>
            <p className="text-lg text-foreground/60 mb-8">
              {t('partnerProgram.finalCta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('partnerProgram.finalCta.ctaPrimary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <a
                href="https://t.me/gridix_bot"
                className="inline-flex h-12 items-center justify-center rounded-md bg-sky-500 px-8 text-base font-semibold text-white hover:bg-sky-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.721 4.027c.252-1.182-.427-1.64-1.6-1.2L2.747 9.452c-1.09.422-1.078 1.018-.197 1.284l4.825 1.505 11.19-7.042c.527-.318.999-.147.606.19l-9.078 8.184-.335 4.7c.487 0 .698-.22.968-.482l2.327-2.27 4.837 3.565c.893.494 1.538.238 1.764-.848l2.367-11.711z" />
                </svg>
                {t('partnerProgram.finalCta.ctaSecondary')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

