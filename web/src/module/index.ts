import { nanoid } from 'nanoid';
import nunjucks, { Environment } from 'nunjucks';
import type { ModuleProperties } from '../types';
import Translator from '../translator';
import { getWebStart } from '../web-start';
import mmLoader from './loader';
import { debugLog } from '../log';

export enum ModuleNotifications {
  ALL_MODULES_STARTED = 'ALL_MODULES_STARTED',
  DOM_OBJECTS_CREATED = 'DOM_OBJECTS_CREATED',
  MODULE_DOM_READY = 'MODULE_DOM_READY',
}

export const loader = mmLoader;

const vendorScriptsAndStyles = {
  'moment.js': 'node_modules/moment/min/moment-with-locales.js',
  'moment-timezone.js':
    'node_modules/moment-timezone/builds/moment-timezone-with-data.js',
  'weather-icons.css': 'node_modules/weathericons/css/weather-icons.css',
  'weather-icons-wind.css':
    'node_modules/weathericons/css/weather-icons-wind.css',
  'font-awesome.css': 'css/font-awesome.css',
  'nunjucks.js': 'node_modules/nunjucks/browser/nunjucks.min.js',
  'suncalc.js': 'node_modules/suncalc/suncalc.js',
};
const vendors = Object.keys(vendorScriptsAndStyles);

const loadedScriptsGlobally: string[] = [];

// The script that is currently being loaded via a script tag. The value is its scriptId.
let pendingScript: string | undefined = undefined;

// We need to load the scripts one-by-one. Else moment-timezone could be loaded before moment for example, and throw an error.
const queuedScripts: { script: string; moduleName: string }[] = [];

// Every initializing module is going to register a callback to be able to determine when all of its script files are loaded.
const scriptIsLoadedCallbacks: Record<
  string,
  (scriptId: string, unsubscribe: () => void) => void
> = {};

// Loads the next script from the queue.
function processNextScriptIfNecessary(): void {
  if (pendingScript) {
    debugLog(
      'There is already a pending script, no need to set one to processing.'
    );
    return;
  }

  const queuedScript = queuedScripts.shift();
  if (queuedScript) {
    debugLog('Queueing a script.', queuedScript.script);
    loadScript(queuedScript.script, queuedScript.moduleName);
  } else {
    debugLog('There was no script left to queue.');
  }
}

function addScriptLoadCallback(
  callback: (scriptId: string, unsubscribe: () => void) => void
): () => void {
  const id = nanoid();
  scriptIsLoadedCallbacks[id] = callback;
  // Return the unsubscribe function for the callback.
  return () => delete scriptIsLoadedCallbacks[id];
}

function triggerScriptIsLoadedCallback(scriptId: string): void {
  // Trigger the callback with a scriptId, and an unsubscribe function with which the callback can be removed.
  Object.entries(scriptIsLoadedCallbacks).forEach(([id, callback]) =>
    callback(scriptId, () => delete scriptIsLoadedCallbacks[id])
  );
}

function generateScriptId(script: string, moduleName: string): string {
  return vendors.includes(script)
    ? `mmjs/vendor/${script}`
    : `${moduleName}/${script}`;
}

/**
 * Warning, some complex code ahead.
 * Because different modules can reference the same script (moment.js for example), we needed a central queue
 * for scripts.
 * @param script
 * @param _moduleName
 * @param callback
 */
