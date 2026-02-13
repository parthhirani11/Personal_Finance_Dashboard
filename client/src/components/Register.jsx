// register new user page 
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const navigate = useNavigate();
  //  store new user data
  const register = async () => {
    try {
      setLoading(true);

      const res = await api.post("/auth/signup", form);

      toast.success(res.data.msg); // ✅ show backend success msg

      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      console.error("REGISTER ERROR:", err);

      toast.error(err.response?.data?.msg || "Register failed"); // ✅ backend error msg
    } finally {
      setLoading(false);
    }
  };
  // seve new user data 
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   register();
  // };

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    register();
  };


  return (
    <div className="container-center">
      {/* Toast container */}
      <ToastContainer position="top-center" autoClose={3000} />

      <form className="auth-box" onSubmit={handleSubmit} noValidate> 
        <h3>Register</h3>

        {errors.name && <p className="error-text">{errors.name}</p>}
        <input
          type="text"
          className={`form-input mb-3${errors.name ? "input-error" : ""}`}
          placeholder="Name"
          value={form.name}
          onChange={e => {
            setForm({ ...form, name: e.target.value });
            setErrors({ ...errors, name: "" });
          }}
        />


        {errors.email && <p className="error-text">{errors.email}</p>}
        <input
          type="email"
          className={`form-input mb-3 ${errors.email ? "input-error" : ""}`}
          placeholder="Email"
          value={form.email}
          onChange={e => {
            setForm({ ...form, email: e.target.value });
            setErrors({ ...errors, email: "" });
          }}
        />


       {errors.password && <p className="error-text">{errors.password}</p>}
        <input
          type="password"
          className={`form-input mb-3 ${errors.password ? "input-error" : ""}`}
          placeholder="Password"
          value={form.password}
          onChange={e => {
            setForm({ ...form, password: e.target.value });
            setErrors({ ...errors, password: "" });
          }}
        />


        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
          disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="mt-3">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;

