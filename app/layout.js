import "./globals.css";

// Using system fonts as fallbacks to avoid network issues
const fontVariables = "font-sans";

export const metadata = {
  title: "SWMS AI Tools Suite",
  description: "Intelligent Operations Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-gray-900 text-gray-100 font-sans"
      >
        {children}
      </body>
    </html>
  );
}
