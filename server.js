const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const socketio = require('socket.io');
const io = socketio(server);
const path = require('path');
const formatMEssage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
//set static folder
app.use(express.static(path.join(__dirname, 'public')));
const botName = 'ChatCord Bot';
//run when client connect 

io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //welcome current user
        socket.emit('message', formatMEssage(botName, 'welcome to the chat..'));

        //broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMEssage(botName, user.username + ' has joined the chat'));


        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })



    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMEssage(user.username, msg));
    })

    //run when user disconnect 
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMEssage(botName, user.username + ' has left the chat '));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
})

const PORT = 3000 //|| process.env.PORT;

server.listen(PORT, () => console.log('server running on port ' + PORT));