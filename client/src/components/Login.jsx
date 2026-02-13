// login page 
import api from "../api/axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // fetch  data and navigete ih home page
   const handleLogin = async (e) => {
    e.preventDefault();

     let newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const res = await api.post("/auth/login", { email, password },{ withCredentials: true });
      setUser(res.data.user);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="container-center">
      <form className="auth-box" onSubmit={handleLogin} noValidate>
        <h3>Login</h3>

        {error && <p className="text-danger">{error}</p>}
        {errors.email && <p className="error-text">{errors.email}</p>}
        <input
          type="email"
          placeholder="Email"
          className={`form-input mb-3 ${errors.email ? "input-error" : ""}`}
          value={email}
          onChange={e =>{ 
            setEmail(e.target.value);
            setErrors({ ...errors, email: "" });
          }}
          
        />
        {errors.password && <p className="error-text">{errors.password}</p>}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={`form-input ${errors.password ? "input-error" : ""}`}
            value={password}
            onChange={e => {
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


        <button type="submit" className="btn btn-primary w-100 mt-3">
          Login
        </button>

        <p className="mt-3">
          Don’t have an account? <Link to="/signup">Signup</Link>
        </p>

        <Link to="/forgot">Forgot Password?</Link>
      </form>
    </div>
  );
}

export default Login;
