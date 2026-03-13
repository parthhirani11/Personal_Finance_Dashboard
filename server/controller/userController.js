import User from "../models/User.js";

/**
 * GET /api/users/by-email?email=test@gmail.com
 */
export const getUserByUserId = async (req, res) => {
  try {

    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findOne({ name }).select("_id userId email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {

    console.error("getUserByUserId error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};