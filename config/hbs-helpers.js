const hbs = require('hbs');

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return arg1.toString() === arg2.toString() ? options.fn(this) : options.inverse(this);
});
