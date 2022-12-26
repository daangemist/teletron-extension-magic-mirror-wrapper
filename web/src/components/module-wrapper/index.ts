import { debugLog } from '../../log';
import type { TeletronPropsComponent, RenderableReturn } from 'teletron';
import { Module, ModuleNotifications } from '../../module';

function getModuleName(componentType: string): string {
  const parts = componentType.split('.', 2); // e.g. magic-mirror.compliments
  if (parts.length !== 2) {
    throw new Error(`Invalid componentType ${componentType}.`);
  }
  return parts[1] ?? 'unknown';
}

export default function renderModule(
  parent: HTMLElement,
  { componentType, configuration }: TeletronPropsComponent
): RenderableReturn {
  let module: Module;

  parent.classList.add('mm-module');
  let isUnloaded = false;

  // It's possible that the module scripts are not loaded yet when this component wants to render, so we need to be able to retry.
  async function loadFirstDomVersion(initializedModule: Module) {
    // Fetch the first version of the DOM
    try {
      const moduleDomElement = await initializedModule.getModuleDom();
      if (isUnloaded) {
        // The module was already unloaded after initialized, so we don't append this child.
        debugLog(
          'The module was already unloaded after we retrieved the DOM, so we are ignored the retrieved elem.',
          moduleDomElement
        );
        return;
      }
      if (moduleDomElement) {
        parent.appendChild(moduleDomElement);
      }
      initializedModule.triggerNotification(
        ModuleNotifications.MODULE_DOM_READY,
        undefined
      );
    } catch (error) {
      console.log('Initial DOM update error; retrying.', error);
      setTimeout(() => loadFirstDomVersion(initializedModule), 250);
    }
  }

  debugLog('Invoking createModule', componentType, configuration);
  // @ts-expect-error Module is defined as a global, so accessible via the window variable.
  window.Module.createModule(
    getModuleName(componentType),
    configuration || {}
  ).then((initializedModule: Module) => {
    // Register the update function for when the DOM updates. It returns a callback to invoke when the component unmounts.
    initializedModule.registerDomListener(async () => {
      const newElement = await initializedModule.getModuleDom();
      if (!newElement && parent.children.length > 0) {
        // @ts-ignore We know that there are children, since we checked parent.children.length > 0
        parent.removeChild(parent.children[0]);
      } else {
        if (parent.children.length > 0) {
          // @ts-ignore We know that there are children, since we checked parent.children.length > 0
          parent.replaceChild(newElement, parent.children[0]);
        } else {
          parent.appendChild(newElement);
        }
      }
    });
    module = initializedModule;
    loadFirstDomVersion(initializedModule);
  });

  return {
    unmount: () => {
      isUnloaded = true;
      module?.suspend();
      // remove all rendered HTML
      parent.innerHTML = '';
    },
  };
}
