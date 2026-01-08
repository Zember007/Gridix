import { useEffect, useState } from 'react';
const BitrixInstallPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {

    const BX24 = (window as any).BX24;
    if (BX24) {
      BX24.init(() => {
        setIsInitialized(true);
        console.log('BX24 инициализирован');

        BX24.resizeWindow(1200, 800); // Важно! Без ресайза вкладка может быть крошечной/пустой
        // BX24.fitWindow(); // альтернатива
      });
    } else {
      console.log('BX24 не инициализирован');
      setIsInitialized(false);
    }
    
  }, []);
  return (
    <div>
      Проверка Bitrix24
      {isInitialized ? 'BX24 инициализирован' : 'BX24 не инициализирован'}
    </div>
  );
};

export default BitrixInstallPage;