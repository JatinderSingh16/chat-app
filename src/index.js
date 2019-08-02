const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const badWordsFilter = require('bad-words')
const { generateMessage ,generateLocationMessage} =  require('../src/utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
const app = express()

const server = http.createServer(app)
const io = socketio(server)

const port = 'https://go-and-chat.herokuapp.com/' || 3000

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket Connection')
   
  socket.on('join',({username, room},callback) => { 
     socket.join(room)
     //Add user in room 
      const {error,user} =  addUser({id : socket.id,username,room})

      if(error){
          return callback(error)
      }

     socket.emit('message',generateMessage('Welcome'))
     socket.broadcast.to(user.room).emit('message',generateMessage(` ${user.username} has joined!`))
     io.to(user.room).emit('roomData',{
         room:user.room,
         users:getUsersInRoom(user.room)
     }) 
     //run without an error
      callback()

     //socket.emit, io.emit,socket.broadcast.emit
     //io.to.emit , socket.broadcast.to.emit
  })


    socket.on('sendMessage',(message,callback) => {
        const user = getUser(socket.id)
       const filter = new badWordsFilter()

       if(filter.isProfane(message)){
         return callback('Profanity is not allowed!')
       }

       io.to(user.room).emit('message',generateMessage(user.username,message))

       callback()
    })
 
     //send location 
    socket.on('sendLocation',(coords,callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        
        callback()
     })
 
    socket.on('disconnect',() => {

        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })

})

server.listen(port,() => {
 console.log(`Sever is up on port ${port}!`)
})