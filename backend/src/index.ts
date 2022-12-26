import type { ExtensionManager } from 'teletron';
import path from 'node:path';
import Debug from 'debug';
import { getCoreTranslations, getModuleTranslations } from './translations';
import assets from './assets';
import type { Request, Response } from 'express';

const debug = Debug('teletron:extensions:magic-mirror-wrapper');

export async function start(
  extension: string,
  teletron: ExtensionManager,
  moduleSourcePath: string
) {
  debug(
    'Magic Mirror Extension %s loading, using moduleSourcePath %s.',
    extension,
    moduleSourcePath
  );

  teletron.http.get('/module/:file', function (req: Request, res: Response) {
    res.sendFile(
      path.join(moduleSourcePath, req.params['file'] ?? ''),
      function (err) {
        if (err) {
          res.status(404).send('Not Found');
        }
      }
    );
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
