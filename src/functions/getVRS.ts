const {
  defaultAbiCoder,
  keccak256,
  solidityPack,
} = require('ethers/lib/utils');

const { ecsign } = require('ethereumjs-util');

const Web3 = require('web3');

export const getVRS = async (
  _id,
  _token,
  _contractAddress,
  _amount,
  _senderAddress,
) => {
  // console.log('private key ==>> ', process.env.PRIVATE_KEY);
  const DomainSeparator = keccak256(
    defaultAbiCoder.encode(['string', 'address'], ['0x01', _contractAddress]),
  );
  var message = keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'address'],
      [_id, _senderAddress, Web3.utils.toWei(_amount.toString()), _token],
    ),
  );
  var finalHash = keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', DomainSeparator, message],
    ),
  );
  const { v, r, s } = ecsign(
    Buffer.from(finalHash.slice(2), 'hex'),
    Buffer.from(process.env.PRIVATE_KEY1.slice(2), 'hex'),
  );
  return { v: v, r: '0x' + r.toString('hex'), s: '0x' + s.toString('hex') };
};
