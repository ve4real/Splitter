var Splitter = artifacts.require("./Splitter.sol");





module.exports = function(deployer) {

	var aliceAcc = 0x0;
	var bobAcc = 0x0;
	var carolAcc = 0x0;

	web3.eth.getAccounts(function(err,accs){
		if(err != null){
			alert("Error fatching accounts");
			return;
		}

		//just because i have to explicity manage the case where alice sends funds to the contract
		if(accs.length < 3){
			alert("Error fatching accounts");
			return;
		}

		aliceAcc = accs[0];
		bobAcc = accs[1];
		carolAcc = accs[2];

	})	

  	deployer.deploy(Splitter,aliceAcc,bobAcc,carolAcc);
};
