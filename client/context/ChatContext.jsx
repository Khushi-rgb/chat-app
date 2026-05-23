import { createContext, use, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import notificationSound from "../src/assets/notification.mp3";


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

const [messages, setMessages] = useState([]);
const [users, setUsers] = useState([]);
const [selectedUser, setSelectedUser] = useState(null)
const [unseenMessages, setUnseenMessages] = useState({})

const {socket, axios} = useContext(AuthContext);
const audio = new Audio(notificationSound);
// function to get all users for sidebar
const getUsers = async () => {
  try {
     const { data } = await axios.get("/api/messages/users");
//     const { data } = await axios.get("/api/messages/users", {
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem("token")}`,
//   },
// });
    if (data.success) {
      setUsers(data.users);
      setUnseenMessages(data.unseenMessages);
       console.log(data.users);
    }
  } catch (error) {
    toast.error(error.message);
  }
};

// function to get messages for selected user
const getMessages = async (userId) => {
  try {
    const { data } = await axios.get(`/api/messages/${userId}`);
    if (data.success) {
      setMessages(data.messages);
    }
  } catch (error) {
    toast.error(error.message);
  }
};
// function to send message to selected user
const sendMessage = async (messageData) => {
  try {
    const { data } = await axios.post( `/api/messages/send/${selectedUser._id}`, messageData );

  if (data.success) {

  console.log(data.newMessage);

  setMessages((prevMessages) => [
    ...prevMessages,
    data.newMessage
  ]);

} else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  }
};

const deleteChat = async (userId) => {

  try {

    const { data } = await axios.delete(
      `/api/messages/delete-chat/${userId}`
    );

    if (data.success) {

      setMessages([]);

      toast.success("Chat deleted");
    }

  } catch (error) {
    toast.error(error.message);
  }
};
  const deleteUser = async (userId) => {

  try {

    const { data } = await axios.delete(
      `/api/auth/delete/${userId}`
    );

    if (data.success) {

      setUsers((prev) =>
        prev.filter((u) => u._id !== userId)
      );

      setSelectedUser(null);

      toast.success("User deleted");
    }

  } catch (error) {

    toast.error(error.message);

  }

};
const reactToMessage = async (
  messageId,
  emoji
) => {

  try {

    const { data } = await axios.put(
      `/api/messages/react/${messageId}`,
      { emoji }
    );

    if (data.success) {

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? data.updatedMessage
            : msg
        )
      );

    }

  } catch (error) {

    toast.error(error.message);

  }

};
// function to subscribe to messages for selected user
const subscribeToMessages = async () => {
  if (!socket) return;

  socket.on("newMessage" , async (newMessage) => {
audio.play();
if (
  selectedUser &&
  newMessage.senderId.toString() === selectedUser._id.toString()
) {

      await axios.put(`/api/messages/mark/${newMessage._id}`);

      newMessage.status = "seen";

      setMessages((prevMessages) => [
        ...prevMessages,
        newMessage
      ]);

    } else {

      setUnseenMessages((prevUnseenMessages) => ({
        ...prevUnseenMessages,
        [newMessage.senderId]:
          prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1
      }))
    }
  
  });

  socket.on("messageStatusUpdated", (updatedMessage) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
      msg._id.toString() === updatedMessage._id.toString()
          ? updatedMessage
          : msg
      )
    );

  });
  socket.on("getOnlineUsers", () => {
  getUsers();
});
};
// function to unsubscribe from messages
const unsubscribeFromMessages = () => {
if (socket) {
  socket.off("newMessage");
  socket.off("messageStatusUpdated");
  socket.off("getOnlineUsers");
}
};

useEffect(() => {
  subscribeToMessages();
  return () => unsubscribeFromMessages();
}, [socket, selectedUser]);

const value = {
  messages,setMessages, users, selectedUser, getUsers, getMessages, sendMessage,deleteChat, setSelectedUser, unseenMessages,
  setUnseenMessages,deleteUser, reactToMessage
};


  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};