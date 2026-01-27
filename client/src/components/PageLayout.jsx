import Navbar from "./Navbar";
import Header from "./Header";

export default function Layout({ user, logout, children }) {
  return (
    <>
      <Header user={user} logout={logout} />
      <Navbar />
      <main className="container-fluid px-4 pt-4">
        {children}
      </main>
    </>
  );
}
