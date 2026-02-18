const { createStacksPrivateKey, pubKeyfromPrivKey, publicKeyToAddress } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');

const privateKey = '338f1cc41fc9fd2ba82c0c22c24dd16525fe9c0a15589cf480de7f4bb1992b0a';
const privKey = createStacksPrivateKey(privateKey);
const publicKey = pubKeyfromPrivKey(privKey);
const address = publicKeyToAddress(STACKS_MAINNET.addressVersion.singleSig, publicKey);

console.log('Your Mainnet Address:', address);
console.log('\nYou need to fund this address with at least 1 STX to deploy contracts.');
console.log('Send STX to this address from an exchange or another wallet.');
