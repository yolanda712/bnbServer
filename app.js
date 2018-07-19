var express = require('express'),
    bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var swig = require('swig');
var serverConfig = require('./public/config').serverConfig;

var Direction = require('./public/tdGame/tdRole').Direction

var TDGame = require('./public/tdGame/tdGame')

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/templates');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var rooms = {};

var clientCallback = function(roomname){
    var msg = [];
    var game = rooms[roomname];
    if(game){
        for(index in game.roleArr){
            role = game.roleArr[index];
            msg.push(
                {
                    name:role.name,
                    position:{
                        x:role.position.x,
                        y:role.position.y
                    },
                    gameTime:game.gameTime,
                    score:role.score
                })
        }
        io.to(roomname).emit("roleInfo",msg);
        // console.log(msg);
    }else{
        delete rooms[roomname];
        clearInterval(this);
    }
};

app.get('/', function (req, res) {
    res.render('index');
});

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    console.log('New connection from ' + clientIp);

    socket.on('joinRoom', function (roomname) {
        var game = rooms[roomname];
        if (!game) {
            socket.emit('joinRoom', {ret: 0, err: 'no such room'});
        } else {
            socket.roomname = roomname;
            socket.role = 'challenger';
            socket.join(roomname);

            game.gameInfoInterval = setInterval(function(){
                clientCallback(roomname);
            },20);

            moveByKeyCode(68, game.masterRole);

            game.startGame();       
        }

    });

    socket.on('getRooms', function(data) {
        var msg = {'ret': 1, 'data': Object.keys(rooms)};
        socket.emit('getRooms', msg);
    });

    socket.on('newRoom', function(data) {
        var roomname = data['name'];
        var msg;
        if (roomname in rooms) {
            msg = {'ret': 0, 'err': 'room already existed'}
        } else {
            msg = {'ret': 1};
            socket.roomname = roomname;
            socket.role = 'master';
            socket.join(roomname);

            var game = new TDGame.TDGame(io,roomname);
            game.createMasterRole(32,32);
            game.createChallengerRole(32*11,32*9);

            rooms[roomname] = game;
        }
        socket.emit('newRooms', msg);
    });

    socket.on('KeyUp', function (data) {
        var game = rooms[socket.roomname];
        if(game){
            if (socket.role === 'master') {
                // room.masterRole.Stop();
                stopByKeyCode(data,game.masterRole);
                // room.challenger.emit("KU", data);
            } else {
                // room.challengerRole.Stop(data);
                stopByKeyCode(data,game.challengerRole);
                // room.master.emit("KU", data);
            }
        }
    });

    socket.on('KeyDown', function (data) {
        var game = rooms[socket.roomname];
        if (game) {
            if (socket.role === 'master') {
                moveByKeyCode(data,game.masterRole);
            } else {
                moveByKeyCode(data,game.challengerRole);
            }
        }
    });

    socket.on('end', function (data) {
        var game = rooms[socket.roomname];
        clearInterval(game.gameInfoInterval);

        var winner = data;        
        io.to(socket.roomname).emit('end', {ret: 1, data: winner});
        delete game;
        delete rooms[socket.roomname];
    });

    socket.on('disconnect', function(){
        var game = rooms[socket.roomname];
        if (game) {
            socket.leave(socket.roomname);
            clearInterval(game.gameInfoInterval);
            delete game;
            delete rooms[socket.roomname];
        }
    })

});

server.listen(4000, function(){
    console.log('App listening at http://%s:%s', serverConfig.host, serverConfig.port);
});


var moveByKeyCode = function(key, role){
    switch (key) {
        //W键,向上移动     
        case 87:
            role.move(Direction.Up);
            break;
        //A键,向左移动
        case 65:
            role.move(Direction.Left);
            break;
            //S键,向下移动
        case 83:
            role.move(Direction.Down);
            break;
        //D键,向右移动
        case 68:
            role.move(Direction.Right);
            break;
        case 74:
            role.createPaopao();
            break;
    }
}

var stopByKeyCode = function(key, role){
    switch (key) {  
        case 87:
            role.stop(Direction.Up);
            break;
        case 65:
            role.stop(Direction.Left);
            break;
        case 83:
            role.stop(Direction.Down);
            break;
        case 68:
            role.stop(Direction.Right);
            break;
    }
}
