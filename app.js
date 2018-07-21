var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var serverConfig = require('./public/config').serverConfig;

var TDGame = require('./public/tdGame/tdGame');
var Rooms = require('./public/tdGame/tdRoom');
var TDRoom = Rooms.TDRoom;

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    console.log('New connection from ' + clientIp);

    socket.on('joinRoom', function (roomName) {
        if(!TDRoom.isRoomExisted(roomName)){
            socket.emit('joinRoom', {ret: 0, err: 'no such room'});
        }else{
            socket.roomName = roomName;
            socket.role = 'challenger';
            socket.join(roomName);

            var game = TDRoom.getRoom(roomName);            
            game.addPlayerNum();
            game.startGame(); 
        }

    });

    socket.on('getRooms', function(data) {
        // TODO 数据格式需要改动
        var msg = {'ret': 1, 'data': TDRoom.getRooms()};
        socket.emit('getRooms', msg);
    });

    socket.on('newRoom', function(data) {
        var roomName = data['name'];
        var msg = {code:0,msg:'failed'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.roomName = roomName;
            socket.role = 'master';
            socket.join(roomName);            

            var game = new TDGame(io,roomName);
            game.addPlayerNum();
            msg = TDRoom.createRoom(roomName,game);
        }
        socket.emit('newRooms', msg);
    });

    socket.on('KeyUp', function (keyCode) {
        var game = TDRoom.getRoom(socket.roomName);
        if(game){
            if (socket.role === 'master') {
                game.stopARoleByKeyCode(keyCode,game.roleArr[0]);
            } else {
                game.stopARoleByKeyCode(keyCode,game.roleArr[1]);
            }
        }
    });

    socket.on('KeyDown', function (keyCode) {
        var game = TDRoom.getRoom(socket.roomName);
        if (game) {
            if (socket.role === 'master') {
                game.moveARoleByKeyCode(keyCode,game.roleArr[0]);
            } else {
                game.moveARoleByKeyCode(keyCode,game.roleArr[1]);
            }
        }
    });

    socket.on('end', function (data) {
        console.log("server on end");
    });

    socket.on('disconnect', function(){
        TDRoom.deleteRoom(socket.roomName);
        socket.leave(socket.roomName);
    })

    socket.on('error',function(){
        console.log('server websocket error');
    })

    // socket.on('')

});

server.listen(4000, function(){
    console.log('App listening at http://%s:%s', serverConfig.host, serverConfig.port);
});