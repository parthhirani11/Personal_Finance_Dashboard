import Dashboard from "../models/Dashboard.js";
import Account from "../models/Account.js";
import mongoose from "mongoose";

// create Dashboard
export const createDashboard = async (req, res) => {
  const userId = req.session.user.id;
  const { name } = req.body;

  const count = await Dashboard.countDocuments({ userId });

  const dashboard = await Dashboard.create({
    userId,
    name,
    isDefault: count === 0 // first dashboard auto default
  });

  res.json(dashboard);
};

// get Dashboards
export const getDashboards = async (req, res) => {
  try {
    const userId = req.session.user.id;

    let dashboards = await Dashboard.find({ userId })
      .sort({ createdAt: 1 });

    // 🔥 IMPORTANT PART
    if (dashboards.length === 0) {
      const defaultDashboard = await Dashboard.create({
        userId,
        name: "Default",
        isDefault: true,
      });

      dashboards = [defaultDashboard];
    }

    res.json(dashboards);
  } catch (err) {
    console.error("Get dashboards error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// rename Dashboard
export const renameDashboard = async (req, res) => {
  await Dashboard.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.user.id },
    {
      name: req.body.name,
      isDefault: false   // 🔥 important
    }
  );

  res.json({ success: true });
};

// delete dashboard
export const deleteDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;

    // 🔒 Count dashboards
    const count = await Dashboard.countDocuments({ userId });

    if (count <= 1) {
      return res.status(400).json({
        msg: "At least one dashboard is required"
      });
    }

    // delete transactions
    // await Account.deleteMany({ dashboardIds: id, userId });
    await Account.deleteMany({
      dashboardIds: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId)
    });


    // delete dashboard
    await Dashboard.findOneAndDelete({ _id: id, userId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get dashboards of OTHER USER (for settlement)
export const getDashboardsByUserId = async (req, res) => {
  try {

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId required"
      });
    }

    const dashboards = await Dashboard.find({ userId })
      .select("_id name")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      dashboards
    });

  } catch (err) {

    console.error("getDashboardsByUserId error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};


