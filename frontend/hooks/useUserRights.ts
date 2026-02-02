'use client';

import { useState, useEffect } from "react";
import { useStacks } from "./useStacks";
import { getStacksAddress } from "@/lib/wallet-utils";
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions'
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network'
import { CONTRACT_ADDRESS } from "@/lib/constants";

// Use testnet by default, can be configured via environment variable
const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export function useUserRights() {
    const { isConnected, userData } = useStacks();
    const address = userData ? getStacksAddress(userData) : null;

    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check user roles from contract
    useEffect(() => {
        if (!mounted || !isConnected || !address) {
            setIsAdmin(false);
            setIsModerator(false);
            return;
        }

        const checkRoles = async () => {
            setIsLoading(true);
            try {
                const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.');

                // Get contract owner
                const ownerResult = await fetchCallReadOnlyFunction({
                    network: NETWORK,
                    contractAddress,
                    contractName,
                    functionName: 'get-owner',
                    functionArgs: [],
                    senderAddress: contractAddress,
                });

                const ownerJson = cvToJSON(ownerResult);
                // For principal types, cvToJSON returns { type: 'principal', value: 'ST...' } or { type: 'principal', value: { address: 'ST...', contractName: '...' } }
                let owner: string | null = null;
                if (ownerJson.type === 'principal') {
                    if (typeof ownerJson.value === 'string') {
                        owner = ownerJson.value;
                    } else if (ownerJson.value?.address) {
                        owner = ownerJson.value.address;
                    } else if (ownerJson.value?.value) {
                        owner = ownerJson.value.value;
                    }
                } else {
                    // Fallback for other types
                    owner = ownerJson.value?.value || ownerJson.value || null;
                }

                // Debug logging (can be removed later)
                console.log('Owner check:', { ownerJson, owner, address, userIsOwner: owner && address ? address.toLowerCase() === owner.toLowerCase() : false });

                // Check if user is owner (owner has admin and moderator rights)
                const userIsOwner = owner && address ? address.toLowerCase() === owner.toLowerCase() : false;

                setIsAdmin(userIsOwner);
                setIsModerator(userIsOwner);

                // TODO: Check admin-role and moderator-role maps if contract exposes them
                // For now, only owner has rights
            } catch (error) {
                console.error('Error checking user rights:', error);
                setIsAdmin(false);
                setIsModerator(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkRoles();
    }, [mounted, isConnected, address]);

    const hasCreationRights = isAdmin; // Only admin/owner can create markets

    return {
        isConnected,
        isAdmin,
        isModerator,
        hasCreationRights,
        isLoading,
    };
}
