var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var shell = require('shelljs');
var Q = require('q');
var env = require('./config.js').config;

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

function run(argv) {
  var buffered = {
    'cmdline': argv.join(' '),
    'data': null
  };

  Q.promise(function (resolve, reject) {
    io.on('connection', function (socket) {
      // console.log('a user connected');
      socket.on('disconnect', function () {
        console.log('user disconnected');
      });
      if (buffered.data) {
        console.log("loading from buffer");
        // console.log(buffered);
        socket.emit('iotty', buffered);
        socket.emit('iotty_end', '');
      } else {
        resolve(socket);
      }
    });
  }).then(function (socket) {
    var cmdline = argv.join(' ');
    var cmd = shell.exec(cmdline, function (code, output) {
      if (!buffered.data) {
        buffered.data = output;
      } else {
        buffered.data += output;
      }
      socket.emit('iotty', {
        'cmdline': cmdline,
        'data': output
      });
    });

    cmd.stderr.on('data', function (stderr) {
      console.log("stderr: " + stderr);
    });

    cmd.on('close', function (code) {
      socket.emit('iotty_end', '');
      console.log('process exited with code: ' + code);
    });
  }).done();
}

exports.launch = function (argv) {
  if (argv.length > 0) {
    http.listen(env.PORT, function () {
      console.log('server is listening on *:' + env.PORT);
    });
    run(argv);
  } else {
    console.log('no command provided');
  }
}