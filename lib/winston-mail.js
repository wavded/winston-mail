/*
 * winston-mail.js: Transport for outputting logs to email
 *
 * (C) 2010 Marc Harter
 * MIT LICENCE
 */

var util = require('util');
var mail = require('mail');
var winston = require('winston');

/**
 * @constructs Mail
 * @param {object} options hash of options
 */

var Mail = exports.Mail = function (options) {
  options = options || {};

  if(!options.to){
    throw "winston-mail requires 'to' property";
  }

  this.name       = 'mail';
  this.to         = options.to;
  this.from       = options.from       || "no-reply@winston.com";
  this.level      = options.level      || 'info';
  this.silent     = options.silent     || false;

  this.client = mail.Mail(options);
};

/** @extends winston.Transport */
util.inherits(Mail, winston.Transport);

/**
 * Define a getter so that `winston.transports.MongoDB`
 * is available and thus backwards compatible.
 */
winston.transports.Mail = Mail;

/**
 * Core logging method exposed to Winston. Metadata is optional.
 * @function log
 * @member Mail
 * @param level {string} Level at which to log the message
 * @param msg {string} Message to log
 * @param meta {Object} **Optional** Additional metadata to attach
 * @param callback {function} Continuation to respond to when complete.
 */
Mail.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  if (this.silent) return callback(null, true);

  var body = meta ?  msg + "\n\n" + JSON.stringify(meta) : msg;

  this.client.message({
    from: this.from,
    to: this.to,
    subject: "winston: " + level + " " + msg
  })
  .body(body)
  .send(function (err) {
    if (err) self.emit('error', err);
    self.emit('logged');
    callback(null, true);
  });
};
