const express = require('express');
const path = require('node:path');
const wrapperBackend = require('../../backend/build');

async function start() {
  const app = express();

  const simpleModuleRouter = express.Router();

  await wrapperBackend.start(
    'simple',
    {
      http: simpleModuleRouter,
      extensionPath: path.join(__dirname, '../../backend'),
    },
    path.join(__dirname, 'mm-simple')
  );

  app.use('/extensions/simple', simpleModuleRouter);
  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.use('/assets', express.static(__dirname));
  app.use(
    '/build-web',
    express.static(path.join(__dirname, '../../', 'web/build'))
  );

  app.listen(process.env.PORT ?? 3000);
  console.log('Magic Mirror Wrapper test app running on http://localhost:3000');
  console.log('Wrapper endpoints listening on /wrapper');
}
start();
