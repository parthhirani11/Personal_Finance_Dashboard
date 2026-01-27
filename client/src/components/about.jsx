import incomeImg from "../assets/about3.png";
export default function About() {
  return (
    <section className="about-page">
      <div className="about-card">

        {/* IMAGE */}
        <div className="about-image">
          <img src={incomeImg} alt="Income" />
        </div>

        {/* CONTENT */}
        <div className="about-content">
          <h2>Welcome to Our Website</h2>

          <p>
            We are a passionate team focused on building user-friendly applications.
            Our mission is to simplify financial management and provide a clean and
            meaningful digital experience to every user.
          </p>

          <p>
            With technology, design, and creativity — we help users track
            expenses, manage tags, and analyze income.
          </p>

          <ul>
            <li>Simple Interface</li>
            <li>Smart Features</li>
            <li>Fast & Secure</li>
          </ul>
        </div>

      </div>
    
    </section>
    
  );
}

