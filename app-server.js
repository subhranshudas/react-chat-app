// app-server.js
import express from 'express';
const app = express();
// Set port
app.set('port', process.env.PORT || 3000);
// Static files
app.use(express.static('public'));
const http = require('http').Server(app);
const io = require('socket.io')(http);


// Listen for a connection
io.on('connection', socket => {
  console.log('socket is connected: ', socket.id);
  // Create message
  socket.on('chat-msg', (params) => {
    console.log('what we get from client', params);
    io.emit('chat-msg', Object.assign({}, params, {id: socket.id}));
  });

  socket.on('user-typing', (user) => {
    console.log('who is typing: ', user);
    io.emit('user-typing', user);
  });

  socket.on('user-not-typing', (user) => {
    console.log('who stopped typing: ', user);
    io.emit('user-not-typing', user);
  });

  socket.on('disconnect', (reason) => {
    console.log('socket is disconnected: ', socket.id);
    io.emit('user-offline', socket.id);
  });

});

// Route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

http.listen(app.get('port'), () => {
  console.log('React Chat App listening on ' + app.get('port'))
})