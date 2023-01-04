import path from 'node:path';
import type { ExtensionManager } from 'teletron';
import Debug from 'debug';

const debug = Debug('teletron:extensions:magic-mirror-wrapper:loader');

export async function loader(
  moduleName: string,
  moduleSourcePath: string,
  teletron: ExtensionManager
): Promise<any> {
  try {
    // import the modules' node_helper, which will import the helper.ts class
    const nodeHelperPath = path.join(moduleSourcePath, 'node_helper.js');
    debug('About to import node_helper from', nodeHelperPath);
    const { default: nodeHelper } = await import(nodeHelperPath);

    nodeHelper.setName(moduleName);
    nodeHelper.setPath(moduleSourcePath);
    nodeHelper.setRouter(teletron.http);

    nodeHelper.setSocketDispatch(teletron.messages.dispatch);

    nodeHelper.startHelper();
  } catch (error) {
    console.error('Unable to import node_helper for', moduleName, error);
  }
}
