var test = require('tape')
var winston = require('winston')
var SMTPServer = require('smtp-server').SMTPServer
var Mail = require('../lib/winston-mail').Mail

var testFn = function() {}
var smtp = new SMTPServer({
  disabledCommands: ['AUTH'],
  onData: function(stream, session, cb) {
    var data = ''
    stream.on('data', function(chunk) { data += chunk })
    stream.on('error', cb)
    stream.on('end', function() { testFn(data); cb() })
  },
})

test('set up email server', function(t) {
  smtp.listen(2500, '0.0.0.0', function(er) {
    t.error(er)
    t.end()
  })
})

test('winston-mail', function(t) {
  var table = [
    {level: 'info', subject: '{{level}}', test: 'info'},
    {msg: 'goodbye', level: 'error', test: 'goodbye'},
    {msg: 'hello', level: 'info', subject: '{{msg}}', test: 'hello'},
    {level: 'warn', formatter: function(d) { return '!' + d.level + '!' }, test: '!warn!'},
  ]

  t.plan(table.length)

  function run(tt) {
    if (!tt) return

    var transport = new (Mail)({
      to: 'dev@server.com',
      from: 'dev@server.com',
      port: 2500,
      subject: tt.subject,
      formatter: tt.formatter,
    })
    var logger = new winston.Logger({transports: [transport]})

    testFn = function(data) {
      t.ok(RegExp(tt.test).test(data))
      run(table.shift())
    }
    logger[tt.level](tt.msg)
  }
  run(table.shift())
})

test(function(t) {
  smtp.close(function() { t.end() })
})
