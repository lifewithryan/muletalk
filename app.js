var app = require('express').createServer()
var io = require('socket.io').listen(app);

app.listen(8080);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/style.css', function (req, res) {
  res.sendfile(__dirname + '/style.css');
});

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['bedford'];

io.sockets.on('connection', function (socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'bedford';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('bedford');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to ' + socket.room);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'bedford');
		socket.emit('updateusers', usernames);
		socket.broadcast.emit('updateusers', usernames);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// user creates room
	socket.on('createRoom', function(roomName) {
		rooms.push(roomName);
		socket.emit('addedRoom', rooms, roomName);
		socket.broadcast.emit('addedRoom', rooms, roomName);
	});

	/*socket.on('command', function(commandString) {
		cmd = commandString.split(' ');

		if(cmd[0] == "deleteroom") {
			rooms
		} else if(commandString == )
	});*/

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});


});
