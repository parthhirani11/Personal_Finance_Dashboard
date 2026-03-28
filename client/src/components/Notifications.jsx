import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer} from "react-toastify";

export default function Notifications(){

    const [notifications,setNotifications] = useState([]);
    const [dashboards,setDashboards] = useState([]);
    const [activeId,setActiveId] = useState(null);
    const [selectedDashboard,setSelectedDashboard] = useState("");

    const navigate = useNavigate();

    useEffect(()=>{
        fetchNotifications();
        fetchDashboards();
    },[]);

    const fetchNotifications = async ()=>{
        const res = await api.get("/notifications");
        
        setNotifications(res.data.notifications || []);
        
    };

    const fetchDashboards = async ()=>{
        const res = await api.get("/dashboard");
        setDashboards(res.data || []);
    };

    const markRead = async (id)=>{
        await api.post(`/notifications/read/${id}`);
        setNotifications(prev=>prev.filter(n=>n._id!==id));
    };

    const moveDashboard = async (settlementId) => {
  try {
    if (!selectedDashboard) {
      toast.error("Please select dashboard"); 
      return;
    }

    await api.post("/settlement/move-dashboard", {
      settlementId,
      dashboardId: selectedDashboard
    });

    
    const selectedDashObj = dashboards.find(d => d._id === selectedDashboard);

    // toast.success(`Record moved to "${selectedDashObj?.name}" dashboard`);

    setActiveId(null);
    setSelectedDashboard("");

    // 🔥 redirect to that dashboard
    navigate("/home", {
  state: { 
    dashboardId: selectedDashboard,
    toastMsg: `Record moved to "${selectedDashObj?.name}" dashboard`
  }
});
    // navigate("/home", {
    //   state: { dashboardId: selectedDashboard }
    // });

  } catch (err) {
    console.error(err);
    toast.error("Failed to move record");
  }
};


    return(

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

            {notifications.length===0 &&(
                <p className="no-notification">No notifications</p>
            )}

            <div className="notification-list">

                {notifications.map(n=>(

                    <div
                        key={n._id}
                        className={`notification-card ${!n.isRead?"unread":""}`}
                    >
                        <div className="notification-top">

                            <div className="notification-content">

                                <h4>{n.title}</h4>

                                <p>{n.message}</p>

                                <small>
                                    {new Date(n.createdAt).toLocaleString()}
                                </small>

                            </div>

                            <div className="notification-actions">
                                {n.type === "settlement" && (n.status === "pending" || !n.status) && (

                                    <button
                                        className="yes-btn"
                                        onClick={()=>setActiveId(n._id)}
                                    >
                                        Move Dashboard Recode
                                    </button>

                                )}

                                {!n.isRead &&(

                                    <button
                                        className="mark-read-btn"
                                        onClick={()=>markRead(n._id)}
                                    >
                                        Mark Read
                                    </button>

                                )}

                                
                            </div>

                        </div>

                        {/* ========= EXPAND AREA ========= */}
                        {activeId===n._id && (

                        <div className="dashboard-change-box">

                            <div className="change-header">
                                <p>Do you want to move this transaction record to another dashboard?</p>
                            </div>

                            <div className="change-body">

                                <select
                                    value={selectedDashboard}
                                    onChange={(e)=>setSelectedDashboard(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    {dashboards.map(d=>(
                                        <option key={d._id} value={d._id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>

                                <div className="change-actions">

                                    <button
                                        onClick={()=>moveDashboard(n.settlementId)}
                                        className="confirm-btn"
                                    >
                                        ✔
                                    </button>

                                    <button
                                        onClick={()=>setActiveId(null)}
                                        className="cancel-btn"
                                    >
                                        ✖
                                    </button>

                                </div>

                            </div>

                        </div>

                        )}


                    </div>

                ))}

            </div>
            {/* <ToastContainer position="top-center" autoClose={3000} /> */}

        </div>

    );

}
