import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {

  try {

    const userId = req.session.user.id;

    const data = await Notification.find({ userId })
      .sort({ createdAt: -1 });

    // ✅ FIXED RESPONSE FORMAT
    res.json({
      success: true,
      notifications: data
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });

  }

};


export const markRead = async (req,res)=>{

 try{

  await Notification.findByIdAndDelete(req.params.id);

  res.json({
    success:true,
    message:"Notification deleted"
  });

 }catch(err){

  res.status(500).json({
    success:false,
    message:"Failed to delete notification"
  });

 }

};