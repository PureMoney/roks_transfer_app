const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const { default_http_options, default_ws_options } = require('./properties');
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;
const nonce_helper_fn = require('./nonce_helper');
const Web3WsProvider = require('web3-providers-ws');
const Big = require('big.js');
const HDWalletProvider = require("@truffle/hdwallet-provider");

class EthTransfer {
  txData = {};

  constructor(
      network,
      network_provider,
      contract_address,
      eth_src_address,
      eth_src_priv_key,
      gas_limit,
      roks_eth_src_same,
      nonce_helper = null,
      http_options = default_http_options,
      ws_options = default_ws_options,
      src_mnemonic = null
    ) {
    this.network = network;
    this.network_provider = network_provider;
    this.contract_address = contract_address;
    this.eth_src_address = eth_src_address;
    this.eth_src_priv_key = eth_src_priv_key;
    this.gas_limit = gas_limit;
    this.private_key = new Buffer(eth_src_priv_key, 'hex');
    this.web3 = null;
    this.contract = null;
    this.transactionCount = 0;
    this.localNonceIncrement = 0;
    this.roks_eth_src_same = roks_eth_src_same;
    if (nonce_helper === null){
      this.nonce_helper = nonce_helper_fn;
    } else {
      this.nonce_helper = nonce_helper;
    }
    this.http_options = http_options;
    this.ws_options = ws_options;
    this.src_mnemonic = src_mnemonic;
  }

  async init() {
    this.web3 = await this.setUpWeb3(this.network_provider, this.src_mnemonic);
    this.transactionCount = await this.web3.eth.getTransactionCount(this.eth_src_address);
    console.log("EthTransfer initialization done.");
  }

  async setUpWeb3(network_provider, src_mnemonic) {
    console.log('--> mnemonic: ', src_mnemonic);
    // If HDWalletProvider is not null and is set, use it
    if (src_mnemonic !== null){
      return new Web3(new HDWalletProvider({
        mnemonic: {
          phrase: src_mnemonic
        },
        providerOrUrl: network_provider,
      }));
    }
    // If provider is an https connection, use the http provider.
    // Otherwise, use the websocket provider
    if (network_provider.startsWith("http")){
      console.log("ETH Web3 with HTTP provider is setting up...");
      console.log("Using HTTPS Options: ", this.http_options);
      return new Web3(new Web3HttpProvider(network_provider, this.http_options));
    }
    console.log("ETH Web3 with HTTP provider is setting up...");
    console.log("Using WS Options: ", this.ws_options);
    console.log('--> network_provider: ', network_provider);
    return new Web3(new Web3WsProvider(network_provider, this.ws_options));
  }

  // Create network params for BSC
  // This allows to create a customized Transaction.
  createCommon() {
    switch (this.network) {
      case 56: // bsc_mainnet
        return Common.forCustomChain(
          baseChain = 1,
          customChainParams = {
            name: 'bsc-mainnet', // string
            chainId: this.network, // number
            networkId: this.network, // number
            comment: 'Binance Smart Chain Mainnet', // string
            url: 'https://bscscan.com/', // string
            genesis: {  // GenesisBlock
              hash: '0x0000000000000000000000000000000000000000000000000000000000000000', // string
              timestamp: '0x5e9da7ce',  // string | null
              gasLimit: 0x2625a00, // number
              difficulty: 0x1, // number
              nonce: '0', // string
              extraData: '0x00000000000000000000000000000000000000000000000000000000000000002a7cdd959bfe8d9487b2a43b33565295a698f7e26488aa4d1955ee33403f8ccb1d4de5fb97c7ade29ef9f4360c606c7ab4db26b016007d3ad0ab86a0ee01c3b1283aa067c58eab4709f85e99d46de5fe685b1ded8013785d6623cc18d214320b6bb6475978f3adfc719c99674c072166708589033e2d9afec2be4ec20253b8642161bc3f444f53679c1f3d472f7be8361c80a4c1e7e9aaf001d0877f1cfde218ce2fd7544e0b2cc94692d4a704debef7bcb61328b8f7166496996a7da21cf1f1b04d9b3e26a3d0772d4c407bbe49438ed859fe965b140dcf1aab71a96bbad7cf34b5fa511d8e963dbba288b1960e75d64430b3230294d12c6ab2aac5c2cd68e80b16b581ea0a6e3c511bbd10f4519ece37dc24887e11b55d7ae2f5b9e386cd1b50a4550696d957cb4900f03a82012708dafc9e1b880fd083b32182b869be8e0922b81f8e175ffde54d797fe11eb03f9e3bf75f1d68bf0b8b6fb4e317a0f9d6f03eaf8ce6675bc60d8c4d90829ce8f72d0163c1d5cf348a862d55063035e7a025f4da968de7e4d7e4004197917f4070f1d6caa02bbebaebb5d7e581e4b66559e635f805ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // string
              stateRoot: '' // string
            },
            hardforks: [  //  Hardfork[]
              {
                "name": "chainstart",
                "block": 0,
                "forkHash": "0xfc64ec04"
              },
              {
                "name": "homestead",
                "block": 0,
                "forkHash": "0x97c2c34c"
              },
              {
                "name": "byzantium",
                "block": 0,
                "forkHash": "0xa00bc324"
              },
              {
                "name": "constantinople",
                "block": 0,
                "forkHash": "0x668db0af"
              },
              {
                "name": "petersburg",
                "block": 0,
                "forkHash": "0x668db0af"
              },
              {
                "name": "istanbul",
                "block": 0,
                "forkHash": "0x879d6e30"
              },
              {
                "name": "muirGlacier",
                "block": 0,
                "forkHash": "0xe029e991"
              }
            ],
            bootstrapNodes: [ // BootstrapNode[]
            ]
          },
          hardfork = 'istanbul',
          supportedHardforks = ["homestead","byzantium","constantinople","petersburg","istanbul","muirGlacier"]
        )
      case 97: // bsc_testnet
        return Common.forCustomChain(
          3,
          {
            name: 'bsc-testnet', // string
            chainId: this.network, // number
            networkId: this.network, // number
            comment: 'Binance Smart Chain Testnet', // string
            url: 'https://testnet.bscscan.com/', // string
            genesis: {  // GenesisBlock
              hash: '0x0000000000000000000000000000000000000000000000000000000000000000', // string
              timestamp: '0x5e9da7ce',  // string | null
              gasLimit: 0x2625a00, // number
              difficulty: 0x1, // number
              nonce: '0x0', // string
              extraData: '0x00000000000000000000000000000000000000000000000000000000000000001284214b9b9c85549ab3d2b972df0deef66ac2c9b71b214cb885500844365e95cd9942c7276e7fd8a2959d3f95eae5dc7d70144ce1b73b403b7eb6e0980a75ecd1309ea12fa2ed87a8744fbfc9b863d535552c16704d214347f29fa77f77da6d75d7c752f474cf03cceff28abc65c9cbae594f725c80e12d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // string
              stateRoot: '' // string
            },
            hardforks: [  //  Hardfork[]
            ],
            bootstrapNodes: [ // BootstrapNode[]
              "enode://69a90b35164ef862185d9f4d2c5eff79b92acd1360574c0edf36044055dc766d87285a820233ae5700e11c9ba06ce1cf23c1c68a4556121109776ce2a3990bba@52.199.214.252:30311",
              "enode://330d768f6de90e7825f0ea6fe59611ce9d50712e73547306846a9304663f9912bf1611037f7f90f21606242ded7fb476c7285cb7cd792836b8c0c5ef0365855c@18.181.52.189:30311",
              "enode://df1e8eb59e42cad3c4551b2a53e31a7e55a2fdde1287babd1e94b0836550b489ba16c40932e4dacb16cba346bd442c432265a299c4aca63ee7bb0f832b9f45eb@52.51.80.128:30311",
              "enode://0bd566a7fd136ecd19414a601bfdc530d5de161e3014033951dd603e72b1a8959eb5b70b06c87a5a75cbf45e4055c387d2a842bd6b1bd8b5041b3a61bab615cf@34.242.33.165:30311",
              "enode://604ed87d813c2b884ff1dc3095afeab18331f3cc361e8fb604159e844905dfa6e4c627306231d48f46a2edceffcd069264a89d99cdbf861a04e8d3d8d7282e8a@3.209.122.123:30311",
              "enode://4d358eca87c44230a49ceaca123c89c7e77232aeae745c3a4917e607b909c4a14034b3a742960a378c3f250e0e67391276e80c7beee7770071e13f33a5b0606a@52.72.123.113:30311"
            ]
          },
          '',
          []
        )
      default: // for any other, do the usual
        return null;
    }
  }

