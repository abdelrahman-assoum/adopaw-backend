require('dotenv').config();
const cors = require('cors');
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const profileRoutes = require("./routes/profileRoute");
const petRoutes = require("./routes/petRoute");
const commentRoutes = require("./routes/commentRoute");
const chatRoute = require('./routes/chatRoute');
const chatRealtimeRoute = require('./routes/chatRealtimeRoute');


dotenv.config({ quiet: true });

connectDB();

const app = express();
app.use(cors());
app.use(express.json()); 

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/profile", profileRoutes);
app.use("/pet", petRoutes);
app.use("/comment", commentRoutes);
app.use('/chat', chatRealtimeRoute);

// >>> Add realtime bootstrap (feature-flagged)
const { bootstrapRealtime } = require('./realtime/bootstrap');
const { server } = bootstrapRealtime(app);


const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// }
 if (server) {
   server.listen(PORT, () => console.log('API+WS on', PORT));
 } else {
   app.listen(PORT, () => console.log('API on', PORT));
 }
;