function loadScript(script: string, moduleName: string): void {
  const scriptId = generateScriptId(script, moduleName);
  debugLog(
    'Received request to load script:',
    script,
    moduleName,
    'id: ',
    scriptId
  );

  // the script is already loaded
  if (loadedScriptsGlobally.includes(scriptId)) {
    debugLog(scriptId, 'is already present in the list of loaded scripts.');
    triggerScriptIsLoadedCallback(scriptId);

    processNextScriptIfNecessary();
    return;
  }

  if (pendingScript) {
    // There is already a script loading, and we know it's not this script, so queue this load request.
    if (
      !queuedScripts.find(
        (queuedScript) =>
          queuedScript.script === script && moduleName === moduleName
      )
    ) {
      // Only queue if its not already in the queue.
      queuedScripts.push({ script, moduleName });
    }
    return;
  }

  const insertScript = (src: string): void => {
    if (!document.body) {
      debugLog('document.body not set yet, trying it again later.');
      setTimeout(() => insertScript(src), 100);
      return;
    }
    debugLog('adding', src);

    const scriptElement = document.createElement('script');
    scriptElement.src = src;
    scriptElement.type = 'text/javascript';
    scriptElement.id = scriptId;

    scriptElement.onload = () => {
      debugLog('loaded', scriptId);
      loadedScriptsGlobally.push(scriptId);

      // Clear the pending script.
      pendingScript = undefined;

      // Trigger the script listeners
      triggerScriptIsLoadedCallback(scriptId);

      // Queue the next script, if there are scripts left to load.
      processNextScriptIfNecessary();
    };
    document.body.appendChild(scriptElement);
  };

  // This is the first module requesting the script (and nothing is pending), append it to the body and queue for the onload.
  pendingScript = scriptId;
  if (vendors.includes(script)) {
    insertScript(`${getWebStart().http.PREFIX}/vendor/${script}`);
  } else {
    // the script is a module script.
    insertScript(`${getWebStart().http.PREFIX}/module/${script}`);
  }
}

export class Module {
  private moduleDefinition: ModuleProperties;
  private config = {};
  private scriptsAreLoaded: boolean = false;
  private domListener: (() => void) | undefined;
  public data: Record<string, any> = {};
  private _nunjucksEnvironment?: Environment;
  private uniqueIdentifier: string;
  // We use this to be able to return a promise in initAndStart when initialization is done.
  private initializationReadyCallback: (() => void) | undefined = undefined;

