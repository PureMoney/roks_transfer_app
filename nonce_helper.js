let nonce_increment = 0;

function increaseGlobalNonceIncrement(){
  nonce_increment = nonce_increment + 1;
}

function getGlobalNonceIncrement(){
  return nonce_increment;
}

module.exports.increaseGlobalNonceIncrement = increaseGlobalNonceIncrement;
module.exports.getGlobalNonceIncrement = getGlobalNonceIncrement;