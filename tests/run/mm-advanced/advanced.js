Module.register('advanced', {
  start: function () {
    Log.info('advanced started!');
  },

  // A vendor style
  getStyles: function () {
    return ['weather-icons.css'];
  },

  getTemplate: function () {
    return 'template.njk';
  },

  getTemplateData: function () {
    return this.config;
  },
});
