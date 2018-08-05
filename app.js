var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var serverConfig = require('./public/config').serverConfig;

var TDGame = require('./public/tdGame/tdGame');
var Rooms = require('./public/tdGame/tdRoom');
var TDRoom = Rooms.TDRoom;

var utils = require('./public/utils');

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
            game.broadcastMsg('roomInfo', msg);
        }

    });

    socket.on('deleteRoom', function () {
        var roomName = socket.roomName;
        var msg = {code:0,msg:'failed'};

        if(!TDRoom.isRoomExisted(roomName)){
            socket.emit('deleteRoom', msg);
        }else{
            var game = TDRoom.getRoom(roomName);
            game.broadcastMsg('deleteRoom',{code:1,msg:'success'}); 
            TDRoom.deleteRoom(roomName);           
            utils.clearSocketsByRoomName(io,roomName);
        }
    });

    socket.on('startGame', function() {
        var roomName = socket.roomName;
        var game = TDRoom.getRoom(roomName); 
        game.startGame();
    });

    socket.on('playAgain', function(data) {
        var roomName = data.roomId;
        var userInfo = data.userInfo;
        var msg = {code:0,msg:'failed'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.role = 'master';
            socket.roomName = roomName;
            socket.join(roomName);
            userInfo.isMaster = true;            

            var game = new TDGame(io,roomName);
            game.addPlayer(userInfo);
            msg = TDRoom.createRoom(roomName,game);
            if(msg.code === 1){
                msg.userInfos = game.userInfos;
                msg.msg = 'success';
            }
        }else{
            socket.role = 'challenger';
            socket.roomName = roomName;
            socket.join(roomName);
            userInfo['isMaster'] = false;

            var game = TDRoom.getRoom(roomName);            
            game.addPlayer(userInfo);
            msg ={code:1,msg:'success',userInfos:game.userInfos};
            game.broadcastMsg('playAgain',msg);
            return;
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

    socket.on('TouchEnd', function () {
        var game = TDRoom.getRoom(socket.roomName);
        if(game){
            if (socket.role === 'master') {
                game.stopAMobileRole(game.roleArr[0]);
            } else {
                game.stopAMobileRole(game.roleArr[1]);
            }
        }
    });

    socket.on('disconnect', function(){
        var game = TDRoom.getRoom(socket.roomName);
        if(game){
            game.broadcastMsg('deleteRoom',{code:1,msg:'success'});
            game.stopGame(socket.role);
        }
    })

    socket.on('error',function(){
        console.log('server websocket error');
    })

});

server.listen(4000, function(){
    console.log('App listening at http://%s:%s', serverConfig.host, serverConfig.port);
});