const fetch = require("node-fetch");

async function getQuote(params) {
  return await fetch(
    `https://barn.api.cow.fi/goerli/api/v1/quote/`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "sellToken": params.sellToken,
        "buyToken": params.buyToken,
        "receiver": params.from,
        "appData": params.appData,
        "partiallyFillable": false,
        "sellTokenBalance": "erc20",
        "buyTokenBalance": "erc20",
        "from": params.from,
        "priceQuality": "fast",
        "signingScheme": "eip1271",
        "onchainOrder": false,
        "kind": "sell",
        "sellAmountBeforeFee": params.sellAmountBeforeFee,
        "verificationGasLimit": params.verificationGasLimit
      }),
    }
  ).then(res => res.json());
}
  
async function submitOrder(params) {
  return await fetch(
    `https://barn.api.cow.fi/goerli/api/v1/orders`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "sellToken": params.sellToken,
        "buyToken": params.buyToken,
        "receiver": params.receiver,
        "sellAmount": params.sellAmount,
        "buyAmount": params.buyAmount,
        "validTo": params.validTo,
        "appData": params.appData,
        "feeAmount": params.feeAmount,
        "kind": "sell",
        "partiallyFillable": false,
        "sellTokenBalance": "erc20",
        "buyTokenBalance": "erc20",
        "signingScheme": "eip1271",
        "signature": params.signature,
        "from": params.from,
        "quoteId": params.quoteId
      }),        
    }
  ).then(res => res.json());
}

function simplifyBigNum(bn) {
  console.log(`length: ${bn.toString().length}`)
  return `${bn.toString()[0]}.${bn.toString().slice(1, 4)}*10e${bn.toString().length - 1}`;
}
  

module.exports = { getQuote, submitOrder, simplifyBigNum }