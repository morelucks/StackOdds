'use client';

import { useState, useEffect } from 'react';
import { connect, isConnected, getLocalStorage } from '@stacks/connect';
import { formatAddress, getStacksAddress } from '@/lib/wallet-utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BitcoinWalletSelectorProps {
  userSession: any; // Compatibility wrapper from useStacks
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  userData?: any;
  isLoading: boolean;
}

export const BitcoinWalletSelector = ({
  userSession,
  onConnect,
  onDisconnect,
  isConnected: isConnectedProp,
  userData,
  isLoading,
}: BitcoinWalletSelectorProps) => {
  const [localUserData, setLocalUserData] = useState(userData);
  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for connection changes
  useEffect(() => {
    const checkSession = () => {
      try {
        if (isConnected()) {
          const data = getLocalStorage();
          setLocalUserData(data || undefined);
        } else {
          setLocalUserData(undefined);
        }
      } catch (error) {
        console.warn('Error checking session:', error);
        setLocalUserData(undefined);
      }
    };

    // Check immediately
    checkSession();

    // Poll for changes
    const interval = setInterval(checkSession, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setLocalUserData(userData);
  }, [userData]);

  const connectToWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if already connected
      if (isConnected()) {
        console.log('Already authenticated');
        const data = getLocalStorage();
        if (data) {
          setLocalUserData(data);
        }
        setIsConnecting(false);
        onConnect();
        return;
      }

      // Connect to wallet using new API - this will show the Stacks Connect modal
      // This supports Leather Wallet, Xverse, and other Bitcoin wallets
      const response = await connect();
      console.log('Connected:', response.addresses);
      
      // Update local state
      // The response.addresses is already stored in localStorage by the connect() function
      const data = getLocalStorage();
      if (data) {
        setLocalUserData(data);
      }
      
      setIsConnecting(false);
      
      // Trigger the onConnect callback which will update state in the hook
      onConnect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      userSession.signUserOut();
      onDisconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Use local userData if available, fallback to prop
  const currentUserData = localUserData || userData;
  const currentIsConnected = isConnected() || isConnectedProp;

  // Extract address from userData - support both old and new API formats
  const getAddress = () => {
    return getStacksAddress(currentUserData);
  };

  // If connected, show connected state
  if (currentIsConnected && currentUserData) {
    const address = getAddress();
    const shortAddress = address ? formatAddress(address) : 'Connected';

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-foreground font-mono">{shortAddress}</span>
        </div>
        <Button
          onClick={handleDisconnect}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disconnecting...
            </>
          ) : (
            'Disconnect'
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectToWallet}
      disabled={isLoading || isConnecting}
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {(isLoading || isConnecting) ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        '🔗 Connect Bitcoin Wallet'
      )}
    </Button>
  );
};


