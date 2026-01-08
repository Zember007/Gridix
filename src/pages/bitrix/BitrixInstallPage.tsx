import { useEffect } from 'react';
const BitrixInstallPage = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://api.bitrix24.ru/api/v4/bx24.js';
        script.async = true;
        script.onload = () => {
          const BX24 = (window as any).BX24;
          if (BX24) {
            console.log('BX24 инициализирован');
            BX24.init(() => {
              console.log('BX24 инициализирован');
              BX24.resizeWindow(1200, 800); // Важно! Без ресайза вкладка может быть крошечной/пустой
              // BX24.fitWindow(); // альтернатива
            });
          } else {
            console.log('BX24 не инициализирован');
          }
        };
        document.head.appendChild(script);
      
        return () => { document.head.removeChild(script); };
      }, []);
    return (
        <div>
            Проверка Bitrix24
        </div>
    );
};

export default BitrixInstallPage;