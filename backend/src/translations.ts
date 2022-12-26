import path from 'path';

let translationLocation = '';
let translationLanguage = '';
let loadTranslationsPromise: undefined | Promise<void> = undefined;

const translationsMap: Record<string, Record<string, string>> = {};

export const setCoreTranslationsLocation = (
  location: string,
  language: string
): void => {
  translationLocation = location;
  translationLanguage = language;

  loadTranslationsPromise = loadTranslations();
};

async function loadTranslations(): Promise<void> {
  try {
    const translationsPath = path.join(
      translationLocation,
      translationLanguage
    );
    const { default: fetchedTranslations } = await import(translationsPath);
    if (!fetchedTranslations) {
      console.log(
        'Translations',
        translationLanguage,
        'not found in language list',
        translationsPath
      );
      return;
    }

    translationsMap['core'] = fetchedTranslations;
  } catch (error) {
    console.error(
      'Cannot load magicMirror translations from',
      translationLocation,
      error
    );
  }
}

export const getCoreTranslations: () => Promise<
  Record<string, string>
> = async () => {
  if (!loadTranslationsPromise) {
    await loadTranslations();
  } else {
    await loadTranslationsPromise;
  }

  return translationsMap['core'] || {};
};

export const getModuleTranslations = async (
  moduleSourcePath: string
): Promise<Record<string, string>> => {
  if (translationsMap['module']) {
    return translationsMap['module'];
  }

  const translationPath = path.join(
    moduleSourcePath,
    'translations',
    `${translationLanguage}.json`
  );
  try {
    const { default: fetchedTranslations } = await import(translationPath);
    translationsMap['module'] = fetchedTranslations;
    return fetchedTranslations;
  } catch (error) {
    console.log(
      'Module translations were not found at location.',
      translationPath
    );
    translationsMap['module'] = {};
    return {};
  }
};
