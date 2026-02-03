// reset password and set new password
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // set new password
  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
  const res = await api.post("/auth/reset", {
    email,
    password,
    confirmPassword,
  });

  toast.success(res.data.message || "Password reset successful");
  navigate("/login");

} catch (err) {
  toast.error(
    err.response?.data?.message || "Error resetting password"
  );
}
  };

  return (
    <div className="container-center">
      
      <form className="auth-box"onSubmit={resetPassword}>
          <div className="mt-4">
            <Link to="/forgot" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div> 
        <h3>Reset Password</h3>
       
        <input
          type="password"
           className="form-input mb-2"
          placeholder="Enter New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
           className="form-input mb-2"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary mb-3" type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default Reset;
 