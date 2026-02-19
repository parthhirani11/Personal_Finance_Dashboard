// reset password and set new password
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // set new password
  const resetPassword = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!password.trim()) {
      newErrors.password = "New password is required";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
      
      <form className="auth-box"onSubmit={resetPassword} noValidate>
          <div className="mt-4">
            <Link to="/forgot" className="back-icon-link">
              <FiArrowLeft />
            </Link>
          </div> 
        <h3>Reset Password</h3>
       {errors.password && ( <p className="error-text">{errors.password}</p> )}
       
         <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            className={`form-input mb-3 ${
              errors.password ? "input-error" : ""
            }`}
            placeholder="Enter New Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: "" });
            }}
          />

          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>


        {errors.confirmPassword && (<p className="error-text">{errors.confirmPassword}</p>)}
     
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className={`form-input ${
              errors.confirmPassword ? "input-error" : ""
            }`}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors({ ...errors, confirmPassword: "" });
            }}
          />

          <span
            className="eye-icon"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <button className="btn btn-primary mt-3" type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default Reset;
 