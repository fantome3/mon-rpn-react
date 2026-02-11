import fs from 'fs'
import path from 'path'
import util from 'util'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logDir = path.resolve(process.cwd(), 'logs')

const logFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
  const base = `${timestamp} [${level}]`
  if (stack) return `${base} ${stack}`
  return `${base} ${message}`
})

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM',
      maxFiles: '24m',
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: '%DATE%.error.log',
      datePattern: 'YYYY-MM',
      level: 'error',
      maxFiles: '24m',
    }),
    new winston.transports.Console(),
  ],
})

export const initLogger = (): void => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // Redirect console output to winston so existing logs go to files.
  console.log = (...args: unknown[]) => {
    logger.info(util.format(...args))
  }
  console.info = (...args: unknown[]) => {
    logger.info(util.format(...args))
  }
  console.warn = (...args: unknown[]) => {
    logger.warn(util.format(...args))
  }
  console.error = (...args: unknown[]) => {
    logger.error(util.format(...args))
  }
  console.debug = (...args: unknown[]) => {
    logger.debug(util.format(...args))
  }
}
