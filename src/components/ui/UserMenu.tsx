// components/ui/UserMenu.tsx
'use client';

import { useNhostClient, useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

export function UserMenu() {
  const nhost = useNhostClient();
  const router = useRouter();
  const { isAuthenticated } = useAuthenticationStatus();

  const handleLogout = async () => {
    try {
      await nhost.auth.signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Don't show the menu if not authenticated
  if (!isAuthenticated) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push('/signin')}
      >
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}