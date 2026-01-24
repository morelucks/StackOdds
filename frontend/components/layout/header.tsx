"use client"

import Link from "next/link"
import { Search, Trophy, Menu, Home, PlusCircle, LogOut, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useUserRights } from "@/hooks/useUserRights"
import { useStacks } from "@/hooks/useStacks"
import { BitcoinWalletSelector } from "@/components/wallet/bitcoin-wallet-selector"
import { formatAddress, getStacksAddress } from "@/lib/wallet-utils"
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { hasCreationRights, isLoading: isRightsLoading } = useUserRights()
  const { 
    isConnected: isStacksConnected, 
    connectWallet, 
    disconnectWallet, 
    userData, 
    isLoading: isStacksLoading, 
    userSession 
  } = useStacks();
  
  const stacksAddress = userData ? getStacksAddress(userData) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  if (mounted) {
    console.log('Header debug:', { 
      isStacksConnected, 
      hasCreationRights, 
      isRightsLoading,
      shouldShowButton: isStacksConnected && hasCreationRights 
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-foreground">StackOdds</span>
        </Link>

        {/* Search Bar - Hidden on mobile, distinct on desktop */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search markets (e.g. Crypto, Politics, Sports)..."
              className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all hover:bg-secondary/80 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="h-8 w-8 md:h-9 md:w-9" />

          {mounted && isStacksConnected && (
            <Button 
              asChild 
              size="sm" 
              variant="outline" 
              className="inline-flex border-border hover:bg-secondary hover:text-foreground"
            >
              <Link href="/create-market">Create Market</Link>
            </Button>
          )}

          {/* Bitcoin Wallet Connect/Disconnect */}
          <div className="hidden sm:flex items-center gap-2">
            <BitcoinWalletSelector
              userSession={userSession}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              isConnected={isStacksConnected}
              userData={userData}
              isLoading={isStacksLoading}
            />
          </div>

          {/* Mobile Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border bg-card">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-bold">StackOdds</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {/* Bitcoin Wallet Info */}
                {isStacksConnected && stacksAddress && (
                  <div className="flex flex-col gap-3 px-4 py-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-primary/50" />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                            {formatAddress(stacksAddress)}
                          </p>
                          <p className="text-xs text-muted-foreground">Bitcoin Wallet</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (stacksAddress) {
                            navigator.clipboard.writeText(stacksAddress);
                            toast.success('Address copied to clipboard');
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Wallet Connection Button for Mobile */}
                {!isStacksConnected && (
                  <div className="flex flex-col gap-2 px-4">
                    <BitcoinWalletSelector
                      userSession={userSession}
                      onConnect={connectWallet}
                      onDisconnect={disconnectWallet}
                      isConnected={isStacksConnected}
                      userData={userData}
                      isLoading={isStacksLoading}
                    />
                  </div>
                )}

                <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Home</span>
                </Link>

                {mounted && isStacksConnected && hasCreationRights && (
                  <Link href="/create-market" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground">
                    <PlusCircle className="h-5 w-5" />
                    <span className="font-medium">Create Market</span>
                  </Link>
                )}

                {isStacksConnected && (
                  <Button
                    onClick={disconnectWallet}
                    variant="outline"
                    className="w-full justify-start gap-3 px-4"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Disconnect Wallet</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 md:hidden bg-background/95 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets..."
            className="w-full rounded-lg border border-border bg-secondary py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </header>
  )
}