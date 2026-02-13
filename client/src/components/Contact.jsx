// contect page 
import { useState } from "react";
import api from "../api/axios";
import contactImg from "../assets/contact1.png";
import { toast } from "react-toastify";

export default function Contact() {
  const [form, setForm] = useState({
    nname: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  // set data
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitContact = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!form.nname.trim()) {
      newErrors.nname = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!form.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await api.post("/auth/contact", form);

      toast.success(res.data.msg || "Message sent successfully");
      setForm({ nname: "", email: "", message: "" });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send message");
    }
  };


  return (
    <section className="contact-page">
      <div className="contact-card">

        {/* IMAGE */}
        <div className="contact-image">
          <img src={contactImg} alt="Contact" />
        </div>

        {/* FORM */}
        <form className="contact-form" onSubmit={submitContact} noValidate>
          <h2>Get in Touch</h2>

          {errors.nname && <p className="error-text">{errors.nname}</p>}
          <input
            className={`form-input mb-3 ${errors.nname ? "input-error" : ""}`}
            name="nname"
            placeholder="Enter your full name"
            autoComplete="off" 
            value={form.nname}
            onChange={handleChange}
            required
          />

          {errors.email && <p className="error-text">{errors.email}</p>}
          <input
            className={`form-input mb-3 ${errors.email ? "input-error" : ""}`}
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="off" 
            value={form.email}
            onChange={handleChange}
            required
          />

          {errors.message && <p className="error-text">{errors.message}</p>}
          <textarea
            className={`form-textarea ${errors.message ? "input-error" : ""}`}
            name="message"
            rows="5"
            placeholder="Write your message..."
            autoComplete="off" 
            value={form.message}
            onChange={handleChange}
            
          />

          <button className="send-btn" type="submit">
            Send Message
          </button>
        </form>

      </div>
    </section>
  );
}
