pragma solidity ^0.4.4;

contract Owned {

	address public owner;
	event LogNewOwner(address sender, address ondOwner, address newOwner);

	function Owned(){
		owner = msg.sender;
	}

	modifier onlyOwner{
		require(msg.sender == owner);
		_;
	}

	function ChangeOwner(address newOwner) 
	public 
	onlyOwner 
	returns(bool success)
	{
		if(newOwner == 0) revert();

		LogNewOwner(msg.sender, owner, newOwner);
		owner = newOwner;
		return true;
	} 

}