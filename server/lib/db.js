// import mongoose from "mongoose";

// // Function to connect to the mongodb database
// export const connectDB = async () => {
//     try {
//         mongoose.connection.on('connected', () => console.log('Database Connected'));
//         await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
//     } catch (error) {
//         console.log(error);
//     }
// }



import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "chat-app",
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1); 
  }
};
