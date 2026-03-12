const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const tokenBlacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserController
 * @description This function handles user registration. It checks if the user already exists, hashes the password, creates a new user, generates a JWT token, and sends a response with the token and user information.
 * @returns {Object} A JSON response indicating success or failure of the registration process, along with a JWT token and user information if successful.
 * @access Public
 */
async function registerUserController(req, res) {
 
  try {
    const { username, email, password } = req.body;
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // required for https (devtunnel is https)
      sameSite: "none", // required for cross-origin
    });
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * @name loginUserController
 * @description This function handles user login. It checks if the user exists, compares the provided password with the stored hashed password, generates a JWT token if the credentials are valid, and sends a response with the token and user information. If the user is not found or the credentials are invalid, it sends an appropriate error response.
 * @returns {Object} A JSON response indicating success or failure of the login process, along with a JWT token and user information if successful.
 * @access Public
 */
async function loginUserController(req, res) {
 
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // required for https (devtunnel is https)
      sameSite: "none", // required for cross-origin
    });
    res.status(200).json({
      message: "Login successful",
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * @name logoutUserController
 * @description This function handles user logout. It retrieves the JWT token from the cookies, adds it to a blacklist to prevent future use, and clears the authentication cookie. If an error occurs during the logout process, it sends an appropriate error response.
 * @access Public
 */
async function logoutUserController(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "No token found" });
    }
    if (token) {
      await tokenBlacklistModel.create({ token });
    }
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * @name getMeController
 * @description This function retrieves the currently authenticated user's information. It uses the user ID from the JWT token to find the user in the database, excluding the password field. If the user is found, it sends a response with the user information. If the user is not found or an error occurs, it sends an appropriate error response.
 * @returns {Object} A JSON response containing the authenticated user's information if successful, or an error message if the user is not found or if a server error occurs.
 * @access Private
 */
async function getMeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
