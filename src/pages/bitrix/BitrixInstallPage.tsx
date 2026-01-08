import { useEffect, useState } from 'react';
const BitrixInstallPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://api.bitrix24.com/api/v1/';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
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
      }, 1000);
    };
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, []);
  return (
    <div>
      Проверка Bitrix24
      {isInitialized ? 'BX24 инициализирован' : 'BX24 не инициализирован'}
    </div>
  );
};

export default BitrixInstallPage;