const Splitter = artifacts.require("./Splitter.sol");
const Pr = require("bluebird");
const getBalancePromise = Pr.promisify(web3.eth.getBalance);


contract("Splitter", accounts => {
	var owner = accounts[0];
	var alice = accounts[1];
	var bob = accounts[2];
	var carol = accounts[3];
	var testAccSender = accounts[4];
	var testAccReceiver1 = accounts[5];
	var testAccReceiver2 = accounts[6];
	var wrongAccount = 0x0;
	let contract = null;



	beforeEach(function(){
		return Splitter.new(alice, bob, carol, {from: owner})
			.then(_instance => contract = _instance);
	});

	it("Should be owned by owner", function(){
		return contract.owner({from:owner})
		.then(function(_owner){
			assert.strictEqual(_owner, owner, "Contract is NOT owned by owner");
		});
	});

	it("Should change owner", function(){
		var newOwner = alice;
		return contract.ChangeOwner.sendTransaction(newOwner, {from:owner})
		.then(function(txHash){
			return contract.owner() //not need {from:newOwner}
			.then(function(_owner){
				assert.strictEqual(_owner, newOwner, "New owner has NOT been set");
			});
		});
	});

	it("Should NOT change owner", function(){
		var newOwner = alice;
		return contract.ChangeOwner.sendTransaction(newOwner, {from:bob}) //bob cannot change owner!
		.then(function(txHash){
			return contract.owner() //not need {from:newOwner}
			.then(function(_owner){
				assert.strictEqual(_owner, owner, "SECURITY BREACH! Bob has changed the owner!");
			});
		})
		.catch(function(){ //this catch is for the ChangeOwner transaction
			/*it's ok to be here */
			return contract.owner() //not need {from:newOwner}
			.then(function(_owner){
				assert.notEqual(_owner, newOwner, "SECURITY BREACH! Bob has changed the owner!");
			});
		});
	});



	it("Should set the accounts correctly", function(){
		return Pr.join(
	    	contract.alice(),
	      	contract.bob(),
	      	contract.carol(),
	      	function(_alice, _bob, _carol){
	      		Pr.all([
		      		assert.equal(_alice, alice, "Alice's addr not set"),
		      		assert.equal(_bob, bob, "Bob's addr not set"),
		      		assert.equal(_carol, carol, "Carol's addr not set")
		      	])
	      	}
	    );
	});
/*
	it("Should not instantiate a new contract", function(){
		var testInstance = null;
		return Splitter.new(alice, bob, wrongAccount, {from:owner})
		.then(function(_instance){
			testInstance = _instance;
			return contract.carol()
			.then(function(_carol){
				assert.strictEqual(_carol, carol, "Contract with an empty address");
			});
		})
		.catch(function(){
			//it's ok to be here 
			assert.equal(testInstance, null, "Contract has been created anyway!");
		});
	})
	*/

	it("Should split money between bob and carol", function(){
		var contractBalance = null;
		var bobBalance = null;
		var carolBalance = null;

		return getBalancePromise(contract.address)
		.then( _contractBalBefore => {
			contractBalance = _contractBalBefore;
			return getBalancePromise(bob)
			.then( _bobBalBefore => {
				bobBalance = _bobBalBefore;
				return getBalancePromise(carol)
				.then( _carolBalBefore => {
					carolBalance = _carolBalBefore;
					return contract.sendTransaction({from: alice, to: contract.address, value: 111})
					.then(function(_txHash){
						Pr.join( //clever way to do it...
							getBalancePromise(contract.address),
							getBalancePromise(bob),
							getBalancePromise(carol),
							function(_contractBal,_bobBal,_carolBal){
								Pr.join(//toNumber() or toNumber(10) does not work... why???
									assert.equal(_bobBal.toString(), bobBalance.plus(55).toString(), "Bob seems to have the wrong balance"),
									assert.equal(_carolBal.toString(), carolBalance.plus(55).toString(), "Carol seems to have the wrong balance"),
									assert.equal(_contractBal.toString(), contractBalance.toString(), "Contract has changed its balance")
								)
							}
						)
					})
				})
			})
		})
	});


	it("Should split money between two random accounts", function(){
		var testAccReceiver1Balance = null;
		var testAccReceiver2Balance = null;

		return getBalancePromise(testAccReceiver1)
		.then( _acc1Bal => {
			testAccReceiver1Balance = _acc1Bal;
			return getBalancePromise(testAccReceiver2)
			.then( _acc2Bal => {
				testAccReceiver2Balance = _acc2Bal;
				return contract.split.sendTransaction(testAccReceiver1, testAccReceiver2, {from: testAccSender, value: 111})
				.then(function(_txHash){
					Pr.join(
						getBalancePromise(testAccReceiver1),
						getBalancePromise(testAccReceiver2),
						function(__acc1Bal,__acc1Ba2){
							Pr.join(
								assert.equal(__acc1Bal.toString(), (testAccReceiver1Balance.plus(55).toString()), "Receiver1 seems to have the wrong balance"),
								assert.equal(__acc1Ba2.toString(), (testAccReceiver2Balance.plus(55).toString()), "Receiver2 seems to have the wrong balance")
							)
						}
					)
				})
			})
		})
	});

	it("Should simply store some money into contract", function(){
		var contractBalance = null;

		return getBalancePromise(contract.address)
		.then(_contractBalBefore =>{
			contractBalance = _contractBalBefore;
			return contract.sendTransaction({from: testAccSender, value: 111})
			.then(function(_txHash){
				return getBalancePromise(contract.address)
				.then(function(_newBalance){
					assert.equal(_newBalance, (contractBalance.plus(111).toString()), "Wrong contract balance!");
				})
			})
		})
	});



})