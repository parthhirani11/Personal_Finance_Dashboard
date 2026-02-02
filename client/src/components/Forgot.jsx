import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft } from "react-icons/fi";

import api from "../api/axios"; 

function Forgot() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot/send-otp", { email });
      toast.success(res.data.msg || "OTP sent to your email");
      setShowOtp(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error sending OTP");
    } finally {
    setLoading(false);
  }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
      setLoading(true);
    try {
      await api.post("/auth/forgot/verify-otp", { email, otp });
      // redirect to reset page
      toast.success("OTP verified");
      window.location.href = `/reset?email=${email}`;
    } catch (err) {
      toast.error(err.response?.data?.msg || "OTP verification failed");
    }finally {
    setLoading(false);
  }
  };

  return (
    <div className="container-center">
      

      {!showOtp ? (
        <form className="auth-box" onSubmit={sendOtp}>
          <div className="mt-4">
            <Link to="/login" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div>
            <h3>Forgot Password</h3>
            {msg && <p style={{ color: "red" }}>{msg}</p>}
            <input
                type="email"
                className="form-input mb-3" placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button className="btn btn-primary mb-3" type="submit" disabled={loading}>{loading ? <span className="spinner"></span> : "Send OTP"}</button>
        </form>
      ) : (
        <form className="auth-box" onSubmit={verifyOtp}>
             <div className="mt-4">
            <Link to="/login" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div>      
          <h3>Enter OPT</h3>
          {msg && <p style={{ color: "red" }}>{msg}</p>}
          <input
            type="text"
            className="form-input mb-3"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button className="btn btn-primary mb-3" type="submit" disabled={loading}> {loading ? <span className="spinner"></span> : "Verify OTP"}</button>
        </form>
      )}
    </div>
  );
}

export default Forgot;

