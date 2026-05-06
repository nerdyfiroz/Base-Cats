import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const wagmiConfig = getDefaultConfig({
  appName: 'Base Catz: Neon Heist',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'demo',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  BaseCatzNFT:      '0x790996aaE2A4AEF87612139CFe8e7eae97c8E5C1', // ✅ Deployed on Base
  GangRegistry:     '0x0000000000000000000000000000000000000002',
  ResourceToken:    '0x0000000000000000000000000000000000000003',
  MarketplaceEscrow:'0x0000000000000000000000000000000000000004',
  SeasonRewards:    '0x0000000000000000000000000000000000000005',
};
