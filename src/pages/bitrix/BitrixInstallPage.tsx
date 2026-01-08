import { useEffect, useState } from 'react';
const BitrixInstallPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {

    if (typeof BX24 !== 'undefined' && BX24 !== null) {
      setIsInitialized(true);

      
      BX24.init(() => {
        setIsInitialized(true);
        BX24.resizeWindow(1200, 800); // или BX24.fitWindow() для авторесайза

        // Получаем auth (токены, member_id и т.д.)
        const auth = BX24.getAuth();
        console.log('Auth данные:', auth);

        // Здесь твой основной UI виджета
      });
    } else {
      setIsInitialized(false);
      console.error('BX24 не загрузился');
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