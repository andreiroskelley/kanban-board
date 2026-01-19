import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UserMenu } from "@/components/ui/UserMenu";  // Import UserMenu
import "./globals.css";
import Link from "next/link";
import Providers from "./providers";
import { Button } from "@/components/ui/button";  // You can keep this for mobile button

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Kanban Board Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {/* Navigation Bar */}
          <nav className="bg-white shadow-md border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                {/* Left side: Logo and Navigation */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-800">
                      Kanban Board
                    </h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      href="/"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Home
                    </Link>
                    <Link
                      href="/about"
                      className="border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      About
                    </Link>
                    <Link
                      href="/boards"
                      className="border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Boards
                    </Link>
          
                  </div>
                </div>

                {/* Right side: User dropdown - USING USERMENU COMPONENT */}
                <div className="flex items-center space-x-4">
                  {/* UserMenu component handles the dropdown and logout */}
                  <UserMenu />

                  {/* Mobile menu button (optional) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                  >
                    <span className="sr-only">Open menu</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}