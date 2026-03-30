// sub root (router in all components page )
import { BrowserRouter as Router, Routes, Route, Navigate  } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/axios";
import Login from "./components/Login";
import Register from "./components/Register";
import About from "./components/about";
import Home from "./components/Home";
import Contact from "./components/Contact";
import Header from "./components/Header";
import Forgot from "./components/Forgot";
import Reset from "./components/Reset";
import Footer from "./components/Footer";
import Notifications from "./components/Notifications";
import "./styles/main.css";
import "./styles/responsive.css"
import ScrollToTop from "./components/ScrollToTop";
import { CategoryTagProvider } from "./context/CategoryTagContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
api.defaults.withCredentials = true;

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/me", {
          withCredentials: true,
        });

        setUser(res.data.user); 
      } catch (err) {
        console.log("Session check failed:", err?.response?.status);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);


 if (loading) {
    return <div>Loading...</div>; 
  }
  return (
   
    <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop />
      <Header user={user} setUser={setUser}/>
      
        
      <Routes>
        
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login setUser={setUser} />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        

        {/* Navbar only on Home */}
        <Route
          path="/home"
          element={
            user ? (
              <CategoryTagProvider>
                <Home user={user} />
              </CategoryTagProvider>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/notifications" element={<Notifications />} />
       
       
      </Routes>
      <Footer />
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
 
  );
}

export default App;
