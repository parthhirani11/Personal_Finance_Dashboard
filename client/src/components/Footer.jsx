import { FaInstagram, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { FaRegCopyright } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-social">
        <a href="https://instagram.com" target="_blank" rel="noreferrer">
          <FaInstagram />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer">
          <FaLinkedinIn />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noreferrer">
          <FaFacebookF />
        </a>
      </div>

      <div className="footer-copy">
        <FaRegCopyright />
        <span>2026 Expense Tracker. All rights reserved.</span>
      </div>
    </footer>
  );
}
