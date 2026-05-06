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

// Contract addresses (deploy and fill these in)
export const CONTRACTS = {
  BaseCatzNFT:      '0x0000000000000000000000000000000000000001',
  GangRegistry:     '0x0000000000000000000000000000000000000002',
  ResourceToken:    '0x0000000000000000000000000000000000000003',
  MarketplaceEscrow:'0x0000000000000000000000000000000000000004',
  SeasonRewards:    '0x0000000000000000000000000000000000000005',
};
