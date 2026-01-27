import api from "../api/axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const navigate = useNavigate();

   const handleLogin = async (e) => {
    e.preventDefault();
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
      <form className="auth-box" onSubmit={handleLogin}>
        <h3>Login</h3>

        {error && <p className="text-danger">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="form-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

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
