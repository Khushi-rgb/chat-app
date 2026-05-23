import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import {
  FaMagic,
  FaMicrophone
} from "react-icons/fa";

import {
  AiFillStop
} from "react-icons/ai";


const ChatContainer = () => {

  const {messages, setMessages, selectedUser, setSelectedUser, sendMessage, getMessages,users,deleteChat,deleteUser,reactToMessage} = useContext(ChatContext)
 const { authUser, onlineUsers, socket } = useContext(AuthContext)
    const scrollEnd = useRef()
    const [input, setInput] = useState('')
    const [typingUser, setTypingUser] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
   const [selectedMessage, setSelectedMessage] = useState(null);
   const [replyMessage, setReplyMessage] = useState(null);
  
   const [summary, setSummary] = useState("");
   const [translatedMessages,setTranslatedMessages] = useState({});
   const [mediaRecorder, setMediaRecorder] = useState(null);

   const [isRecording, setIsRecording] = useState(false);
    // Handle sending a message
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (input.trim() === "") return null;
await sendMessage({
  text: input.trim(),
  replyTo: replyMessage
});
setReplyMessage(null);
  setInput("")
}
const handleEmojiClick = (emojiObject) => {



  setInput((prev) => prev + emojiObject.emoji);
};

const handleSummarize = async () => {

  // If already open -> close it
  if (summary) {
    setSummary("");
    return;
  }

  try {

   const texts = messages
  .slice(-15)
  .map((msg) => msg.text);

    const res = await fetch(
      "http://localhost:5000/api/ai/summarize",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          messages: texts,
        }),
      }
    );

    const data = await res.json();

    setSummary(data.summary);

  } catch (error) {

    console.log(error);

  }

};

const handleTranslate =
async (msgId, text) => {

  // Toggle off if already translated
  if (translatedMessages[msgId]) {

    setTranslatedMessages((prev) => {

      const updated = { ...prev };

      delete updated[msgId];

      return updated;

    });

    return;
  }

  try {

    const res = await fetch(
      "http://localhost:5000/api/ai/translate",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          text,

          targetLanguage:
            "Hindi"

        }),

      }
    );

    const data = await res.json();

    setTranslatedMessages((prev) => ({
      ...prev,
      [msgId]:
        data.translatedText
    }));

  } catch (error) {

    console.log(error);

  }

};

const handleVoiceRecord = async () => {

  try {

    if (isRecording) {

      mediaRecorder.stop();

      setIsRecording(false);

      return;

    }

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true,
        });

    const recorder =
      new MediaRecorder(stream);

    let audioChunks = [];

    recorder.ondataavailable =
      (event) => {

        audioChunks.push(event.data);

      };

    recorder.onstop = async () => {

      const audioBlob =
        new Blob(audioChunks, {
        type: "audio/mp4",
        });

      const reader =
        new FileReader();

      reader.readAsDataURL(audioBlob);

      reader.onloadend =
        async () => {

          console.log(reader.result);

     console.log("VOICE READY");
console.log(reader.result);

const newAudioMessage = {

  _id: Date.now(),

  senderId: authUser._id,

  audio: reader.result,

  createdAt: new Date(),

};

setMessages((prev) => [
  ...prev,
  newAudioMessage
]);
        };

    };

    recorder.start();

    setMediaRecorder(recorder);

    setIsRecording(true);

  } catch (error) {

    console.log(error);

    alert(
      "Microphone permission denied"
    );

  }

};



