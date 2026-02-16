import { Card, CardContent } from "./card";
import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

interface Testimonial {
  id: number;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Анна Петрова",
    company: "РосНедвижимость",
    role: "Директор по продажам",
    content:
      "Gridix полностью изменил наш подход к презентации проектов. Клиенты теперь могут интерактивно изучать планы, что значительно повысило конверсию продаж.",
    rating: 5,
  },
  {
    id: 2,
    name: "Георгий Мамедов",
    company: "БатумиДевелопмент",
    role: "Руководитель проектов",
    content:
      "Простота использования и мощный функционал делают Gridix незаменимым инструментом. Особенно нравится возможность встраивания виджетов на наш сайт.",
    rating: 5,
  },
  {
    id: 3,
    name: "Михаил Иванов",
    company: "СтройИнвест",
    role: "Маркетинг-менеджер",
    content:
      "Отличное решение для визуализации недвижимости! Клиенты оценили интерактивные планы. Техподдержка работает быстро и профессионально.",
    rating: 5,
  },
];

interface TestimonialsProps {
  isMobile?: boolean;
}

export const Testimonials = ({ isMobile = false }: TestimonialsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-current text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (isMobile) {
    return (
      <div className="space-y-6">
        {testimonials.map((testimonial, index) => (
          <Card
            key={testimonial.id}
            className={`border-0 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-500 ${
              index === currentIndex ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Quote className="mt-1 h-8 w-8 flex-shrink-0 text-blue-600" />
                <div className="flex-1">
                  <p className="mb-4 text-gray-700 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {testimonial.company}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-8 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card
            key={testimonial.id}
            className={`transform border-0 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-500 hover:shadow-xl ${
              index === currentIndex
                ? "scale-105 ring-2 ring-blue-500"
                : "hover:scale-105"
            }`}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <Quote className="mb-3 h-8 w-8 text-blue-600" />
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {testimonial.company}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Indicators */}
      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-blue-600"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
