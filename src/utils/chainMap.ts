import {
  ERC_BRIDGE,
  BEP_BRIDGE,
  MAT_BRIDGE,
  polkaLokrERC,
  polkalokrBEP,
  polkaLokrMAT,
  ETH_URL,
  BSC_URL,
  MAT_URL,
} from '../blockchain/constant';

export const chainMap = {
  1: {
    chain: 'ETH_CHAIN_MAIN',
    name: 'ERC20',
    token: '',
    bridge: '',
    rpc: '',
  },
  4: {
    chain: 'ETH_CHAIN_TEST',
    name: 'ERC20',
    token: polkaLokrERC,
    bridge: ERC_BRIDGE,
    rpc: ETH_URL,
  },
  56: {
    chain: 'BEP_CHAIN_MAIN',
    name: 'BEP20',
    token: '',
    bridge: '',
    rpc: '',
  },
  97: {
    chain: 'BEP_CHAIN_TEST',
    name: 'BEP20',
    token: polkalokrBEP,
    bridge: BEP_BRIDGE,
    rpc: BSC_URL,
  },
  137: {
    chain: 'MAT_CHAIN_MAIN',
    name: 'MAT',
    token: '',
    bridge: '',
    rpc: '',
  },
  80001: {
    chain: 'MAT_CHAIN_TEST',
    name: 'MAT',
    token: polkaLokrMAT,
    bridge: MAT_BRIDGE,
    rpc: MAT_URL,
  },
};
