/*
 * winston-mail-test.js: Tests for instances of the Mail transport
 *
 * (C) 2011 Marc Harter
 * MIT LICENSE
 */
var vows = require('vows');
var assert = require('assert');
var winston = require('winston');
var helpers = require('winston/test/helpers');
var spawn = require('child_process').spawn;
var Mail = require('../lib/winston-mail').Mail;

var smtp = spawn('java',['-jar','test/fixtures/DevNullSmtp.jar','-p','2500','-console'])
smtp.stdout.on('data', function (data) { console.log('stdout: ' + data); });
smtp.stderr.on('data', function (data) { console.log('stderr: ' + data); });

function assertMail (transport) {
  assert.instanceOf(transport, Mail);
  assert.isFunction(transport.log);
};

var config = helpers.loadConfig(__dirname)
var transport = new (Mail)(config.transports.mail);

vows.describe('winston-mail').addBatch({
 "Start SMTP Server": {
    topic: function () { setTimeout(this.callback, 2000) }, '': function () { assert.ok(true) }
 }
}).addBatch({
 "An instance of the Mail Transport": {
   "should have the proper methods defined": function () {
     assertMail(transport);
   },
   // "the log() method": helpers.testNpmLevels(transport, "should log messages to Mail", function (ign, err, logged) {
   //   assert.isTrue(!err);
   //   assert.isTrue(logged);
   // })
 }
}).addBatch({
 "Stop SMTP Server": {
    topic: function (){ smtp.kill(); setTimeout(this.callback, 500) }, '': function () { assert.ok(true) }
 }
}).export(module);
