"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ProfileCardClient() {
  const handleClick = () => {
    console.log('clicked');
    console.log('API Base:', process.env.NEXT_PUBLIC_API_BASE);
  };

  useEffect(() => {
    console.log('Environment variable check:', process.env.NEXT_PUBLIC_API_BASE);
  }, []);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-5 w-80 text-center">
        {/* Profile Image */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
          AJ
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-800 mb-1">Andrei Roskelley</h2>
        <p className="text-gray-600 mb-4">Web Developer</p>
        
        {/* Bio */}
        <p className="text-gray-700 text-sm mb-5 px-2">
          Learning web devlelopment and machine learning
        </p>
        
    

        {/* Environment info */}
     
      </div>
    </div>
  );
}