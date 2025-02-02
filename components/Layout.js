// components/Layout.js
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a2b23]">
      <Header />
      <main className="flex-1 pt-16 relative flex flex-col">
        {children}
      </main>
    </div>
  );
}