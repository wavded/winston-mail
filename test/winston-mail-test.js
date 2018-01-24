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
  // get winston version to create tests accordingly
  var winstonVersion = winston.version,
      majorWVersion = winstonVersion.split('.')[0];
  var table = [
        {level: 'info', subject: '{{level}}', test: 'info'},
        {message: 'goodbye', level: 'error', test: 'goodbye'},
        {message: 'hello', level: 'info', subject: '{{message}}', test: 'hello'},
        {level: 'warn', formatter: function(d) { return '!' + d.level + '!' }, test: '!warn!'},
      ];
  
  t.plan(table.length)

  function run(tt) {
    if (!tt) return

    var transport = new Mail({
      to: 'dev@server.com',
      from: 'dev@server.com',
      port: 2500,
      subject: tt.subject,
      formatter: tt.formatter,
    })
    var logger;

    if (majorWVersion >= 3) {
      logger = new winston.createLogger({
        transports: [transport]});
    } else {
        logger = new winston.Logger({
              transports: [transport]});
    }

    testFn = function(data) {
      t.ok(RegExp(tt.test).test(data))
      run(table.shift())
    }
    if (majorWVersion >= 3) {
      // for version 3 and above use the new log function with info object as a parameter
      logger.log({level:tt.level, message:tt.message});
    } else {
      // for version bellow 3 use the old log function with 3 parameters: level, message, meta
      logger[tt.level](tt.message);
    }
  }
  run(table.shift())
})

test(function(t) {
  smtp.close(function() { t.end() })
})
