const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;

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
  }

  async init() {
    this.web3 = await this.setUpWeb3(this.network_provider);
    console.log("Web3 is set up...");
    console.log("EthTransfer initialization done.");
  }

  async setUpWeb3(network_provider) {
    return new Web3(network_provider);
  }

  async transfer(recipient, amount) {
    const { web3 } = this;

    const count = await web3.eth.getTransactionCount(this.eth_src_address);
    const nonce = web3.utils.toHex(count);

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
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .once('transactionHash', function (hash) { console.log("Hash: ", hash) })
      .once('receipt', function (receipt) { console.log("Receipt: ", receipt) })
      .on('confirmation', function (confNumber, receipt) { console.log("Confirmation: ", receipt, " Confirmation Number: ", confNumber) })
      .on('error', function (error) { console.log("Error: ", error) })
      .then(function (receipt) {
        console.log("Receipt: ", receipt);
      });
  }
}

module.exports.EthTransfer = EthTransfer;