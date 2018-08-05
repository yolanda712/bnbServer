var clearSocketsByRoomName = function(io,roomName){
    try{
        var socketRoom = io.sockets.adapter.rooms[roomName];
        var sockets = socketRoom.sockets;
        var socketIds = Object.keys(sockets);
    
        for(var i=0;i<socketIds.length;i++){
            var socket = io.sockets.sockets[socketIds[i]];
            socket.roomName = null;
            socket.leave(roomName);
        }
    }catch(error){
        console.log(error);
    }
}

module.exports = {
    clearSocketsByRoomName: clearSocketsByRoomName
}