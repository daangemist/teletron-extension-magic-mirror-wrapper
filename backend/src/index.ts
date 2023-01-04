import type { ExtensionManager, BusMessage } from 'teletron';
import path from 'node:path';
import Debug from 'debug';
import {
  getCoreTranslations,
  getModuleTranslations,
  setCoreTranslationsLocation,
} from './translations';
import assets from './assets';
import type { Request, Response } from 'express';
import { loader, logger as LoggerToExport } from './node';
import * as NodeHelperToExport from './node/node-helper';
import { hasNodeHelper, checkBasePath } from './utils';

export const NodeHelper = NodeHelperToExport;
export const logger = LoggerToExport;

const debug = Debug('teletron:extensions:magic-mirror-wrapper');

export async function start(
  moduleName: string,
  extension: string,
  teletron: ExtensionManager,
  moduleSourcePath: string
) {
  debug(
    'Magic Mirror Extension %s loading, using moduleSourcePath %s.',
    extension,
    moduleSourcePath
  );

  if (await hasNodeHelper(moduleSourcePath)) {
    /**
     * The loading of nodehelpers is two-fold.
     * 1. We import node_helper.js from the module root.
     * 2. The node_helper.js will require a NodeHelper file, which it will use to register itself.
     */
    const nodeHelper = await loader(moduleName, moduleSourcePath, teletron);
    // listener to bus messages for magicmirror
    teletron.messages.subscribe((message: BusMessage) => {
      debug(`Incoming message ${message.key}`);
      nodeHelper.sendSocketNotification(message.key, message.payload);
    });
  }

  setCoreTranslationsLocation(
    path.join(__dirname, '../magic-mirror/translations'),
    'en'
  );

  // We use a * here so that we also capture paths, such as faces/012.svg
  teletron.http.get('/module/*', function (req: Request, res: Response) {
    const fileLocation = path.join(moduleSourcePath, req.params[0] ?? '');

    checkBasePath(fileLocation, moduleSourcePath);

    res.sendFile(fileLocation, function (err) {
      if (err) {
        res.status(404).send('Not Found');
      }
    });
  });

  teletron.http.get(
    '/translations/core',
    async (_req: Request, res: Response) => {
      const coreTranslations = await getCoreTranslations();
      res.json({ data: coreTranslations });
    }
  );
  teletron.http.get(
    '/translations/module',
    async (_req: Request, res: Response) => {
      const moduleTranslations = await getModuleTranslations(moduleSourcePath);
      res.json({ data: moduleTranslations });
    }
  );

  assets(teletron.http, teletron.extensionPath, moduleSourcePath);
}
