pragma solidity ^0.4.4;

import "./Mortal.sol";

contract Splitter is Mortal{
	address public alice;
	address public bob;
	address public carol;

	uint public contractBalance;

	event LogSplitMoney(address sender, address receiver1, address receiver2, uint value);

	function Splitter(address aliceAddr, address bobAddr, address carolAddr){
		/*	if(aliceAddr == 0x0) throw;
			if(bobAddr == 0x0) throw;
			if(carolAddr == 0x0) throw;
		*/
		alice = aliceAddr;
		bob = bobAddr;
		carol = carolAddr;
	}

	

	function split(address addr1, address addr2) 
	public
	payable
	returns (bool success)
	{
		uint rest = msg.value % 2;
		uint money = msg.value;
		if(rest == 1){
			money--;
			//send rest to msg.sender
			msg.sender.transfer(1);
		}

		money /= 2;
		addr1.transfer(money);
		addr2.transfer(money);

		LogSplitMoney(msg.sender, addr1, addr2, money);

		return true;
	}




	function () 
	public
	payable{
		if(msg.sender == alice)
			split(bob, carol);
	}

}