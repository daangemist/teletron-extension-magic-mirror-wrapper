import type { WebStart } from 'teletron';

/**
 * Loads the main file for each module.
 * @param webStart
 * @param modules
 */
export default async function (webStart: WebStart, modules: string[]) {
  const promises: Promise<void>[] = [];

  modules.forEach((module) => {
    const p: Promise<void> = new Promise((resolve) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = `${webStart.http.PREFIX}/module/${module}.js`;
      scriptElement.type = 'text/javascript';
      scriptElement.onload = () => resolve();
      document.body.appendChild(scriptElement);
    });
    promises.push(p);
  });

  await Promise.all(promises);
}
