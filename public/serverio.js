var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

module.exports = {
    server:server,
    io:io
};