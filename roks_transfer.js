const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const { http_options } = require('./properties');
const Tx = require('ethereumjs-tx').Transaction;
const Web3EthContract = require('web3-eth-contract');
const contract = require('./contract_abi');
const nonce_helper = require('./nonce_helper');

class RoksTransfer {
  constructor(contract_abi, network, network_provider, contract_address, roks_src_address, roks_src_priv_key, gas_limit, roks_eth_src_same) {
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
  }

  async init() {
    this.web3 = await this.setUpWeb3(this.network_provider);
    console.log("ROKS Web3 is set up...");
    this.contract = await this.setupContract(this.contract_abi, this.contract_address, this.roks_src_address);
    console.log("ROKS Contract is set up...");
    this.transaction_count = await this.web3.eth.getTransactionCount(this.roks_src_address);
    console.log("RoksTransfer initialization done.");
  }

  async setUpWeb3(network_provider) {
    return new Web3(new Web3HttpProvider(network_provider, http_options));
  }

  async setupContract(contract_abi, contract_address, roks_src_address) {
    return new Web3EthContract(contract_abi, contract_address, { from: roks_src_address });
  }

  async transfer(recipient, amount) {
    const { web3, contract, transaction_count, roks_eth_src_same, localNonceIncrement } = this;
    // If both roks and eth sources are the same, use the global nonce increment
    // Otherwise, use the local one
    let nonceIncrement;
    if (roks_eth_src_same) {
      console.log("Using global nonce increment.");
      nonceIncrement = nonce_helper.getNonceIncrement();
      // Increase nonceIncrement by 1
      nonce_helper.increaseNonceIncrement();
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

    const gasPrice = await web3.eth.getGasPrice().then((result) => {
      return result;
    })

    const txObj = {
      nonce,
      'gasPrice': web3.utils.toHex(gasPrice.toString()),
      'gasLimit': web3.utils.toHex(this.gas_limit),
      "value": "0x00",
      "data": data,
      "to": this.contract_address
    }

    const tx = new Tx(txObj, { 'chain': this.network });
    tx.sign(this.private_key);
    const serializedTx = tx.serialize();
    return await new Promise(async (resolve, reject) => {
      web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .once('receipt', function (receipt) {
          console.log("Receipt: ", receipt);
          resolve(true);
        })
        .once('error', function (error) {
          console.log("Error: ", error);
          resolve(false);
        });
    });
  }
}

module.exports.RoksTransfer = RoksTransfer;
module.exports.RoksContract = contract.contract;