// Словари языков лежат по файлу на язык и грузятся по требованию: раньше все 45
// висели одним объектом в главном чанке (225 КБ), хотя игроку нужен ровно один.
// en держим статически — он же синхронный фолбэк для ключей без перевода.
import en from "../translations/en.js";

const dictionaryLoaders = import.meta.glob("../translations/*.js");
const dictionaries = { en };

export const loadDictionary = async (lang) => {
  if (dictionaries[lang]) return dictionaries[lang];

  const loader = dictionaryLoaders[`../translations/${lang}.js`];
  if (!loader) return en;

  try {
    const module = await loader();
    dictionaries[lang] = module.default;
  } catch {
    return en;
  }

  return dictionaries[lang];
};

// Синхронный доступ: словарь уже в памяти либо падаем на en
export const translate = (lang, key) => dictionaries[lang]?.[key] ?? en[key];
