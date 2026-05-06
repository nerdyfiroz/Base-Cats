import type { Metadata } from 'next';
import Web3Provider from '@/components/Web3Provider';
import './game.css';

export const metadata: Metadata = {
  title: 'Base Catz: Neon Heist | Play',
  description: 'Cyberpunk NFT gang war game on Base chain.',
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      {children}
    </Web3Provider>
  );
}
