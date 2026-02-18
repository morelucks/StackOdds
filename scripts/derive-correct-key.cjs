const bip39 = require('@scure/bip39');
const { HDKey } = require('@scure/bip32');
const { publicKeyToAddress } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');

const mnemonic = "rare glow wheel hole illness undo split twelve skull awful dish install flower toy shock narrow lake immense ancient label barely unusual certain victory";

const seed = bip39.mnemonicToSeedSync(mnemonic);
const master = HDKey.fromMasterSeed(seed);

// Stacks uses m/44'/5757'/0'/0/0
const child = master.derive("m/44'/5757'/0'/0/0");
const privateKey = child.privateKey.toString('hex');
const publicKey = child.publicKey;

const address = publicKeyToAddress(STACKS_MAINNET.addressVersion.singleSig, publicKey);

console.log('Private Key:', privateKey);
console.log('Address:', address);

// Check balance
fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`)
  .then(r => r.json())
  .then(data => {
    console.log('Balance:', parseInt(data.balance, 16) / 1000000, 'STX');
  });
