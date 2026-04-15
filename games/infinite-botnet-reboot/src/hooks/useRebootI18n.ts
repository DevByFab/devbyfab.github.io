import frCatalog from '../../../../i18n/fr.json';

type TranslationVars = Record<string, string | number>;
type TranslationCatalog = Record<string, string>;

const catalog = frCatalog as TranslationCatalog;

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) => {
    const value = vars[token];
    if (value === undefined || value === null) {
      return '{' + token + '}';
    }

    return String(value);
  });
}

export interface RebootI18n {
  t: (key: string, vars?: TranslationVars) => string;
}

export function useRebootI18n(): RebootI18n {
  const t = (key: string, vars?: TranslationVars): string => {
    const value = catalog[key] ?? key;
    return interpolate(value, vars);
  };

  return { t };
}
