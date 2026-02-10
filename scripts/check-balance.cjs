const { publicKeyToAddress } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');

const privateKey = '338f1cc41fc9fd2ba82c0c22c24dd16525fe9c0a15589cf480de7f4bb1992b0a';

// Derive address from private key using secp256k1
const crypto = require('crypto');
const secp256k1 = require('secp256k1');

const privKeyBuffer = Buffer.from(privateKey, 'hex');
const pubKey = secp256k1.publicKeyCreate(privKeyBuffer);
const address = publicKeyToAddress(STACKS_MAINNET.addressVersion.singleSig, pubKey);

console.log('Mainnet Address:', address);

// Check balance
fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`)
  .then(r => r.json())
  .then(data => {
    console.log('\nBalance:', parseInt(data.balance, 16) / 1000000, 'STX');
    console.log('Nonce:', data.nonce);
  })
  .catch(err => console.error('Error checking balance:', err));