  // First 
  async prepareTxData(recipient, amount) {
    const {
      web3,
      transactionCount,
      roks_eth_src_same,
      localNonceIncrement,
      nonce_helper,
      gas_limit,
      eth_src_address
    } = this;

    const bigAmount = Big(amount);

    // Amount should not be zero or less
    if (bigAmount.lte(0)){
      console.log("Invalid amount (less than zero).");
      throw new Error("Invalid amount (less than zero).");
    }

    let weiBalance = await web3.eth.getBalance(eth_src_address);
    const balance = web3.utils.fromWei(weiBalance);
    console.log("Balance: ", balance, " Type:", typeof balance);
    console.log("Amount: ", amount, " Type:", typeof amount);

    const bigBalance = Big(balance);

    // Balance should not be less than the amount
    if (bigBalance.lt(bigAmount)){
      console.log("Invalid amount (greater than current balance).");
      throw new Error("Invalid amount (greater than current balance).");
    }

    // If both roks and eth sources are the same, use the global nonce increment
    // Otherwise, use the local one
    let nonceIncrement;
    if (roks_eth_src_same) {
      console.log("Using global nonce increment.");
      nonceIncrement = nonce_helper.getGlobalNonceIncrement();
      // Increase nonceIncrement by 1
      nonce_helper.increaseGlobalNonceIncrement();
    } else {
      console.log("Using local  nonce increment.");
      nonceIncrement = localNonceIncrement;
      // Increase localNonceIncrement by 1
      this.localNonceIncrement = nonceIncrement + 1;
    }

    // Combine initial transaction count and controlled nonce increment to create nonce
    const count = transactionCount + nonceIncrement;
    const nonce = web3.utils.toHex(count);

    console.log(`ETH - tx count:${transactionCount} increment:${nonceIncrement} nonce:${nonce}`);

    // Get gas price
    const gasPrice = await web3.eth.getGasPrice();

    this.txData = {
      nonce,
      from: eth_src_address,
      to: recipient,
      value: web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether')),
      gasPrice: web3.utils.toHex(gasPrice.toString()),
      gasLimit: web3.utils.toHex(gas_limit.toString()),
      data: null
    }
  }

  async signAndTransfer() {
    const tx = new Tx(this.txData, { common: this.createCommon() });
    tx.sign(this.private_key);
    const serializedTx = tx.serialize();
    return await new Promise(async (resolve, reject) => {
      web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .once('receipt', function (receipt) {
          console.log("Receipt: ", receipt);
          resolve(receipt);
        })
        .once('error', function (error) {
          console.log("Error: ", error);
          reject(error);
        });
    });
  }

  async transfer(recipient, amount) {
    await this.prepareTxData(recipient, amount);
    await this.signAndTransfer();
  }
}

module.exports.EthTransfer = EthTransfer;