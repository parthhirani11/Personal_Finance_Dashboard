import { BrowserRouter as Router, Routes, Route, Navigate  } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "./api/axios";
import Login from "./components/Login";
import Register from "./components/Register";
import About from "./components/about";
import Home from "./components/Home";
import Contact from "./components/Contact";
// import Layout from "./layouts/Layout";
import Header from "./components/Header";
import Forgot from "./components/Forgot";
import Reset from "./components/Reset";
import Edit from "./components/Edit";
import Footer from "./components/Footer";
import "./styles/main.css";
import ScrollToTop from "./components/ScrollToTop";
api.defaults.withCredentials = true;

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
useEffect(() => {
  const checkSession = async () => {
    try {
      const res = await api.get(
        "/auth/me",
        { withCredentials: true }
      );
      setUser(res.data);
    } catch {
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
   
    <Router>
      <ScrollToTop />
      <Header user={user} setUser={setUser}/>
        
      <Routes>
        <Route path="/login"element={ user ? <Navigate to="/home" replace /> : <Login setUser={setUser} /> }/>
        <Route path="/login" element={<Login setUser={setUser}/>} />
        <Route path="/signup" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />

        {/* Navbar only on Home */}
        <Route path="/home"element={ user ?  <Home user={user} /> : <Navigate to="/login" replace /> }/>
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
        <Footer />
    </Router>
  
  );
}

export default App;
