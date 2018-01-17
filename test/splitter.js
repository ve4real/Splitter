const Splitter = artifacts.require("./Splitter.sol");
const Pr = require("bluebird");
Pr.promisifyAll(web3.eth, { suffix: "Promise" });
//const getBalancePromise = Pr.promisify(web3.eth.getBalance);

web3.eth.getTransactionReceiptMined = require("./getTransactionReceiptMined.js");


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
		return contract.getOwner.call()
		.then(function(_owner){
			assert.strictEqual(_owner, owner, "Contract is NOT owned by owner");
		});
	});

	it("Should change owner", function(){
		var newOwner = alice;
		return contract.changeOwner.sendTransaction(newOwner, {from:owner})
		.then(function(txHash){
			//return contract.owner() //not need {from:newOwner} --> cause i should wait for it to be mined!!!
			return web3.eth.getTransactionReceiptMined(txHash);
		})
		.then(function(receipt){
			assert.strictEqual(receipt.logs.length, 1, "Should have changed owner and emitted an event");
			return contract.getOwner.call();
		})
		.then(function(_owner){
			assert.strictEqual(_owner, newOwner, "New owner has NOT been set");
		});
	});



	it("Should NOT change owner", function(){
		var newOwner = alice;
		return contract.changeOwner.sendTransaction(newOwner, {from:bob}) //bob cannot change owner!
		.then(function(txHash){
			return web3.eth.getTransactionReceiptMined(txHash);
		})
		.then(function(receipt){
			assert.strictEqual(receipt.logs.length, 0, "Should have NOT changed owner and emitted an event");
			return contract.getOwner.call();
		})
		.then(function(_owner){
			assert.strictEqual(_owner, owner, "SECURITY BREACH! Bob has changed the owner!");
		})
		.catch(function(){ //this catch is for the ChangeOwner transaction
			/*it's ok to be here */
			return contract.getOwner.call() //not need {from:newOwner}
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
				return Pr.all([
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

	it("Should split money and create event", function(){
		
		return contract.split(bob, carol, {from: alice, to: contract.address, value: 111})
		.then(_txObject => {
            assert.strictEqual(_txObject.logs.length, 1);
            assert.strictEqual(_txObject.logs[0].event, "LogSplitMoney");
            assert.strictEqual(_txObject.logs[0].args.sender, alice);
            assert.strictEqual(_txObject.logs[0].args.receiver1, bob);
            assert.strictEqual(_txObject.logs[0].args.receiver2, carol);
            assert.strictEqual(_txObject.logs[0].args.value.toString(10), "111");
        })
		
	});


	it("Should withdraw bob's amount and create event", function(){
		return contract.split(bob, carol, {from: alice, to: contract.address, value: 111})
		.then(() => {
			return contract.withdraw({ from: bob });
		})
        .then(_txObject => {
        	console.log(_txObject)
            assert.strictEqual(_txObject.logs.length, 1);
            assert.strictEqual(_txObject.logs[0].event, "LogWithdrawn");
            assert.strictEqual(_txObject.logs[0].args.who, bob);
            assert.strictEqual(_txObject.logs[0].args.amount.toString(10), "55");
        });
	});
/*	

	it("Should split money between two random accounts", function(){
		var testAccReceiver1Balance = null;
		var testAccReceiver2Balance = null;

		return web3.eth.getBalancePromise(testAccReceiver1)
		.then( _acc1Bal => {
			testAccReceiver1Balance = _acc1Bal;
			return web3.eth.getBalancePromise(testAccReceiver2);
		})
		.then( _acc2Bal => {
			testAccReceiver2Balance = _acc2Bal;
			return contract.split.sendTransaction(testAccReceiver1, testAccReceiver2, {from: testAccSender, value: 111});
		})
		.then(function(_txHash){
			return web3.eth.getTransactionReceiptMined(_txHash);
		})
		.then(function(receipt){
			assert.strictEqual(receipt.logs.length, 1, "Should have splitted money and emitted an event");
			return Pr.join(
				web3.eth.getBalancePromise(testAccReceiver1),
				web3.eth.getBalancePromise(testAccReceiver2),
				function(__acc1Bal,__acc1Ba2){
					return Pr.join(
						assert.equal(__acc1Bal.toString(), (testAccReceiver1Balance.plus(55).toString()), "Receiver1 seems to have the wrong balance"),
						assert.equal(__acc1Ba2.toString(), (testAccReceiver2Balance.plus(55).toString()), "Receiver2 seems to have the wrong balance")
					)
				}
			)
		})
	});

	it("Should simply store some money into contract", function(){
		var contractBalance = null;

		return web3.eth.getBalancePromise(contract.address)
		.then(_contractBalBefore =>{
			contractBalance = _contractBalBefore;
			return contract.sendTransaction({from: testAccSender, value: 111});
		})
		.then(function(_txHash){
			return web3.eth.getTransactionReceiptMined(_txHash);
		})
		.then(function(receipt){
			//assert.strictEqual(receipt.logs.length, 1, "Should have splitted money and emitted an event");
			return web3.eth.getBalancePromise(contract.address);
		})
		.then(function(_newBalance){
			assert.equal(_newBalance, (contractBalance.plus(111).toString()), "Wrong contract balance!");
		})
	});

	*/

})