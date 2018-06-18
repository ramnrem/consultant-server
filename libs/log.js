var winston = require('winston');
var ENV = 'development';


function getLogger(module) {

  var path = module.filename;

  return new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: (ENV == 'development') ? 'debug' : 'error',
      })
    ]
  });
}

module.exports = getLogger;