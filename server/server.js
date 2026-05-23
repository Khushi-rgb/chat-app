import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connect } from "http2";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import User from "./models/User.js";
import redisClient from "./config/redis.js";
import aiRoutes from "./routes/aiRoutes.js";
// Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: { origin: "*" }
});



// Socket.io connection handler
io.on("connection", async (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);
if(userId){

   await redisClient.set(
      `user:${userId}`,
      socket.id
   );

}

// Emit online users to all connected clients
const onlineKeys = await redisClient.keys("user:*");

const onlineUsers = onlineKeys.map(
   key => key.split(":")[1]
);

io.emit("getOnlineUsers", onlineUsers);
socket.on("typing", async ({ receiverId, senderName }) => {

   const receiverSocketId = await redisClient.get(
   `user:${receiverId}`
);

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", senderName);
    }

});

socket.on("stopTyping", async ({ receiverId }) => {

    const receiverSocketId = await redisClient.get(
   `user:${receiverId}`
);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStoppedTyping");
    }

});
socket.on("disconnect", async () => {

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        lastSeen: Date.now()
      });
    }

    console.log("User Disconnected", userId);

    await redisClient.del(`user:${userId}`);

   const onlineKeys = await redisClient.keys("user:*");

const onlineUsers = onlineKeys.map(
   key => key.split(":")[1]
);

io.emit("getOnlineUsers", onlineUsers);
})
})




// connect to mongoDB
await connectDB();

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/ai", aiRoutes);


// if(process.env.NODE_ENV === "production"){
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () =>  console.log("Server is running on port : " + PORT));
// }


const PORT = process.env.PORT || 5000;

// Only start listening if not running on Vercel (i.e. not serverless)
if (process.env.VERCEL !== "1") {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
export default server;

