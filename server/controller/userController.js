import User from "../models/User.js";

export const getUserByUserId = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const users = await User.find({
      name: { $regex: name.trim(), $options: "i" }
    })
    .select("_id name email")
    .limit(10);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error("getUserByUserId error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

