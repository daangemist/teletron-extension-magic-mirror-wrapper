const express = require('express');
const path = require('node:path');
const wrapperBackend = require('../../backend/build');

async function start() {
  const app = express();

  const simpleModuleRouter = express.Router();
  const advancedModuleRouter = express.Router();

  await wrapperBackend.start(
    'simple',
    'simple',
    {
      http: simpleModuleRouter,
      extensionPath: path.join(__dirname, '../../backend'),
      messages: {
        dispatch: (...args) => console.log('Simple messages dispatch', args),
        subscribe: () => console.log('Simple wrapper messages subscribe.'),
      },
    },
    path.join(__dirname, 'mm-simple')
  );
  await wrapperBackend.start(
    'advanced',
    'advanced',
    {
      http: advancedModuleRouter,
      extensionPath: path.join(__dirname, '../../backend'),
      messages: {
        dispatch: (...args) => console.log('Advanced messages dispatch', args),
        subscribe: () => console.log('Advanced wrapper messages subscribe.'),
      },
    },
    path.join(__dirname, 'mm-advanced')
  );

  app.use('/extensions/simple', simpleModuleRouter);
  app.use('/extensions/mm-advanced', advancedModuleRouter);
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
