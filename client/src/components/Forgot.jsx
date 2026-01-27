import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api from "../api/axios"; 

function Forgot() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [msg, setMsg] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/forgot/send-otp", { email });
      setMsg(res.data.msg || "OTP sent to your email");
      setShowOtp(true);
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error sending OTP");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot/verify-otp", { email, otp });
      // redirect to reset page
      window.location.href = `/reset?email=${email}`;
    } catch (err) {
      setMsg(err.response?.data?.msg || "OTP verification failed");
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
                className="form-input" placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button className="btn btn-primary mb-3" type="submit">Send OTP</button>
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
            className="form-input"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button className="btn btn-primary mb-3" type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
}

export default Forgot;

