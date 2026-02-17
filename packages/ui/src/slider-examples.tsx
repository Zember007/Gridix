import { useState } from "react";
import { Slider } from "./slider";

export function SliderExamples() {
  const [singleValue, setSingleValue] = useState([50]);
  const [rangeValue, setRangeValue] = useState([20, 80]);
  const [tripleValue, setTripleValue] = useState([10, 50, 90]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Примеры использования Slider
        </h3>

        {/* Одиночный слайдер */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Одиночный слайдер: {singleValue[0]}
          </label>
          <Slider
            value={singleValue}
            onValueChange={setSingleValue}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Диапазон */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Диапазон: {rangeValue[0]} - {rangeValue[1]}
          </label>
          <Slider
            value={rangeValue}
            onValueChange={setRangeValue}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Тройной слайдер */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Тройной слайдер: {tripleValue[0]} - {tripleValue[1]} -{" "}
            {tripleValue[2]}
          </label>
          <Slider
            value={tripleValue}
            onValueChange={setTripleValue}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Статический пример с defaultValue */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Статический слайдер с defaultValue
          </label>
          <Slider
            defaultValue={[30, 70]}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Отключенный слайдер */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Отключенный слайдер</label>
          <Slider
            defaultValue={[40]}
            max={100}
            step={1}
            disabled
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
