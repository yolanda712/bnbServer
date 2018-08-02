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

    socket.on('newRoom', function(data) {
        var roomName = data['name'];
        var userInfo = data['userInfo'];
        var msg = {code:0,msg:'failed'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.roomName = roomName;
            socket.role = 'master';
            socket.join(roomName);            

            var game = new TDGame(io,roomName);
            game.addPlayer(userInfo);
            msg = TDRoom.createRoom(roomName,game);
            if(msg.code==1){
                msg = {code:1,userInfos:game.userInfos};
            }
        }
        socket.emit('roomInfo', msg);
    });

    socket.on('getRooms', function() {
        // TODO 数据格式需要改动
        var msg = {'ret': 1, 'data': TDRoom.getRooms()};
        socket.emit('getRooms', msg);
    });
    
    socket.on('joinRoom', function (data) {
        var roomName = data.roomId;
        var userInfo = data.userInfo;
        var msg = {code:0,msg:'failed'};

        if(!TDRoom.isRoomExisted(roomName)){
            socket.emit('joinRoom', msg);
        }else{
            socket.roomName = roomName;
            socket.role = 'challenger';
            socket.join(roomName);

            var game = TDRoom.getRoom(roomName);            
            game.addPlayer(userInfo);
            msg = {code:1,userInfos:game.userInfos};
            socket.emit('roomInfo', msg);
        }

    });

    socket.on('startGame', function() {
        var roomName = socket.roomName;
        var game = TDRoom.getRoom(roomName); 
        game.startGame();
    });

    socket.on('playAgain', function(data) {
        var roomName = socket.roomName;
        var userInfo = data['userInfo'];
        var msg = {code:0,msg:'failed'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.role = 'master';
            socket.join(roomName);            

            var game = new TDGame(io,roomName);
            game.addPlayer(userInfo);
            msg = TDRoom.createRoom(roomName,game);
        }else{
            socket.role = 'challenger';
            socket.join(roomName);

            var game = TDRoom.getRoom(roomName);            
            game.addPlayer(userInfo);
            msg ={code:1,msg:'success'};
        }
        socket.emit('playAgain', msg);
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

    socket.on('MoveByAngle', function (angle) {
        var game = TDRoom.getRoom(socket.roomName);
        if (game) {
            if (socket.role === 'master') {
                game.moveARoleByAngle(angle,game.roleArr[0]);
            } else {
                game.moveARoleByAngle(angle,game.roleArr[1]);
            }
        }
    });

    socket.on('disconnect', function(){
        TDRoom.deleteRoom(socket.roomName);
        socket.leave(socket.roomName);
    })

    socket.on('error',function(){
        console.log('server websocket error');
    })

});

server.listen(4000, function(){
    console.log('App listening at http://%s:%s', serverConfig.host, serverConfig.port);
});