const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const { http_options } = require('./properties');
const Tx = require('ethereumjs-tx').Transaction;
const nonce_helper = require('./nonce_helper');

class EthTransfer {
  constructor(network, network_provider, contract_address, eth_src_address, eth_src_priv_key, gas_limit) {
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
  }

  async init() {
    this.web3 = await this.setUpWeb3(this.network_provider);
    console.log("ETH Web3 is set up...");
    this.transactionCount = await this.web3.eth.getTransactionCount(this.eth_src_address);
    console.log("EthTransfer initialization done.");
  }

  async setUpWeb3(network_provider) {
    return new Web3(new Web3HttpProvider(network_provider, http_options));
  }

  async transfer(recipient, amount) {
    const { web3, transactionCount } = this;
    // Combine initial transaction count and controlled nonce increment
    const nonceIncrement = nonce_helper.getNonceIncrement();
    const count = transactionCount + nonceIncrement;
    const nonce = web3.utils.toHex(count);
    // Increment nonceIncrement by 1
    nonce_helper.increaseNonceIncrement();
    console.log(`ETH - tx count:${transactionCount} increment:${nonceIncrement} nonce:${nonce}`);
    // Get gas price
    const gasPrice = await web3.eth.getGasPrice().then((result) => {
      return result;
    })

    const txObj = {
      nonce,
      from: this.eth_src_address,
      to: recipient,
      value: web3.utils.toHex(web3.utils.toWei(amount, 'ether')),
      gasPrice: web3.utils.toHex(gasPrice.toString()),
      gasLimit: web3.utils.toHex(this.gas_limit),
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

module.exports.EthTransfer = EthTransfer;