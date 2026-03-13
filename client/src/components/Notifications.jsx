import { useEffect, useState } from "react";
import api from "../api/axios";
import { FaBell  } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Notifications(){

 const [notifications,setNotifications] = useState([]);
 const navigate = useNavigate();

 const fetchNotifications = async ()=>{

   const res = await api.get("/notifications");

   setNotifications(res.data.notifications);

 };

 useEffect(()=>{
   fetchNotifications();
 },[]);


 // ✅ mark read function
 const markRead = async (id) => {

  await api.post(`/notifications/read/${id}`);

  // remove from UI
  setNotifications(prev =>
    prev.filter(n => n._id !== id)
  );

};
//  const markRead = async(id)=>{

//    await api.post(`/notifications/read/${id}`);

//    fetchNotifications();

//  };

return (


<div className="notification-page">
    <div className="notification-header">

<button 
 className="back-btn"
 onClick={()=>navigate("/home")}
>
← Back
</button>

</div>

  <h2 className="notification-title">🔔 Notifications</h2>

  {notifications.length === 0 && (
    <p className="no-notification">No notifications</p>
  )}

  <div className="notification-list">

  {notifications.map(n => (

    <div 
      key={n._id} 
      className={`notification-card ${!n.isRead ? "unread" : ""}`}
    >

      <div className="notification-content">

        <h4>{n.title}</h4>

        <p>{n.message}</p>

        <small>
          {new Date(n.createdAt).toLocaleString()}
        </small>

      </div>

      {!n.isRead && (

        <button
          className="mark-read-btn"
          onClick={()=>markRead(n._id)}
        >
          Mark Read
        </button>

      )}

    </div>

  ))}

  </div>

</div>

);

}