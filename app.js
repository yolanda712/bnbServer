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

    socket.on('startGame', function () {
        var roomName = socket.roomName;
        if(TDRoom.isRoomExisted(roomName)){
            var game = TDRoom.getRoom(roomName); 
            game.startGame();
        }
    })

    socket.on('joinRoom', function (data) {
        var roomName = data.roomId;
        var userInfo = data.userInfo;

        var msg = {code: 0, err: 'no such room'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.emit('roomInfo', msg);
        }else{
            socket.roomName = roomName;
            socket.join(roomName);
            socket.guid = userInfo.guid;

            var game = TDRoom.getRoom(roomName);            
            game.addPlayer(userInfo);
            // game.startGame(); 
            msg = {code:1,data:{userInfos:game.userInfos}};
            game.broadcastMsg('roomInfo',msg);
        }

    });

    socket.on('getRooms', function(data) {
        // TODO 数据格式需要改动
        var msg = {'ret': 1, 'data': TDRoom.getRooms()};
        socket.emit('getRooms', msg);
    });

    socket.on('newRoom', function(data) {
        var roomName = data['name'];
        var userInfo = data['userInfo'];
        userInfo['isMaster'] = true;

        var msg = {code:0,msg:'failed'};
        if(!TDRoom.isRoomExisted(roomName)){
            socket.roomName = roomName;
            socket.join(roomName); 
            socket.guid = userInfo.guid;           

            var game = new TDGame(io,roomName);
            game.addPlayer(userInfo);
            msg = TDRoom.createRoom(roomName,game);
            if(msg.code==1){
                msg = {code:1,data:{userInfos:game.userInfos}};
            }

        }
        socket.emit('roomInfo', msg);
    });

    // socket.on('playAgain', function(data) {
    //     var roomName = socket.roomName;
    //     var userInfo = data['userInfo'];
    //     var msg = {code:0,msg:'failed'};
    //     if(!TDRoom.isRoomExisted(roomName)){
    //         socket.join(roomName);            

    //         var game = new TDGame(io,roomName);
    //         game.addPlayer(userInfo);
    //         msg = TDRoom.createRoom(roomName,game);
    //     }else{
    //         socket.role = 'challenger';
    //         socket.join(roomName);

    //         var game = TDRoom.getRoom(roomName);            
    //         game.addPlayer(userInfo);
    //         game.startGame(); 
    //         msg ={code:1,msg:'success'};
    //     }
    //     socket.emit('playAgain', msg);
    // });

    socket.on('KeyUp', function (keyCode) {
        var game = TDRoom.getRoom(socket.roomName);
        if(game){
            game.stopARoleByKeyCode(keyCode,game.roleArr[game.guidRoleIndexMap[socket.guid]]);
        }
    });

    socket.on('KeyDown', function (keyCode) {
        var game = TDRoom.getRoom(socket.roomName);
        if (game) {
            game.moveARoleByKeyCode(keyCode,game.roleArr[game.guidRoleIndexMap[socket.guid]]);
        }
    });

    socket.on('MoveByAngle', function (angle) {
        var game = TDRoom.getRoom(socket.roomName);
        if (game) {
            game.moveARoleByAngle(angle,game.roleArr[game.guidRoleIndexMap[socket.guid]]);
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