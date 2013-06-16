
var http = require('http'),
	connect = require('connect'),
	express = require('express'),
	sio = require('socket.io');

var app = express();

var oneDay = 86400000;
var oneMinute = 1000*60;
var oneSecond = 1000;

app.use(
  connect.static(__dirname + '/../public', { maxAge: oneDay })
);

var server = http.createServer(app);

var io = sio.listen(server, {log: false});

var players = {};

var setMaster = function(excludeId){
	var clients = io.sockets.clients();
	if(excludeId){
		clients = clients.filter(function(el){
			return el.id !== excludeId;
		})
	}
	if(clients.length == 0)
		return;

	clients[0].emit('setmaster', '');
}

var connect = function(socket){

	socket.on('register', function(data){
		players[socket.id] = {};
		players[socket.id].x = 0;
		players[socket.id].y = 0;
		players[socket.id].type = data.type;
		socket.emit('id', socket.id);
		socket.broadcast.emit('newplayer', {id: socket.id, players: players});
		setMaster();
	});

	socket.on('update', function (msg) {
		if(!players[socket.id])
			return;
		players[socket.id].x = msg.x;
		players[socket.id].y = msg.y;
	});	

	socket.on('increasehealth', function (msg) {
		var s = io.sockets.sockets[msg.id];
		if(s){
			console.log('increasehealth');
			s.emit('increasehealth', msg.amount);
		}
	});		

	socket.on('disconnect', function () {
		delete players[socket.id];
		socket.broadcast.emit('removeplayer', {id: socket.id});
		console.log(players);
		setMaster(socket.id);
	});		

	socket.on('removeplayer', function (id) {
		delete players[id];
		socket.broadcast.emit('removeplayer', {id: id});
	});		
};


io.sockets.on('connection', connect);

setInterval(function(){
	io.sockets.emit('update', players);
}, oneSecond/60);

server.listen(80);