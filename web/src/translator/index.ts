import { debugLog } from '../log';

class Translator {
  constructor(
    private coreTranslations: Record<string, string>,
    private moduleTranslations: Record<string, string>
  ) {}

  public translate(
    key: string,
    variables?: Record<string, any>
  ): undefined | string {
    const moduleTranslation = this.findTranslation(
      this.moduleTranslations,
      key,
      variables
    );
    if (typeof moduleTranslation === 'string') {
      return moduleTranslation;
    }

    const coreTranslation = this.findTranslation(
      this.coreTranslations,
      key,
      variables
    );
    if (typeof coreTranslation === 'string') {
      return coreTranslation;
    }

    debugLog('Could not find translation', key);
    return undefined;
  }

  private findTranslation(
    translations: Record<string, string>,
    key: string,
    variables?: Record<string, any>
  ): string | undefined {
    if (typeof translations[key] === 'string') {
      const translation = translations[key] ?? '';

      const vars = variables || {};
      return translation.replace(
        new RegExp('{([^}]+)}', 'g'),
        function (_unused: string, varName: string) {
          return varName in vars ? vars[varName] : '{' + varName + '}';
        }
      );
    }
    return undefined;
  }
}

export default Translator;