  constructor(
    private name: string,
    moduleDefinition: ModuleProperties,
    private translator: Translator,
    private notificationDispatch: (
      notification: string,
      payload: any,
      sender?: Module
    ) => void,
    private socketNotificationDispatch: (
      notification: string,
      payload: any
    ) => void
  ) {
    this.moduleDefinition = moduleDefinition;
    this.uniqueIdentifier = `${this.name}-${nanoid()}`;
    // Bind the module functions correctly, with the right scope.
    Object.entries(moduleDefinition).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'function') {
        debugLog('Binding this to', key);
        this.moduleDefinition[key] = value.bind(this);
      }
    });

    if (moduleDefinition.defaults) {
      this.config = { ...(moduleDefinition.defaults || {}), ...this.config };
    }

    // If there is a loaded function in the module definition, invoke. For us its a noop, since the implementation
    // is different than in MagicMirror.
    if (this.moduleDefinition['loaded']) {
      this.moduleDefinition['loaded'](() => {});
    }
  }

  // Is only to be invoked by the window.Module.getNewlyInitializedModule function.
  public setConfig(config: Record<string, any>): void {
    this.config = { ...(this.moduleDefinition.defaults || {}), ...config };
    this.data = {
      ...this.config, // is required by MM
      classes:
        typeof config['classes'] !== 'undefined'
          ? config['classes'] + ' ' + this.name
          : this.name,
      path: `${getWebStart().http.PREFIX}/module`,
    };
    this.uniqueIdentifier = `${this.uniqueIdentifier}-${config['type']}`;
  }

  public getTemplate(): string {
    return '';
  }

  public getTemplateData(): Record<string, any> {
    return {};
  }

  public getModuleDom(): Promise<HTMLElement> {
    if (!this.scriptsAreLoaded) {
      return Promise.reject(new Error('DOM is not yet initialized.'));
    }
    if (this.moduleDefinition.getDom) {
      debugLog('DOM already exists.', this.uniqueIdentifier);
      return Promise.resolve(this.moduleDefinition.getDom());
    }

    return new Promise((resolve, reject) => {
      // default DOM behavior when module does not define it, taken from magicmirror: https://github.com/MichMich/MagicMirror/blob/master/js/module.js#L83
      const div = document.createElement('div');
      const template = this.getTemplate();

      const templateData = this.getTemplateData();

      debugLog('Rendering a template', template, this.uniqueIdentifier);

      // Check to see if we need to render a template string or a file.
      if (/^.*((\.html)|(\.njk))$/.test(template)) {
        // the template is a filename
        this.nunjucksEnvironment().render(
          template,
          templateData,
          function (err, res) {
            if (err) {
              console.error(err);
              reject(err);
            }

            div.innerHTML = res as string;
            resolve(div);
          }
        );
      } else {
        // the template is a template string.
        div.innerHTML = this.nunjucksEnvironment().renderString(
          template,
          templateData
        );
        resolve(div);
      }
    });
  }

  public initAndStart(): Promise<void> {
    const styles = this.moduleDefinition.getStyles
      ? this.moduleDefinition.getStyles()
      : [];
    const scripts = this.moduleDefinition.getScripts
      ? this.moduleDefinition.getScripts()
      : [];

    if (!document.head) {
      console.error('document.head was not set. Aborting.');
      return Promise.resolve();
    }

    // This promise will be returned to any requesting function. It will be resolved once all scripts are loaded
    // and initialization is done.
    // In continueAndStart the initializationReadyCallback will be invoked, resolving the promise.
    const resultPromise = new Promise<void>((resolve) => {
      this.initializationReadyCallback = () => {
        resolve();
      };
    });

    // First add all CSS
    const vendors = Object.keys(vendorScriptsAndStyles);
    if (Array.isArray(styles)) {
      styles.forEach((stylesheet: string) => {
        const stylesheetId = `mmstyle/vendor/${stylesheet}`;
        if (
          vendors.includes(stylesheet) &&
          !document.getElementById(stylesheetId)
        ) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `${
            getWebStart().http.PREFIX
          }/assets/vendor/${stylesheet}`;
          link.type = 'text/css';
          link.id = stylesheetId;
          document.head.appendChild(link);
        } else if (!vendors.includes(stylesheet)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `${getWebStart().http.PREFIX}/module/${stylesheet}`;
          link.type = 'text/css';
          link.id = stylesheetId;
          document.head.appendChild(link);
        }
      });
    }

    /* Load all scripts for the module, if needed. */

    if (!Array.isArray(scripts) || scripts.length === 0) {
      // no scripts to load, continue
      this.continueInitAndStart();
      return resultPromise;
    }

    // Determine all scriptIds we are interesting in.
    const moduleScriptIds = scripts.map((script) =>
      generateScriptId(script, this.name)
    );

    // Initialize the register for scripts this module wants that are already loaded.
    const loadedScriptsForModule = loadedScriptsGlobally.filter(
      (scriptId) => moduleScriptIds.indexOf(scriptId) !== -1
    );
    debugLog(
      'Loading started with',
      loadedScriptsForModule,
      'out of',
      moduleScriptIds,
      this.uniqueIdentifier
    );

    if (loadedScriptsForModule.length === scripts.length) {
      debugLog('All scripts are already loaded.', this.uniqueIdentifier);
      // All the scripts are already there.
      this.continueInitAndStart();
      return resultPromise;
    }

    /* Add a callback for this module, where it can check every time if all scripts we need are loaded. */
    addScriptLoadCallback((scriptId, unsubscribe) => {
      debugLog('Script loaded callback.', scriptId, this.uniqueIdentifier);
      if (
        moduleScriptIds.indexOf(scriptId) !== -1 &&
        loadedScriptsForModule.indexOf(scriptId) === -1
      ) {
        loadedScriptsForModule.push(scriptId);
        debugLog(
          'Found a script that we need.',
          scriptId,
          this.uniqueIdentifier,
          loadedScriptsForModule.length,
          '/',
          scripts.length
        );
      }

      if (loadedScriptsForModule.length === scripts.length) {
        debugLog('We have all scripts that we need.', this.uniqueIdentifier);
        unsubscribe(); // no longer receive the callbacks if a script is loaded.
        this.continueInitAndStart();
      }
    });

    scripts.forEach((script: string) => {
      loadScript(script, this.name);
    });
    return resultPromise;
  }

  /**
   * The method that continues all initialization when all (external) scripts have been loaded.
   */
  private continueInitAndStart(): void {
    this.scriptsAreLoaded = true;
    if (this.moduleDefinition['init']) {
      this.moduleDefinition['init']();
    }

    if (this.moduleDefinition.start) {
      this.moduleDefinition.start();
    } else {
      debugLog('Module has no start method: ', this.name);
    }
    if (this.initializationReadyCallback) {
      debugLog('Resolving initAndStart promise.');
      this.initializationReadyCallback();
    } else {
      throw new Error(
        'There was no initAndStart callback to invoke. Was continueInitAndStart() invoked before initAndStart()?'
      );
    }

    this.triggerNotification(
      ModuleNotifications.ALL_MODULES_STARTED,
      undefined
    );
    this.triggerNotification(
      ModuleNotifications.DOM_OBJECTS_CREATED,
      undefined
    );
  }

  public registerDomListener(callback: () => void): void {
    const id = nanoid();
    debugLog('Registering listener', id, 'in', this.uniqueIdentifier);
    this.domListener = callback;
  }

  /**
   * Is invoked by modules when they want to update themselves.
   * Speed, which is a function argument in magic mirror, is ignored for now.
   */
  public updateDom() {
    if (!this.domListener) {
      throw new Error(
        `There is no domListener registered to request a DOM update at, ${this.uniqueIdentifier}`
      );
    }

    // debugLog('Requesting dom update for', this.uniqueIdentifier);
    this.domListener();
  }

  /**
   *
   * @param notification The notification identifier.
   * @param payload The payload of the notification.
   * @param sender Module - the sender of the notification. If left empty, the sender is the core system.
   */
  public triggerNotification(
    notification: string,
    payload: any,
    sender?: object
  ) {
    if (this.moduleDefinition.notificationReceived) {
      this.moduleDefinition.notificationReceived(notification, payload, sender);
    }
  }

  public triggerSocketNotificationReceived(notification: string, payload: any) {
    if (this.moduleDefinition.socketNotificationReceived) {
      this.moduleDefinition.socketNotificationReceived(notification, payload);
    }
  }

  public hide() {
    // TODO - implement it
    console.log('Module', this.name, 'requested to be hidden.');
  }

  /**
   * @param {string} key The key of the string to translate
   * @param {string|object} [defaultValueOrVariables] The default value or variables for translating.
   * @param {string} [defaultValue] The default value with variables.
   * @returns {string} the translated key
   */
  public translate(
    key: string,
    defaultValueOrVariables: string | object,
    defaultValue?: string
  ) {
    if (typeof defaultValueOrVariables === 'object') {
      return (
        this.translator.translate(key, defaultValueOrVariables) ||
        defaultValue ||
        key
      );
    }
    return this.translator.translate(key) || defaultValueOrVariables || key;
  }

  public show() {
    // TODO implement it
    console.log('Module', this.name, 'requested to be shown.');
  }

  // send a notification, to the other mm modules
  public sendNotification(notification: string, payload: any) {
    this.notificationDispatch(notification, payload, this);
  }

  public sendSocketNotification(notification: string, payload: any) {
    debugLog(this.name, 'attempted to send SOCKET notification:', {
      notification,
      payload,
    });
    this.socketNotificationDispatch(notification, payload);
  }

  public file(file: string): string {
    if (file.match(/\.(js|css)$/)) {
      // loadScript() will prefix the file with the correct URL.
      return file.replace('//', '/');
    }
    return `${this.data['path'] || ''}${file}`.replace('//', '/');
  }

  /**
   * Returns the nunjucks environment for the current module.
   * The environment is checked in the _nunjucksEnvironment instance variable.
   *
   * @returns {object} The Nunjucks Environment
   */
  public nunjucksEnvironment(): Environment {
    if (this._nunjucksEnvironment) {
      return this._nunjucksEnvironment;
    }

    debugLog('Initializing new nunjucks environment.');
    this._nunjucksEnvironment = new nunjucks.Environment(
      new nunjucks.WebLoader(`${getWebStart().http.PREFIX}/module/`, {
        async: true,
      }),
      {
        trimBlocks: true,
        lstripBlocks: true,
      }
    );

    this._nunjucksEnvironment.addFilter('translate', (str, variables) => {
      // @ts-expect-error MagicMirror does this.
      return nunjucks.runtime.markSafe(this.translate(str, variables));
    });

    return this._nunjucksEnvironment;
  }

  public suspend(): void {
    if (this.moduleDefinition.suspend) {
      this.moduleDefinition.suspend();
    }
  }
}

