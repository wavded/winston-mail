/*
 * mongodb-test.js: Tests for instances of the MongoDB transport
 *
 * (C) 2011 Marc Harter
 * MIT LICENSE
 */
var vows = require('vows');
var assert = require('assert');
var winston = require('winston');
var helpers = require('winston/test/helpers');
var Mail = require('../lib/winston-mail').Mail;

function assertMail (transport) {
  assert.instanceOf(transport, Mail);
  assert.isFunction(transport.log);
};

var config = helpers.loadConfig(__dirname)
var transport = new (Mail)(config.transports.mail);

vows.describe('winston-mail').addBatch({
 "An instance of the Mail Transport": {
   "should have the proper methods defined": function () {
     assertMail(transport);
   },
   "the log() method": helpers.testNpmLevels(transport, "should log messages to Mail", function (ign, err, logged) {
     assert.isTrue(!err);
     assert.isTrue(logged);
   })
 }
}).export(module);
