const {
  format,
  createLogger,
  transports
} = require('winston');
const {
  combine,
  timestamp,
  label,
  printf
} = format;
const moment = require('moment-timezone');

module.exports = function (module) {

  const logFormat = printf(({
    level,
    message,
    label,
    timestamp,
    stack
  }) => {
    return `[Harmony] ${timestamp} - [${level}]:[${label}] ${stack || message}`;
  });

  const timezoned = () => {
    return moment().tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD hh:mm:ss A z');
  }

  const logger = createLogger({
    level: 'debug',
    format: combine(
      format.colorize(),
      format.errors({
        stack: true
      }),
      timestamp({
        format: timezoned
      }),
      label({
        label: module
      }),
      logFormat
    ),
    transports: [
      // new transports.File({
      //   filename: './log/combined.txt',
      //   format: format.uncolorize()
      // }),
      new transports.Console()
    ],
    defaultMeta: {
      service: 'user-service'
    }
  });

  return logger;
}
