const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)// needs to be manual http server not express server

const port = process.env.PORT || 3000
const pubdir = path.join(__dirname, '../public')

// Setup static directory to serve
app.use(express.static(pubdir))

io.on('connection', (socket)=>{ //socket contains information about client
    console.log('New WebSocket connection')

  
    socket.on('join',({username, room}, callback)=>{
        const {error, user} = addUser({id: socket.id, username,room})

        if(error){
           return callback(error)
        }

        socket.join(user.room)
        socket.emit('message',generateMessage('ADMIN','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('ADMIN',`${user.username} has joined!`))
        
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    socket.on('sendMessage',(message, callback)=>{ //callback to acknowledge the event
        const filter = new Filter()
        const user = getUser(socket.id)
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect', () => { //built in if socket disconnects
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message',generateMessage('ADMIN',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation',({lat,long},callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,'https://google.com/maps?q='+lat + ','+long))
        callback()
    })
})

server.listen(port, () =>{
    console.log('Server is up on port '+port)
})

