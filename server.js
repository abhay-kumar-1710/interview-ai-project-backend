require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to the MERN Authentication API");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});