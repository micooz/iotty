#!/usr/bin/env iojs
var argv = process.argv.slice(2);

require("./iotty.js").launch(argv);