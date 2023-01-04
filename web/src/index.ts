import type { WebStart, BusMessage } from 'teletron';
import moduleWrapper from './components/module-wrapper';
import './module';
import './class';
import { setWebStart } from './web-start';
import { loader } from './module';
import './assets/magicmirror.css';
import { debugLog } from './log';

// @ts-expect-error
window.config = {
  // TODO think of a way to set these global magicmirror configures values dynamically
  language: 'en',
  logLevel: ['INFO', 'LOG', 'WARN', 'ERROR'],
  timeFormat: 24,
  units: 'metric',
};

export async function start(
  teletron: WebStart,
  componentName: string,
  module: string
) {
  debugLog('Starting Magic Mirror module initialization for', module);
  setWebStart(module, teletron);
  await loader(teletron, [module]);
  teletron.registerComponent(componentName, moduleWrapper);

  const [dispatch] = teletron.messages.subscribe((message: BusMessage) => {
    // @ts-expect-error window.Module is not normally registered
    window.Module.triggerSocketNotification(message.key, message.payload);
  });
  // @ts-expect-error window.Module is not normally registered
  window.Module.setSocketDispatch(dispatch);
}
