const express = require("express");
const { chats } = require("./data/data");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const path = require('path')
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
require("dotenv").config()
const cors = require("cors")
const app = express();

// connectDB()

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("%s Database Connected", "✔");
})

app.use(express.json())
app.use(cors())



app.use('/api/user',userRoutes)
app.use('/api/chat',chatRoutes)
app.use('/api/message',messageRoutes)

// -------- Deployment ---------------------------
// const __dirname1 = path.resolve();
// if(process.env.NODE_ENV === "production"){
//     app.use(express.static(path.join(__dirname1,"../frontend/build")))
//     app.get('*',(req,res)=>{
//         res.sendFile(path.resolve(__dirname1,"../frontend","build","index.html"))
//     })

// }else{
//     app.get('/',(req,res)=>{
//         res.json("api running")
//         })
// }

// -------- Deployment --------------------------

app.use(notFound)
app.use(errorHandler)

// app.listen(process.env.PORT,console.log("server started"))

const server = app.listen(5000, function() {
    console.log('%s Listening to port:  ' + 5000 , "✔");
});

const io = require('socket.io')(server,{
    pingTimeout : 60000,
    cors:{
        origin:"http://localhost:3000",
    }
})

io.on("connection",(socket)=>{
    console.log("✔ connected to socket.io")

    socket.on('setup',(userData)=>{
        socket.join(userData._id)
    
        socket.emit('connected')
    })

    socket.on('join chat',(room)=>{
        socket.join(room)
    })

    socket.on('typing',(room)=>socket.in(room).emit('typing'))
    socket.on('stop typing',(room)=>socket.in(room).emit('stop typing'))

    socket.on('new message',(newMessageRecieved)=>{

        var chat = newMessageRecieved.chat;
        if(!chat.users) return console.log("chat.users not defined ") 

        chat.users.forEach(user=>{
            if(user._id == newMessageRecieved.sender._id) return;
            socket.in(user._id).emit("message recieved",newMessageRecieved)
        })
  
    })

    socket.off("setup" , ()=>{
        console.log("USER DISCONNECTED");
        socket.leave(userData._id)
    })
})
