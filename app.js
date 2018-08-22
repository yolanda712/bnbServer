var serverio = require('./public/serverio')
var app = serverio.app;
var server = serverio.server;
var io = serverio.io;
var swig = require('swig');

swig.setDefaults({
  cache: false
})
app.set('view cache', false);
app.set('views','./views/pages/');
app.set('view engine','html');
app.engine('html', swig.renderFile);

var serverConfig = require('./public/config').serverConfig;
var Rooms = require('./public/tdGame/Room');
var Room = Rooms.Room;
var utils = require('./public/utils');

// prometheus collector
var myProm = require('./public/prom');
var Register = require('prom-client').register; 

app.get('/metrics', function(req, res) {
    res.set('Content-Type', Register.contentType);
    res.end(Register.metrics());
});

//index page
app.get('/',function(req, res) {
    res.render('index',{
        title:'天帝泡泡堂',
        content: '这里是 天帝泡泡堂~'
    })
})

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    console.log('New connection from ' + clientIp);
    myProm.bnb_connection_gauge.inc();

    socket.on('newRoom', function(data) {
        var roomName = data['name'];
        var userInfo = data['userInfo'];
        var oldRoomName = socket.roomName;
        if(oldRoomName)
            Room.removeRoomPlayer(oldRoomName,userInfo);
        var msg = {code:0,msg:'failed'};
        if(!Room.isRoomExisted(roomName)){
            utils.clearSocketsByRoomName(io,roomName);
            socket.roomName = roomName;
            socket.userInfo = userInfo;
            socket.join(roomName);            

            msg = Room.createRoom(roomName,userInfo);
            if(msg.code==1){
                msg = {code:1,userInfos:Room.getRoom(roomName).userInfos};
            }else{
                socket.leave(roomName);
            }
        }
        socket.emit('roomInfo', msg);
    });

    socket.on('getRooms', function() {
        // TODO 数据格式需要改动
        var msg = {'ret': 1, 'data': Room.getRooms()};
        socket.emit('getRooms', msg);
    });
    
    socket.on('joinRoom', function (data) {
        var roomName = data.roomId;
        var userInfo = data.userInfo;
        var oldRoomName = socket.roomName;
        if(oldRoomName)
            Room.removeRoomPlayer(oldRoomName,userInfo);
        var msg = Room.joinRoom(roomName, userInfo);

        if(msg.code !== 1){
            socket.emit('joinRoom', msg);
        }else{
            socket.roomName = roomName;
            socket.userInfo = userInfo;
            socket.join(roomName);
            var game = Room.getRoom(roomName);
            msg = {code:1,userInfos:game.userInfos};
            console.log(game.userInfos);
            game.broadcastMsg('roomInfo', msg);
        }
    });

    socket.on('deleteRoom', function () {
        var roomName = socket.roomName;
        var userInfo = socket.userInfo;
        var msg = Room.removeRoomPlayer(roomName,userInfo);
        var game = Room.getRoom(roomName);
        if(game){
            game.broadcastMsg('deleteRoom',{code:1,msg:'success',userInfos:game.userInfos}); 
        }else{
            socket.emit('deleteRoom', msg);
        }
        socket.roomName = null;
        socket.userInfo = null;
        socket.leave(roomName); 
    });

    socket.on('startGame', function() {
        var roomName = socket.roomName;
        var game = Room.getRoom(roomName); 
        if(game){
            game.startGame();
        }
    });

    socket.on('playAgain', function(data) {
        var roomName = data.roomId;
        var userInfo = data.userInfo;
        var msg = {code:0,msg:'failed'};
        if(!Room.isRoomExisted(roomName)){
            utils.clearSocketsByRoomName(io,roomName);
            socket.roomName = roomName;
            socket.userInfo = userInfo;
            socket.join(roomName);            
            msg = Room.createRoom(roomName,userInfo);
            if(msg.code==1){
                msg = {code:1,userInfos:Room.getRoom(roomName).userInfos};
            }else{
                socket.leave(roomName);
            }
            socket.emit('playAgain', msg);  

        }else if(!Room.isRoomFull(roomName)){
            socket.userInfo = userInfo;
            socket.roomName = roomName;
            var msg = Room.joinRoom(roomName, userInfo);

            if(msg.code !== 1){
                socket.emit('playAgain', msg);
            }else{
                socket.roomName = roomName;
                socket.userInfo = userInfo;
                socket.join(roomName);
                var game = Room.getRoom(roomName);
                msg = {code:1,userInfos:game.userInfos};
                console.log(game.userInfos);
                game.broadcastMsg('playAgain', msg);
            }
        }
    });

    socket.on('KeyUp', function (keyCode) {
        var game = Room.getRoom(socket.roomName);
        if(game){
            var guid = socket.userInfo.guid;
            var roleIndex = game.userGuidRoleIndexMap[guid];
            if(roleIndex >= 0){
                game.stopARoleByKeyCode(keyCode,game.roleArr[roleIndex]);
            }
        }
    });

    socket.on('KeyDown', function (keyCode) {
        var game = Room.getRoom(socket.roomName);
        if (game) {
            var guid = socket.userInfo.guid;
            var roleIndex = game.userGuidRoleIndexMap[guid];
            if(roleIndex >= 0){
                game.moveARoleByKeyCode(keyCode,game.roleArr[roleIndex]);
            }
        }
    });

    socket.on('MoveByAngle', function (angle) {
        var game = Room.getRoom(socket.roomName);
        if (game) {
            var guid = socket.userInfo.guid;
            var roleIndex = game.userGuidRoleIndexMap[guid];
            if(roleIndex >= 0){
                game.moveARoleByAngle(angle,game.roleArr[roleIndex]);
            }
        }
    });

    socket.on('TouchEnd', function () {
        var game = Room.getRoom(socket.roomName);
        if(game){
            var guid = socket.userInfo.guid;
            var roleIndex = game.userGuidRoleIndexMap[guid];
            if(roleIndex >= 0){
                game.stopAMobileRole(game.roleArr[roleIndex]);
            }
        }
    });

    socket.on('disconnect', function(){
        myProm.bnb_connection_gauge.dec();
        var roomName = socket.roomName;
        var userInfo = socket.userInfo;
        var game = Room.getRoom(socket.roomName);
        if(game){
            if(!game.isRunning){             
                var msg = Room.removeRoomPlayer(roomName,userInfo);
                var game = Room.getRoom(roomName);
                if(game){
                    game.broadcastMsg('deleteRoom',{code:1,msg:'success',userInfos:game.userInfos}); 
                }else{
                    socket.emit('deleteRoom', msg);
                }
            }else{
                game.removeAPlayingPlayer();
            }
            socket.roomName = null;
            socket.userInfo = null;
            socket.leave(roomName);
        }
    })

    socket.on('error',function(){
        console.log('server websocket error');
    })

});

server.listen(serverConfig.port, function(){
    console.log('App listening at http://%s:%s', serverConfig.host, serverConfig.port);
});