// Handle sending an image
const handleSendImage = async (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) {
    toast.error("select an image file")
    return;
  }
  const reader = new FileReader();

  reader.onloadend = async () => {
     console.log(reader.result);
    await sendMessage({ image: reader.result });
    console.log("Image sending...");
   
    e.target.value = "";
  }

  reader.readAsDataURL(file);
}
const currentChatUser = users.find(
  (u) => u._id === selectedUser?._id
);
useEffect(()=>{
  if(selectedUser){
    getMessages(selectedUser._id)
  }
},[selectedUser])
    useEffect(()=>{
        if(scrollEnd.current && messages){ 
            scrollEnd.current.scrollIntoView({behavior: "smooth"})
        }
    },[messages])
    useEffect(() => {

  if (!socket) return;

  socket.on("userTyping", (senderName) => {
    setTypingUser(senderName);
  });

  socket.on("userStoppedTyping", () => {
    setTypingUser("");
  });

  return () => {
    socket.off("userTyping");
    socket.off("userStoppedTyping");
  };

}, [socket])
  return selectedUser ?(
   <div className='h-full overflow-scroll relative backdrop-blur-lg'>
    {/* ------Header------ */}
  <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
    <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full'/>
    <p className='flex-1 text-lg text-white flex items-center gap-2'>
      {selectedUser.fullName}
      {typingUser && (
  <span className='text-xs text-green-400'>
    {typingUser} is typing...
  </span>
)}
     {onlineUsers.includes(selectedUser._id) ? (

  <span className='text-green-400 text-sm'>
    online
  </span>

) : (

<span className='text-xs text-gray-400'>
  last seen {
    new Date(currentChatUser?.lastSeen).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  }
</span>

)}
    </p>
    <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7'/>
<div className='relative'>

<button
  onClick={handleSummarize}
  className='bg-purple-600
  hover:bg-purple-700
  text-white p-2
  rounded-full mr-2'
>
  <FaMagic />
</button>
  <button
    onClick={() => setShowMenu(!showMenu)}
    className='text-white text-xl px-2'
  >
    ⋮
  </button>

  {showMenu && (
 <div className='absolute right-0 top-8 bg-[#1e1e1e] rounded-md shadow-lg z-50 overflow-hidden min-w-[140px]'>

  <button
    onClick={() => {
      if (window.confirm("Delete this chat?")) {
        deleteChat(selectedUser._id)
      }
      setShowMenu(false);
    }}
    className='w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10'
  >
    Delete Chat
  </button>

  <button
    onClick={() => {
      if (window.confirm("Delete this user?")) {
        deleteUser(selectedUser._id)
      }
      setShowMenu(false);
    }}
    className='w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10'
  >
    Delete User
  </button>

</div>
  )}

</div>
  </div>
    {/* ------Chat Area------ */}
{
  summary && (

    <div className='mx-4 mt-2
    bg-[#2a2a2a]
    text-white p-3
    rounded-lg'>

      <h3 className='font-bold text-sm text-purple-400'>
        AI Summary
      </h3>

      <p className='text-sm mt-1'>
        {summary}
      </p>

    </div>

  )
}
    <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
 {messages.map((msg, index) => {



  return (
    <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
  {msg.image ? (

  <img
    src={msg.image}
    alt=""
    className='max-w-[230px]
    border border-gray-700
    rounded-lg overflow-hidden
    mb-8'
  />

) : msg.audio ? (

  <audio
    controls
    src={msg.audio}
    className='mb-8 max-w-[230px]'
  />

) : (
       <div className='relative'>

 <div

  onContextMenu={(e) => {
    e.preventDefault();
    setReplyMessage(msg);
  }}

  onClick={() =>
    setSelectedMessage(
      selectedMessage === msg._id
        ? null
        : msg._id
    )
  }
  className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
    msg.senderId === authUser._id
      ? 'rounded-br-none'
      : 'rounded-bl-none'
  }`}
>

 {msg.replyTo?.text && (

    <div className='bg-black/20 p-2 rounded mb-1'>

    <span className='text-xs text-gray-300 block'>
        Reply
      </span>

     <span className='text-xs text-white truncate block'>
       {msg.replyTo?.text}
      </span>

    </div>

  )}

 <span>{msg.text}</span>
{
  translatedMessages[msg._id] && (

    <p className='text-xs
    text-green-300 mt-2'>

      {
        translatedMessages[msg._id]
      }

    </p>

  )
}
</div>

  {selectedMessage === msg._id && (

    <div className='absolute -top-10 left-0 flex gap-2 bg-[#1f1f1f] px-3 py-1 rounded-full shadow-lg z-50'>

      <button
        onClick={() =>
          reactToMessage(msg._id, "❤️")
        }
      >
        ❤️
      </button>

      <button
        onClick={() =>
          reactToMessage(msg._id, "😂")
        }
      >
        😂
      </button>

      <button
        onClick={() =>
          reactToMessage(msg._id, "🔥")
        }
      >
        🔥
      </button>
      <button
  onClick={() =>
    handleTranslate(
      msg._id,
      msg.text
    )
  }
>
  🌐
</button>

    </div>

 )}

{msg.reactions?.emoji && (
  <div className='absolute -bottom-5 right-2 text-sm bg-[#1f1f1f] px-2 rounded-full'>
    {msg.reactions.emoji}
  </div>
)}

</div>

      )}

      <div className="text-center text-xs">
  <img 
    src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} 
    alt="" 
    className='w-7 rounded-full' 
  />
 <div className='flex items-center gap-1 text-gray-500'>

  <p>{formatMessageTime(msg.createdAt)}</p>

  {msg.senderId === authUser._id && (
    <>
      {msg.status === "sent" && (
        <span>✓</span>
      )}

      {msg.status === "delivered" && (
        <span>✓✓</span>
      )}

      {msg.status === "seen" && (
        <span className='text-blue-400'>
          ✓✓
        </span>
      )}
    </>
  )}

</div>
</div>
    </div>
  );
})}

<div ref={scrollEnd}>   </div>
</div>
{replyMessage && (

  <div className='absolute bottom-20 left-3 right-3 bg-[#1f1f1f] p-2 rounded-lg flex justify-between items-center z-50'>

    <div>

      <p className='text-xs text-gray-400'>
        Replying to
      </p>

      <p className='text-sm text-white truncate'>
        {replyMessage.text}
      </p>

    </div>

    <button
      onClick={() => setReplyMessage(null)}
      className='text-white'
    >
      ✕
    </button>

  </div>

)}
{/* ----- bottom area ----- */}
<div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
  <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'> 
    <input onChange={(e) => {

  setInput(e.target.value);

  socket.emit("typing", {
    receiverId: selectedUser._id,
    senderName: authUser.fullName
  });

  setTimeout(() => {
    socket.emit("stopTyping", {
      receiverId: selectedUser._id
    });
  }, 1000);

}}

value={input} onKeyDown={(e)=>e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Send a message"
    className='flex-1 text-sm p-3 boredr-none rounded-lg outline-none text-white placeholder-gray-400'/>
    
    <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden/>
  <button
type="button"
onClick={() => setShowEmojiPicker(!showEmojiPicker)}
className='text-2xl mr-2'
>
😀
</button>
    <label htmlFor="image">
      
      <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer'/>
    </label>
   <button
  type="button"
  onClick={handleVoiceRecord}
  className='text-white text-xl
  mr-2 hover:text-green-400
  transition'
>

  {
    isRecording
    ? <AiFillStop />
    : <FaMicrophone />
  }

</button>
    {showEmojiPicker && (
  <div className='absolute bottom-16 right-16 z-50'>
    <EmojiPicker onEmojiClick={handleEmojiClick} />
  </div>
)}
  </div>
  
  <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
</div>
</div>
  ) : (
     <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
  <img src={assets.logo_icon} className='max-w-16' alt="" />
  <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
</div>
  )
}


export default ChatContainer