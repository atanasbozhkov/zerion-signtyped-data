import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import {
  coinbaseWallet,
  injected,
  walletConnect,
  // zerionWallet,
} from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Create Wagmi' }),
    // zerionWallet({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
