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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitContact = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/contact", form);

      toast.success(res.data.msg || "Message sent successfully");
      setForm({ nname: "", email: "", message: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.msg || "Failed to send message"
      );
      console.error(err);
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
        <form className="contact-form" onSubmit={submitContact}>
          <h2>Get in Touch</h2>

          <input
            className="form-input"
            name="nname"
            placeholder="Enter your full name"
            autoComplete="off" 
            value={form.nname}
            onChange={handleChange}
            required
          />

          <input
            className="form-input"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="off" 
            value={form.email}
            onChange={handleChange}
            required
          />

          <textarea
            className="form-textarea"
            name="message"
            rows="5"
            placeholder="Write your message..."
            autoComplete="off" 
            value={form.message}
            onChange={handleChange}
            required
          />

          <button className="send-btn" type="submit">
            Send Message
          </button>
        </form>

      </div>
    </section>
  );
}
