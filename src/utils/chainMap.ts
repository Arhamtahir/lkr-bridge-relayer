import {
  ERC_BRIDGE,
  BEP_BRIDGE,
  MAT_BRIDGE,
  TOKEN_ERC,
  TOKEN_BEP,
  TOKEN_MAT,
} from '../utils/constant';

export const chainMap = {
  4: {
    chain: 'ETH_CHAIN_TEST',
    name: 'ERC20',
    token: TOKEN_ERC,
    bridge: ERC_BRIDGE,
    rpc: 'ETH_URL',
  },
  97: {
    chain: 'BEP_CHAIN_TEST',
    name: 'BEP20',
    token: TOKEN_BEP,
    bridge: BEP_BRIDGE,
    rpc: 'BSC_URL',
  },
  80001: {
    chain: 'MAT_CHAIN_TEST',
    name: 'MAT',
    token: TOKEN_MAT,
    bridge: MAT_BRIDGE,
    rpc: 'MAT_URL',
  },
};
