pragma solidity 0.4.13;

import "./Runnable.sol";

contract Splitter is Runnable{
	address public alice;
	address public bob;
	address public carol;

	//IMPORTANT: the split function will store money into balances and send them only if requested
	mapping(address => uint) public balances;

	event LogSplitMoney(address indexed sender, address indexed receiver1, address indexed receiver2, uint value);
	event LogWithdrawn(address  indexed who, uint amount);

	function Splitter(address aliceAddr, address bobAddr, address carolAddr){
		//if(aliceAddr == 0x0) revert();
		//if(bobAddr == 0x0) revert();
		//if(carolAddr == 0x0) revert();
		
		alice = aliceAddr;
		bob = bobAddr;
		carol = carolAddr;
	}

	

	function split(address addr1, address addr2) 
	public
	payable
	onlyIfRunning
	returns (bool success)
	{
		//check correct address here
		if(addr1 == 0x0) revert();
		if(addr2 == 0x0) revert();


		uint rest = msg.value % 2;
		uint money = msg.value;
		if(rest == 1){
			money--;
			//send rest to msg.sender
			msg.sender.transfer(1);
		}

		money /= 2;

		/*IMPORTANT antipattern below
		addr1.transfer(money);
		addr2.transfer(money);
		*/

		//now it stores the money in the contract and send it to the recipient only if he asks for it
		balances[addr1] += money;
		balances[addr2] += money;

		LogSplitMoney(msg.sender, addr1, addr2, msg.value);

		return true;
	}


	function withdraw()
	public
	onlyIfRunning
	returns (bool success)
	{
		uint balance = balances[msg.sender];
		if(balance > 0){
			balances[msg.sender] = 0;
			msg.sender.transfer(balance);
			LogWithdrawn(msg.sender, balance);
			return true;
		}

		return false;
	}

	/* Alice should use the split function
	function () 
	payable
	onlyIfRunning
	{
		if(msg.sender == alice)
			split(bob, carol);
	}*/
}