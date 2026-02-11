// header page 
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/logo2.png"; 
import { NavLink } from "react-router-dom";
import { FiHome, FiInfo, FiPhone,FiLogOut  } from "react-icons/fi";

export default function TopHeader({ user, setUser }) {
  const navigate = useNavigate();

  // logout user
  const logout = async () => {
    await api.post("/auth/logout", {}, { withCredentials: true });
    setUser(null);
    navigate("/login");
  };


  return (
   <div className="top-header">
  <div className="container-fluid px-4 d-flex justify-content-between align-items-center">

    {/* BRAND */}
    <div className="brand-wrap">
      <img src={logo} alt="Code Decorator" className="brand-logo" />

      <div className="brand-text">
        <h3 className="brand-title m-0">Personal Finance Dashboard</h3>
        <p className="brand-desc m-0">
          Track your income, expenses, and build better financial habits
        </p>
      </div>
    </div>
    {/* home contect contact page navigation */}
    {user && (
     <div className="d-flex gap-4">
        <NavItem to="/home" label="Home" Icon={FiHome} />
        <NavItem to="/about" label="About" Icon={FiInfo} />
        <NavItem to="/contact" label="Contact" Icon={FiPhone} />
      </div>
    )}
    {/* USER data  with logout btn */}
    {user && (
      
      <div className="d-flex align-items-center gap-3">
        <span className="user-name d-none d-lg-inline">
          Hello, <strong>{user.name}</strong>
        </span>
       <button
          onClick={logout}
          className="logout-btn d-flex align-items-center"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </div>
    )}
  </div>
</div>
  );
}
//Navigation is page redirection.
function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `page-link d-flex align-items-center gap-2 ${isActive ? "page-active" : ""}`
      }
    >
      {Icon && <Icon className="nav-icon" />}
      <span>{label}</span>
    </NavLink>
  );
}
