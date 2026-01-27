// import { NavLink } from "react-router-dom";
// import { FiHome, FiInfo, FiPhone } from "react-icons/fi";

// export default function PageNavbar() {
//   return (
//     <div className="page-navbar">
//       <div className="container-fluid px-4 d-flex align-items-center justify-content-between">

//         {/* LEFT TITLE */}
//         <h4 className="navbar-title">
//           My Account Management
//         </h4>

//         {/* RIGHT NAV LINKS */}
//         <div className="d-flex gap-4">
//           <NavItem to="/home" label="Home" Icon={FiHome} />
//           <NavItem to="/about" label="About" Icon={FiInfo} />
//           <NavItem to="/contact" label="Contact" Icon={FiPhone} />
//         </div>

//       </div>
//     </div>
//   );
// }

// // NavItem defined here
// function NavItem({ to, label, Icon }) {
//   return (
//     <NavLink
//       to={to}
//       className={({ isActive }) =>
//         `page-link d-flex align-items-center gap-2 ${isActive ? "page-active" : ""}`
//       }
//     >
//       {Icon && <Icon className="nav-icon" />}
//       <span>{label}</span>
//     </NavLink>
//   );
// }

