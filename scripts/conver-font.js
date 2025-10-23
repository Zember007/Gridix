// convert-fonts.js
const urlRegular = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGeorgian/NotoSansGeorgian-Regular.ttf';
const urlBold = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGeorgian/NotoSansGeorgian-Bold.ttf';

async function fetchAndBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const buffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

(async () => {
  try {
    console.log('Загрузка Regular...');
    const regularBase64 = await fetchAndBase64(urlRegular);
    console.log(`const georgianRegularBase64 = '${regularBase64}';`);

    console.log('\nЗагрузка Bold...');
    const boldBase64 = await fetchAndBase64(urlBold);
    console.log(`const georgianBoldBase64 = '${boldBase64}';`);
  } catch (error) {
    console.error('Ошибка:', error);
  }
})();