require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs")
const { registerPartials } = require("ejs");
const path = require("path");
const connDB = require("./config/connDB")
const port = process.env.PORT || 3000;
const http = require("http").createServer(app)
const io = require("socket.io")(http);
const chatMessage = require("./model/chatMessage")
// Code for automatically chnage status to complete
const cron = require('node-cron');
const JobPost = require('./model/JobPost');

async function updateJobStatus() {
    const now = new Date();
  
    try {
      const jobsToUpdate = await JobPost.find({
        status: 'In Progress',
      });
      for (let job of jobsToUpdate) {
        const endDateTime = new Date(job.end_date);
        const endHours = parseInt(job.end_time.substring(0, 2));
        const endMinutes = parseInt(job.end_time.substring(3, 5));
        const endDateOnly = new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate());
        if (now >= endDateOnly && (now.getHours() > endHours || (now.getHours() === endHours && now.getMinutes() >= endMinutes))) {
          job.status = 'Complete';
          await job.save();
        }
      }
      if (jobsToUpdate.length === 0) {
        console.log('No jobs needed to be updated.');
      }
    } catch (error) {
      console.error('Error updating job statuses:', error);
    }
  }
  // Schedule the job to run every minute
  cron.schedule('* * * * *', updateJobStatus);
  
  // Start the cron job immediately when the script runs
  updateJobStatus();

  // end of automaticaaly chnage status
//creating session
const session = require("express-session");
app.use(
    session({
      secret: process.env.SESSION_KEY,
      resave: true,
      saveUninitialized: true,
    })
  );

// path
const staticPath = path.join(__dirname, "public")
const viewPath = path.join(__dirname, "templates/views")
const partialPath = path.join(__dirname, "templates/partials")

// middleware
app.use(express.static(staticPath));
app.set("view engine", "ejs")
app.set("views", viewPath)



//middleware for handling url encoded data (form data)
app.use(express.urlencoded({ extended: false }))

// buildin middleware for json
app.use(express.json());

// serve static file from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// routing
// root routes
app.use('/',require('./routers/root'))
// seeker routes
app.use('/seeker',require('./routers/seeker'))
// provider routes
app.use('/provider',require('./routers/provider'))
//services routes
app.use('/services', require('./routers/services'))
// 404 page not found
app.get("/*",(req,res)=>{
    res.status(404).render("404");
})

  // Socket

  io.on("connection", (socket) => {
    console.log("Connected......");

    socket.on('joinRoom', async ({ seekerID, providerID }) => {
        socket.join(seekerID);
        socket.join(providerID);

        // Load previous chat messages
        let chat = await chatMessage.findOne({
            $or: [
                { senderId: seekerID, receiverId: providerID },
                { senderId: providerID, receiverId: seekerID }
            ]
        });

        if (chat) {
            socket.emit('chatHistory', chat.msgs);
        } else {
            socket.emit('chatHistory', []);
        }
    });

    socket.on('message', async (msg) => {
        try {
            // create a chat based on sender and receiver
            console.log('Received message:', msg); 
            let chat = await chatMessage.findOne({
                $or: [
                    { senderId: msg.sender, receiverId: msg.receiver },
                    { senderId: msg.receiver, receiverId: msg.sender }
                ]
            });

            if (!chat) {
                // Create  new chat if it doesn't exist
                chat = new chatMessage({
                    senderId: msg.sender,
                    receiverId: msg.receiver,
                    msgs: [] // Initialize empty msgs array
                });
            }

            const newMessage = {
                sender: msg.sender,
                content: msg.message,
                timestamp: new Date()
            };
            console.log('New message:', newMessage);

            // push the new message to the msgs array in the chat
            chat.msgs.push(newMessage);

            await chat.save();

            // Emit the message to both sender and receiver
            socket.to(msg.sender).to(msg.receiver).emit('message', newMessage);
        } catch (error) {
            console.error("Error in saving message ", error);
        }
    });
});


 

// adding port and database connection
const start = async () =>{
    try{
        await connDB(process.env.DATABASE_CONNECTION)
        http.listen(port,()=>{console.log(`Server is listening at port ${port}`)});
    }catch(err){
        console.log(`Database Connection Error ${err}`);
    }
}
start();