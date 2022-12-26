/**
 * A simple simulation of a Magic Mirror Module, using only web, no node-helpers.
 */
Log.info('Opened simple.js, starting registration.');
Module.register('simple', {
  defaults: {
    foo: 'bar',
  },

  // Define required scripts.
  getScripts: function () {
    return ['moment.js'];
  },
  // Define styles.
  getStyles: function () {
    return ['simple_styles.css'];
  },

  start: function () {
    Log.info('Starting module: ' + this.name);

    setInterval(() => {
      this.updateDom();
    }, 5000);
  },

  getDom() {
    const wrapper = document.createElement('div');
    const highlight = document.createElement('div');
    highlight.classList.add('highlight');
    highlight.innerHTML = 'Highlighted text.';

    const second = document.createElement('div');
    second.innerHTML = 'Second (MM style): ' + moment().second();
    second.classList.add('bright', 'large', 'light'); // MM specific styles

    wrapper.append(highlight);
    wrapper.append(second);

    return wrapper;
  },
});
