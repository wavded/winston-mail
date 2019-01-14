/*
 * winston-mail.js: Transport for outputting logs to email.
 *
 * (C) 2016 Marc Harter
 * MIT LICENCE
 */

var util = require('util')
var os = require('os')
var email = require('emailjs')
var winston = require('winston')
var mustache = require('mustache')

/**
 * @constructs Mail
 * @param {object} options Hash of options.
 */
var Mail = exports.Mail = function(options) {
  options = options || {}

  winston.Transport.call(this, options);

  if (!options.to) {
    throw new Error("winston-mail requires 'to' property")
  }

  this.name = options.name || 'mail'
  this.to = options.to
  this.from = options.from || 'winston@' + os.hostname()
  this.level = options.level || 'info'
  this.unique = options.unique || false
  this.silent = options.silent || false
  this.filter = options.filter || false
  this.subject = options.subject || 'winston: {{level}} {{msg}}'
  this.html = options.html || false // Send mail in html format
  this.formatter = options.formatter || false

  this.handleExceptions = options.handleExceptions || false
  this.server = email.server.connect({
    user            : options.username,
    password        : options.password,
    port            : options.port,
    host            : options.host,
    ssl             : options.ssl || options.secure,
    tls             : options.tls,
    timeout         : options.timeout,
    authentication  : options.authentication,
  })
}

/** @extends winston.Transport */
util.inherits(Mail, winston.Transport)

/**
 * Define a getter so that `winston.transports.Mail`
 * is available and thus backwards compatible.
 */
winston.transports.Mail = Mail

/**
 * Core logging method exposed to Winston. Metadata is optional.
 * @function log
 * @member Mail
 * @param arg0 winston < 3 {string} Level at which to log the message.
               winston >= 3 {Object} {level, message, meta} Info about log
 * @param arg1 winston < 3 {string} Message to log.
               winston >= 3 {function} Continuation to respond to when complete.
 * @param arg2 winston < 3 {?Object} Additional metadata to attach.
               winston >= 3 undefined
 * @param arg3 winston < 3 {function} Continuation to respond to when complete.
               winston >= 3 undefined
 */
Mail.prototype.log = function(arg0, arg1) {
  // get winston version to create tests accordingly
  var winstonVersion = winston.version,
      majorWVersion = winstonVersion.split('.')[0],
      self = this;

  var callback, level, msg, meta, info;

  if (majorWVersion >= 3 ) {
    // in version above 3 we have only 2 parameters: info and callback;
    info = arg0;

    callback = arg1;
    level = info.level;
    msg = info.message || '';
    meta = info.meta;
  } else {
    level = arg0;
    msg = arg1;
    meta = arguments[2];
    callback = arguments[3];
    info = {
      level: level,
      message: msg,
      meta: meta,
    };
  }

  if (this.silent) return callback(null, true)
  if (this.unique && this.level != level) return callback(null, true)
  if (this.filter && !this.filter(info)) return callback(null, true)

  if (this.formatter) {
    var body = this.formatter(info)
  } else {
    var body = msg

    // Convert meta to string if it is an error.
    if (meta instanceof Error) {
      meta = {
        message: meta.message,
        name: meta.name,
        stack: meta.stack,
      }
    }

    // Add meta info into the body if not empty.
    if (meta !== null && meta !== undefined && (typeof meta !== 'object' || Object.keys(meta).length > 0))
      body += '\n\n' + util.inspect(meta, {depth: 5}) // Add some pretty printing.
  }

  var msgOptions = {
    from: this.from,
    to: this.to,
    subject: mustache.render(this.subject, {level: level, msg: msg.split('\n')[0]}),
    text: body,
  }

  // Send mail as html.
  if (this.html) {
    msgOptions.attachment = [{data: body , alternative:true}]
  }

  var message = email.message.create(msgOptions)

  this.server.send(message, function(err) {
    if (err) self.emit('error', err)
    self.emit('logged')

    try {
      callback(null, true)
    } catch (e) {
      console.error(e)
    }
  })
}
