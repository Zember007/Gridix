
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";
import { HeroStats } from "../index/hero-stats";
import BoxAnimation from "@/components/ui/3d-box-loader-animation";
import { useLanguage } from "@/contexts/LanguageContext";


interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow" | "outline";
}

interface HeroProps {
  title: string;
  description: string;
  onDemoClick?: () => void;
}

export function HeroSection({
  title,
  description,
  onDemoClick,
}: HeroProps) {
  const { t } = useLanguage();

  return (
    <section
      className={cn(
        " text-foreground",
        "py-12 sm:py-24 md:py-32 ",
        "fade-bottom overflow-hidden pb-0 relative"
      )}
    >
      <div className="mx-auto flex container justify-between  pt-16 md:flex-row flex-col gap-12">
        <div className="md:w-2/3 flex flex-col md:items-start items-center gap-6 text-center md:text-left sm:gap-12">


          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-7xl">
            {title}
          </h1>

          {/* Description */}
          <p className="text-md relative z-10  animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
            {description}
          </p>

          <HeroStats />


          {/* Demo Button */}
          {onDemoClick && (
            <div className="text-center animate-appear opacity-0 delay-500 relative z-10">
              <Button
                onClick={onDemoClick}
                variant="default"
                size="lg"
                className=" rounded-full text-xl p-8 font-bold shadow-2xl"
              >
                <span>{t('landing.hero.demoButton')}</span>
              </Button>

              <p className="text-sm text-muted-foreground mt-3">{t('landing.hero.freeTrialText')}</p>

            </div>
          )}

        </div>
        <div className="md:w-1/3 flex justify-center items-center md:mt-0 pt-[120px]">
          <div className="scale-150">
            <BoxAnimation />
          </div>
        </div>
      </div>
      <Glow
        variant="above"
        className="animate-appear-zoom opacity-0 delay-1000"
      />
    </section>
  );
}
