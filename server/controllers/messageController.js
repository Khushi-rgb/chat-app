import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../server.js";
import redisClient from "../config/redis.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select
        ("-password");
 // const filteredUsers = await User.find().select("-password");


        // Count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId: user._id, receiverId:
            userId, status: { $ne: "seen" }})
            
            if(messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
 

        await Promise.all(promises);
        
        res.json({success: true, users: filteredUsers, unseenMessages})
    } catch (error) {
        console.log(error.message);
        
        res.json({success: false, message: error.message})
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
    await Message.updateMany(
  { senderId: selectedUserId, receiverId: myId },
  { status: "seen" }
);

const updatedMessages = await Message.find({
  senderId: selectedUserId,
  receiverId: myId,
  status: "seen"
});

const senderSocketId = await redisClient.get(
  `user:${selectedUserId}`
);

if (senderSocketId) {

  updatedMessages.forEach((msg) => {
    io.to(senderSocketId).emit(
      "messageStatusUpdated",
      msg
    );
  });

}

        res.json({success: true, messages})
        } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
       const updatedMessage = await Message.findByIdAndUpdate(
  id,
  { status: "seen" },
  { new: true }
);

const senderSocketId = await redisClient.get(
  `user:${updatedMessage.senderId}`
);

if (senderSocketId) {
  io.to(senderSocketId).emit(
    "messageStatusUpdated",
    updatedMessage
  );
}
        res.json({success: true})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}


// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
      const {
  text,
  image,
  audio,
  replyTo
} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
}
let audioUrl;

if (audio) {

  const uploadResponse =
    await cloudinary.uploader.upload(
      audio,
      {
        resource_type: "video",
      }
    );

  audioUrl =
    uploadResponse.secure_url;

}
const newMessage = await Message.create({
    senderId,
    receiverId,
    text,
    image: imageUrl,
    audio: audioUrl,
    replyTo,
    status: "sent"
});

// Emit the new message to the receiver's socket
const receiverSocketId = await redisClient.get(
  `user:${receiverId}`
);

if (receiverSocketId){

    io.to(receiverSocketId).emit("newMessage", newMessage)

    await Message.findByIdAndUpdate(newMessage._id, {
        status: "delivered"
    });

    newMessage.status = "delivered";
}
res.json({success: true, newMessage});

} catch (error) {
    console.log(error.message);
    res.json({success: false, message: error.message})
}
}


export const deleteChat = async (req, res) => {
  try {

    const myId = req.user._id;
    const selectedUserId = req.params.id;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId }
      ]
    });

    res.json({
      success: true,
      message: "Chat deleted"
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
};

export const reactToMessage = async (req, res) => {

  try {

    const { emoji } = req.body;

    const updatedMessage =
      await Message.findByIdAndUpdate(
        req.params.id,
        {
          reactions: {
            emoji
          }
        },
        { new: true }
      );

    res.json({
      success: true,
      updatedMessage
    });

  } catch (error) {

    res.json({
      success: false,
      message: error.message
    });

  }

};