//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./fintech_subscription.sol";

contract subscriptionFactory {
	uint256 public numContractsDeployed;

	mapping(uint256 => address) internal contractAddress;
	mapping(uint256 => address) internal contractDeployer;
	mapping(address => uint256) public numuserContractsDeployed;

	event SubscriptionCreated(Subscription subscription);

	function createSubscription(
		uint96[] memory _price,
		string memory _name,
		address _owner,
		bool _USDt,
		bool _native,
		bool _recurring,
		bool _streaming
	) external {
		Subscription subscription = new Subscription(
			_price,
			_name,
			_owner,
			_USDt,
			_native,
			_recurring,
			_streaming
		);

		contractAddress[numContractsDeployed] = address(subscription);
		contractDeployer[numContractsDeployed] = _owner;
		numuserContractsDeployed[_owner]++;
		numContractsDeployed++;

		emit SubscriptionCreated(subscription);
	}

	function userDeployedContracts(
		address _user
	) external view returns (address[] memory) {
		uint256 contractCount = numuserContractsDeployed[_user];
		address[] memory contractList = new address[](contractCount);
		for (uint256 i; i < contractCount; i++) {
			contractList[i] = addressOfUserByIndex(_user, i);
		}
		return contractList;
	}

	function addressOfUserByIndex(
		address owner,
		uint256 index
	) internal view returns (address addr) {
		uint count;
		//timecomplexity is O(n)
		for (uint i; i < numContractsDeployed; i++) {
			if (owner == contractDeployer[i]) {
				if (count == index) return contractAddress[i];
				else count++;
			}
		}
	}
}
