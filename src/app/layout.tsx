import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlackTape - AI-Powered Foresight Copilot',
  description: 'Stress-test strategic plans before the point of no return',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-blacktape-50">
          <header className="bg-blacktape-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-blacktape-950 font-bold text-sm">BT</span>
                  </div>
                  <span className="font-semibold text-lg">BlackTape</span>
                  <span className="text-blacktape-400 text-sm hidden sm:inline">
                    Foresight Copilot
                  </span>
                </div>
                <nav className="flex items-center gap-4">
                  <a
                    href="/"
                    className="text-blacktape-300 hover:text-white transition-colors text-sm"
                  >
                    Dashboard
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
