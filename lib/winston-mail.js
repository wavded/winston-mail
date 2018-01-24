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
 * For Winston 3+
 * @param info {level, message, meta} Level info about log
 * @param callback {function} Continuation to respond to when complete.
 * For Winston bellow 3
 * @param level {string} Level at which to log the message.
 * @param msg {string} Message to log.
 * @param meta {?Object} Additional metadata to attach.
 * @param callback {function} Continuation to respond to when complete.
 */
Mail.prototype.log = function(...args) {
  console.log(args);

  // get winston version to create tests accordingly
  var winstonVersion = winston.version,
      majorWVersion = winstonVersion.split('.')[0],
      self = this;

  var callback, level, msg, meta;

  if (majorWVersion >= 3 ) {
    // in version above 3 we have only 2 parameters: info and callback;
    var info = args[0];
    
    callback = args[1];
    level = info.level;
    msg = info.message || '';
    meta = info.meta;
  } else {
      level = args[0];
      msg = args[1];
      meta = args[2];
      callback = args[3];
  }

  if (this.silent) return callback(null, true)
  if (this.unique && this.level != level) return callback(null, true)

  if (this.formatter) {
    body = this.formatter({level: level, message: msg, meta: meta})
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