const pendingModuleRegistrations: Record<
  string,
  Array<(module: Module) => void>
> = {};

/** We register a global Module class, which MagicMirror modules will use to register themselves. */
// @ts-expect-error TS warn on setting a global.
window.Module = (() => {
  const registeredModules: Record<string, ModuleProperties> = {};
  const initializedModules: Module[] = [];
  let socketDispatch: undefined | ((key: string, payload: any) => void);
  let coreTranslations: Record<string, string> | undefined;

  function register(name: string, moduleDefinition: ModuleProperties) {
    debugLog('Registering a new module', name, moduleDefinition);
    registeredModules[name] = moduleDefinition;
    if (Array.isArray(pendingModuleRegistrations[name])) {
      const callbacks = pendingModuleRegistrations[name] ?? [];
      delete pendingModuleRegistrations[name];
      callbacks.forEach((callback) =>
        // @ts-expect-error We know here the the module has been made available, and a Module is returned, not a promise.
        callback(getNewlyInitializedModule(name))
      );
    }
  }

  async function getTranslatorForModule(
    moduleName: string
  ): Promise<Translator> {
    debugLog('Fetching translations for module', moduleName);
    // See if the core Translations have been fetched before, if not, fetch them.
    if (typeof coreTranslations === 'undefined') {
      debugLog('Additionally fetching translations for core');
      coreTranslations = {}; // Its no longer undefined, so another module won't fetch them.
      const { data } = await getTranslations('core');
      coreTranslations = data;
    }

    const { data: moduleTranslations } = await getTranslations(moduleName);
    debugLog(
      'Initialization translator',
      moduleName,
      coreTranslations,
      moduleTranslations
    );
    return new Translator(coreTranslations, moduleTranslations);
  }

  async function getTranslations(
    moduleName: string
  ): Promise<{ data: Record<string, string> }> {
    try {
      const translations = await getWebStart().http.get<{
        data: Record<string, string>;
      }>('/translations/module');
      return translations;
    } catch (error) {
      console.error('Unable to fetch translations.', moduleName, error);
      return { data: {} };
    }
  }

  async function createModule(
    name: string,
    configuration: any
  ): Promise<Module> {
    if (!registeredModules[name]) {
      // The module is not registered yet, return a promise and register a callback to be fulfilled later.
      debugLog(
        'The module',
        name,
        ' is not registered yet, returning a promise to be resolved later when its available.'
      );
      return new Promise((resolve, _reject) => {
        const callback = (module: Module) => {
          debugLog('Resolving module.', name);
          resolve(module);
        };
        if (!Array.isArray(pendingModuleRegistrations[name])) {
          pendingModuleRegistrations[name] = [];
        }
        // @ts-ignore We know that pendingModuleRegistrations[name] is an array.
        pendingModuleRegistrations[name].push(callback);
      });
    }

    debugLog('Creating new module', name);
    const moduleDefinition = registeredModules[name] ?? {};

    const module = new Module(
      name,
      { ...moduleDefinition }, // We are binding all registered functions to the module, so we need a unique function per initialized module.
      await getTranslatorForModule(name),
      triggerNotification,
      (notification: string, payload: any) => {
        if (!socketDispatch) {
          throw new Error('Socket dispatch was not set.');
        }
        socketDispatch(notification, payload);
      }
    );
    Object.entries(moduleDefinition).forEach(([key, value]: [string, any]) => {
      // @ts-expect-error
      module[key] = value;
    });
    module.setConfig(configuration);
    await module.initAndStart();

    initializedModules.push(module);
    return module;
  }

  function triggerNotification(
    notification: string,
    payload: any,
    sender?: Module
  ) {
    initializedModules.forEach((module) => {
      module.triggerNotification(notification, payload, sender);
    });
  }

  function triggerSocketNotification(notification: string, payload: any) {
    debugLog('Received socket notification', notification, payload);
    initializedModules.forEach((module) => {
      module.triggerSocketNotificationReceived(notification, payload);
    });
  }

  function setSocketDispatch(dispatch: (key: string, payload: any) => void) {
    socketDispatch = dispatch;
  }

  return {
    register,
    createModule,
    triggerSocketNotification,
    setSocketDispatch,
  };
})();

// @ts-expect-error Define the magic mirror console wrapper
window.Log = console;
