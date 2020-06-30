let nonce_increment = 0;

function increaseNonceIncrement(){
  nonce_increment = nonce_increment + 1;
}

function getNonceIncrement(){
  return nonce_increment;
}

module.exports.increaseNonceIncrement = increaseNonceIncrement;
module.exports.getNonceIncrement = getNonceIncrement;