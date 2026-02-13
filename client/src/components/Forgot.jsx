// forgot password and send otp page
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft } from "react-icons/fi";

import api from "../api/axios"; 

//  To send an OTP in the mail
function Forgot() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // send otp funtion 
  const sendOtp = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

  //  verify otp
  const verifyOtp = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
      
      {/* send otp in mail */}
      {!showOtp ? (
        <form className="auth-box" onSubmit={sendOtp} noValidate>
          <div className="mt-4">
            <Link to="/login" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div>
            <h3>Forgot Password</h3>
            {msg && <p style={{ color: "green" }}>{msg}</p>}
            {errors.email && <p className="error-text">{errors.email}</p>}
            <input
                type="email"
                className={`form-input mb-3 ${errors.email ? "input-error" : ""}`}
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}

            />
            <button className="btn btn-primary mb-3" type="submit" disabled={loading}>{loading ? <span className="spinner"></span> : "Send OTP"}</button>
        </form>
      ) : (

        // Verify OTP and enter otp
        <form className="auth-box" onSubmit={verifyOtp} noValidate>
             <div className="mt-4">
            <Link to="/login" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div>      
          <h3>Enter OPT</h3>
          {msg && <p style={{ color: "green" }}>{msg}</p>}
          {errors.otp && <p className="error-text">{errors.otp}</p>}
          <input
            type="text"
            className={`form-input mb-3 ${errors.otp ? "input-error" : ""}`}
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setErrors({ ...errors, otp: "" });
            }}
          />

          <button className="btn btn-primary mb-3" type="submit" disabled={loading}> {loading ? <span className="spinner"></span> : "Verify OTP"}</button>
        </form>
      )}
    </div>
  );
}

export default Forgot;

