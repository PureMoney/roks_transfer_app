const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const { default_http_options, default_ws_options } = require('./properties');
const Tx = require('ethereumjs-tx').Transaction;
const nonce_helper_fn = require('./nonce_helper');
const Web3WsProvider = require('web3-providers-ws');
const Big = require('big.js')
const HDWalletProvider = require("@truffle/hdwallet-provider");

class EthTransfer {
  constructor(
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
    this.network_provider = network_provider;
    this.contract_address = contract_address;
    this.eth_src_address = eth_src_address;
    this.eth_src_priv_key = eth_src_priv_key;
    this.gas_limit = gas_limit;
    this.private_key = '0x' + eth_src_priv_key
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
    return new Web3(new Web3WsProvider(network_provider, this.ws_options));
  }

  async transfer(recipient, amount) {
    const {
      web3,
      eth_src_address,
      transactionCount,
      roks_eth_src_same,
      localNonceIncrement,
      nonce_helper
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

    const txObj = {
      nonce,
      from: this.eth_src_address,
      to: recipient,
      value: web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether').toString()),
      gasPrice: web3.utils.toHex(gasPrice.toString()),
      gasLimit: web3.utils.toHex(this.gas_limit),
      chain: 'bsc-testnet',  // FIXME: must be a configurable variable
    }

    return web3.eth.sendTransaction(txObj)
        .then((tx) => {
          console.log("Tx: ", tx);
          return tx;
        })
        .catch((reason) => {
          console.log("Reason: ", reason);
          throw new Error(reason);
        });
  }
}

module.exports.EthTransfer = EthTransfer;