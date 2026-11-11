// Собирает проекцию каталога для клиента из единственного источника — корневого
// galaxy-admin-data.json. Клиенту нужны только корабли, оборудование, ресурсы,
// категории, крепления, свойства и настройки: stellarSystems (426 КБ) не используются.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const source = path.resolve(clientRoot, '..', 'galaxy-admin-data.json');
const target = path.resolve(clientRoot, 'src', 'data', 'catalog.json');

const SECTIONS = [
    'format', 'version', 'settings', 'properties', 'slots',
    'ships', 'equipments', 'resources', 'categoriesEquipment', 'categoriesResource',
];

// В отдельном клоне клиента мастер-каталога рядом нет: остаётся уже собранная проекция.
if (!fs.existsSync(source)) {
    if (!fs.existsSync(target)) {
        throw new Error(`Нет ни мастер-каталога (${source}), ни проекции (${target})`);
    }
    console.warn(`Мастер-каталог не найден: ${source}`);
    console.warn('Используется ранее собранная проекция src/data/catalog.json');
    process.exit(0);
}

const full = JSON.parse(fs.readFileSync(source, 'utf8'));
const projection = {};
for (const section of SECTIONS) {
    if (full[section] === undefined) {
        throw new Error(`В ${source} нет раздела «${section}»`);
    }
    projection[section] = full[section];
}

fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, JSON.stringify(projection, null, 2) + '\n', 'utf8');

const size = (fs.statSync(target).size / 1024).toFixed(1);
console.log(`catalog.json обновлён из корневого каталога: ${size} КБ`);
