
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
  const navigate = useNavigate();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    register();
  };

  return (
    <div className="container-center">
      {/* Toast container */}
      <ToastContainer position="top-center" autoClose={3000} />

      <form className="auth-box" onSubmit={handleSubmit}>
        <h3>Register</h3>

        <input
          type="text"
          className="form-input"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          className="form-input"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          className="form-input"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
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

