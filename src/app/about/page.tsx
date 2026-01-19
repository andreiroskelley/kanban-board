import type { Metadata } from "next";
import ProfileCardClient from "@/components/ProfileCard";
import EnvTest from "@/components/EnvTest";
export const metadata: Metadata = {
  title: "About Us | MyApp",
  description: "Learn more about our company, mission, and team",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* About Content */}
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">About Page</h1>
        </div>
      </div>


      {/* Profile Card Section */}
      <ProfileCardClient />
    </div>
  );
}