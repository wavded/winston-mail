# winston-mail

A email transport for [winston][0].

## Installation

### Installing npm (node package manager)

``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing winston-mail

``` bash
  $ npm install winston
  $ npm install winston-mail
```

## Usage
``` js
  var winston = require('winston');
  
  //
  // Requiring `winston-mail` will expose 
  // `winston.transports.Mail`
  //
  require('winston-mail').Mail;
  
  winston.add(winston.transports.Mail, options);
```

The Mail transport uses [node-mail](https://github.com/weaver/node-mail) behind the scenes.  Options are the following, `to` and `host` are required:

* __to:__ The address(es) you want to send to. *[required]*
* __from:__ The address you want to send from. (default: `winston@[server-host-name]`)
* __host:__ SMTP server hostname
* __port:__ SMTP port (default: 587 or 25)
* __secure:__ Use secure
* __username__ User for server auth
* __password__ Password for server auth
* __level:__ Level of messages that this transport should log. 
* __silent:__ Boolean flag indicating whether to suppress output.

[0]: https://github.com/flatiron/winston
