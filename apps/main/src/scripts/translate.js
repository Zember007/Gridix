import translate from 'google-translate-api-x';
import fs from 'fs-extra';
import path from 'path';

// --- НАСТРОЙКИ ---
const SOURCE_LANG = 'en';
const TARGET_LANG = 'he';
const LOCALES_DIR = 'src/locales';

const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
const targetDir = path.join(LOCALES_DIR, TARGET_LANG);

// Функция задержки (чтобы не злить Google API)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translateObject(obj) {
    const newObj = {};

    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            newObj[key] = await translateObject(obj[key]);
        } else if (typeof obj[key] === 'string') {
            try {
                // Небольшая пауза между словами (100мс), чтобы снизить нагрузку
                // Если ошибки продолжатся, увеличь это число до 300-500
                await delay(100); 

                const res = await translate(obj[key], { to: TARGET_LANG, forceBatch: false });
                newObj[key] = res.text;
                console.log(`   OK: ${key.substring(0, 20)}... -> ${res.text.substring(0, 20)}...`);
            } catch (err) {
                console.error(`   ERROR [${key}]:`, err.message);
                
                // Если словили "Too Many Requests", делаем долгую паузу и пробуем оставить оригинал
                if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
                    console.log('   !!! Сработал лимит запросов. Ждем 10 секунд... !!!');
                    await delay(10000);
                }
                newObj[key] = obj[key]; 
            }
        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

async function run() {
    try {
        if (!fs.existsSync(sourceDir)) {
            console.error(`Source directory not found: ${sourceDir}`);
            return;
        }

        await fs.ensureDir(targetDir);

        const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.json'));

        console.log(`Found ${files.length} files. Checking for existing translations...`);

        for (const file of files) {
            const targetFilePath = path.join(targetDir, file);

            // --- ПРОВЕРКА НА СУЩЕСТВОВАНИЕ ---
            if (fs.existsSync(targetFilePath)) {
                console.log(`[SKIP] ${file} уже существует.`);
                continue; // Пропускаем итерацию цикла
            }
            
            console.log(`\n>>> Processing new file: ${file}...`);
            
            const sourceFilePath = path.join(sourceDir, file);
            const sourceContent = await fs.readJson(sourceFilePath);

            const translatedContent = await translateObject(sourceContent);

            await fs.writeJson(targetFilePath, translatedContent, { spaces: 2 });
            console.log(`>>> Saved: ${targetFilePath}`);
            
            // Пауза между файлами (1 секунда), чтобы "остыть"
            await delay(1000);
        }

        console.log('\n--- Translation Complete! ---');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

run();