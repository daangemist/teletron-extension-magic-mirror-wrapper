import { promisify } from 'util';
import type { Response } from 'express';
import path from 'path';
import Debug from 'debug';

const debug = Debug('teletron:extensions:magic-mirror-wrapper:utils');

function checkBasePath(combinedPath: string, basePath: string): void {
  if (combinedPath.substring(0, basePath.length) !== basePath) {
    console.error('Basepath escaping detected.', basePath, combinedPath);
    throw new Error('Attempt at basepath escaping detected.');
  }
}

export async function sendFileWithFallback(
  res: Response,
  primaryLocation: string,
  fallbackLocation: string,
  filename: string
) {
  // @ts-expect-error Workaround, set as property of res so that correct `this` file is set.
  res.sendFilePromisified = promisify(res.sendFile);
  try {
    try {
      // first try the primary folder
      const combinedPath = path.join(primaryLocation, filename);
      checkBasePath(combinedPath, primaryLocation);
      debug('Attempting to serve file from %s', combinedPath);
      // @ts-expect-error Workaround so that correct `this` file is set.
      await res.sendFilePromisified(combinedPath);
    } catch (error) {
      // attempt at the fallback folder
      const combinedPath = path.join(fallbackLocation, filename);
      checkBasePath(combinedPath, fallbackLocation);

      debug(
        'Fallback, attempting to serve file from %s',
        path.join(fallbackLocation, filename)
      );
      // @ts-expect-error Workaround so that correct `this` file is set.
      await res.sendFilePromisified(path.join(fallbackLocation, filename));
    }
  } catch (error) {
    debug('Unable to serve file %s', filename);
    res.status(404).send('File not found.');
  }
}
