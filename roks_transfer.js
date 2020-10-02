const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const { default_http_options, default_ws_options } = require('./properties');
const Tx = require('ethereumjs-tx').Transaction;
const Web3EthContract = require('web3-eth-contract');
const contract = require('./contract_abi');
const nonce_helper_fn = require('./nonce_helper');
const Web3WsProvider = require('web3-providers-ws');

class RoksTransfer {
  constructor(
      contract_abi,
      network,
      network_provider,
      contract_address,
      roks_src_address,
      roks_src_priv_key,
      gas_limit,
      roks_eth_src_same,
      nonce_helper = null,
      http_options = default_http_options,
      ws_options = default_ws_options
    ) {
    this.contract_abi = contract_abi;
    this.network = network;
    this.network_provider = network_provider;
    this.contract_address = contract_address;
    this.roks_src_address = roks_src_address;
    this.roks_src_priv_key = roks_src_priv_key;
    this.gas_limit = gas_limit;
    this.private_key = new Buffer(roks_src_priv_key, 'hex');
    this.web3 = null;
    this.contract = null;
    this.transaction_count = 0;
    this.localNonceIncrement = 0;
    this.roks_eth_src_same = roks_eth_src_same;
    if (nonce_helper === null){
      this.nonce_helper = nonce_helper_fn;
    } else {
      this.nonce_helper = nonce_helper;
    }
    this.http_options = http_options;
    this.ws_options = ws_options;
  }

  async init() {
    this.web3 = await this.setUpWeb3(this.network_provider);
    console.log("ROKS Web3 is set up...");
    this.contract = await this.setupContract(this.contract_abi, this.contract_address, this.roks_src_address, this.web3);
    console.log("ROKS Contract is set up...");
    this.transaction_count = await this.web3.eth.getTransactionCount(this.roks_src_address);
    console.log("RoksTransfer initialization done.");
  }

  async setUpWeb3(network_provider) {
    // If provider is an https connection, use the http provider.
    // Otherwise, use the websocket provider
    if (network_provider.startsWith("http")){
      console.log("ROKS Web3 with HTTP provider is setting up...");
      console.log("Using HTTPS Options: ", this.http_options);
      return new Web3(new Web3HttpProvider(network_provider, this.http_options));
    }
    console.log("ROKS Web3 with HTTP provider is setting up...");
    console.log("Using WS Options: ", this.ws_options)
    return new Web3(new Web3WsProvider(network_provider, this.ws_options));
  }

  async setupContract(contract_abi, contract_address, roks_src_address, web3) {
    return await new web3.eth.Contract(contract_abi, contract_address, {from: roks_src_address});
  }

  async transfer(recipient, amount) {
    const {
      web3,
      contract,
      roks_src_address,
      transaction_count,
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

    // Get current ROKS balance of source address
    const weiBalance = await contract.methods.balanceOf(roks_src_address).call();
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
    const count = transaction_count + nonceIncrement;
    const nonce = web3.utils.toHex(count);
    console.log(`ROKS - tx count:${transaction_count} increment:${nonceIncrement} nonce:${nonce}`);

    const data = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString(), 'ether')).encodeABI();

    const gasPrice = await web3.eth.getGasPrice();

    const txObj = {
      nonce,
      'gasPrice': web3.utils.toHex(gasPrice.toString()),
      'gasLimit': web3.utils.toHex(this.gas_limit),
      "value": "0x00",
      "data": data,
      "to": this.contract_address
    };

    const tx = new Tx(txObj, { 'chain': this.network });
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
}

module.exports.RoksTransfer = RoksTransfer;
module.exports.RoksContract = contract.contract;