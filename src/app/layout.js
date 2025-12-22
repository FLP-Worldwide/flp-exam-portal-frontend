import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import 'ionicons/css/ionicons.min.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Testyourgerman.com Exam Portal | testyourgerman.com",
  description: "Test your german APP by Testyourgerman.com Exam Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >



        


        {children}
      </body>
    </html>
  );
}
