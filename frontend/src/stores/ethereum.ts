import detectEthereumProvider from '@metamask/detect-provider';
import * as sapphire from '@oasisprotocol/sapphire-paratime';
import {
  BrowserProvider,
  type Eip1193Provider,
  JsonRpcProvider,
  JsonRpcSigner,
  type Provider,
  type Signer,
  toBeHex,
} from 'ethers';
import { defineStore } from 'pinia';
import { markRaw, type Raw, ref, shallowRef } from 'vue';
import { MetaMaskNotInstalledError } from '@/utils/errors';

export enum Network {
  Unknown = 0,
  Ethereum = 1,
  Goerli = 10,
  BscMainnet = 56,
  BscTestnet = 97,
  EmeraldTestnet = 0xa515,
  EmeraldMainnet = 0xa516,
  SapphireTestnet = 0x5aff,
  SapphireMainnet = 0x5afe,
  SapphireLocalnet = 0x5afd,
  Local = 1337,

  FromConfig = parseInt(import.meta.env.VITE_NETWORK),
}

export enum ConnectionStatus {
  Unknown,
  Disconnected,
  Connected,
}

function networkByChainId(chainId: number | bigint | string): Network {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
  if (Network[Number(id)]) return id as Network;
  return Network.Unknown;
}

const networkNameMap: Record<Network, string> = {
  [Network.Local]: 'Local Network',
  [Network.EmeraldTestnet]: 'Emerald Testnet',
  [Network.EmeraldMainnet]: 'Emerald Mainnet',
  [Network.SapphireTestnet]: 'Sapphire Testnet',
  [Network.SapphireMainnet]: 'Sapphire Mainnet',
  [Network.SapphireLocalnet]: 'Sapphire Localnet',
  [Network.BscMainnet]: 'BSC',
  [Network.BscTestnet]: 'BSC Testnet',
};

export function networkName(network?: Network): string {
  if (network && networkNameMap[network]) {
    return networkNameMap[network];
  }
  return 'Unknown Network';
}

declare global {
  interface Window {
    ethereum: BrowserProvider & Eip1193Provider & sapphire.SapphireAnnex;
  }
}

export const useEthereumStore = defineStore('ethereum', () => {
  const provider = shallowRef<Provider>(
    new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, undefined, {
      staticNetwork: true,
    }),
  );

  const network = ref(Network.FromConfig);
  const status = ref(ConnectionStatus.Unknown);

  async function init(addr: string, eth: Eip1193Provider) {
    provider.value = sapphire.wrap(
      new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, 'any'),
    ) as JsonRpcProvider;
  }

  return {
    provider,
    network,
  };
});
