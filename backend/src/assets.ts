import type express from 'express';
import path from 'path';
import Debug from 'debug';
import { sendFileWithFallback } from './utils';

const debug = Debug('teletron:extensions:magic-mirror-wrapper:assets');

const vendorScriptsAndStyles: Record<string, string> = {
  'moment.js': 'node_modules/moment/min/moment-with-locales.js',
  'moment-timezone.js':
    'node_modules/moment-timezone/builds/moment-timezone-with-data.js',
  'weather-icons.css': 'node_modules/weathericons/css/weather-icons.css',
  'weather-icons-wind.css':
    'node_modules/weathericons/css/weather-icons-wind.css',
  'font-awesome.css':
    'node_modules/@fortawesome/fontawesome-free/css/fontawesome.css',
  'nunjucks.js': 'node_modules/nunjucks/browser/nunjucks.min.js',
  'suncalc.js': 'node_modules/suncalc/suncalc.js',
};

const assets = (
  router: express.Router,
  extensionPath: string,
  moduleSourcePath: string
) => {
  const extensionBaseFolder = path.join(__dirname, '../../../../');
  debug('Initializing extensions assets.', extensionPath, moduleSourcePath);

  const returnFile: any =
    (file: string) => async (_req: express.Request, res: express.Response) => {
      debug('Attempting to load file', file);
      await sendFileWithFallback(
        res,
        extensionBaseFolder,
        extensionPath,
        vendorScriptsAndStyles[file] ?? ''
      );
    };
  Object.keys(vendorScriptsAndStyles).forEach((file: string) => {
    router.get(`/vendor/${file}`, returnFile(file, true));
  });

  // weathericons specific hack for font files
  router.get(
    '/font/:file',
    async (req: express.Request, res: express.Response) => {
      const { file } = req.params;
      if (!file || !file.match(/^weathericons/i)) {
        res.status(404).json({ message: 'Not Found' });
        return;
      }

      await sendFileWithFallback(
        res,
        extensionBaseFolder,
        extensionPath,
        path.join('node_modules/weathericons/font', req.params['file'] ?? '')
      );
    }
  );
};

export default assets;
