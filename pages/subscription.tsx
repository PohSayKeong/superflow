import React, { useState } from "react"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import ApplicationLayout from "../components/ApplicationLayout"
import styles from "../styles/Subscription.module.css"
import {
	usePrepareContractWrite,
	useContractWrite,
	useAccount,
	useWaitForTransaction,
	useContractEvent,
} from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { isMounted } from "../hooks/isMounted"
import fintechFactory from "../deployment/fintechfactory.json"
import fintechFactoryAbi from "../artifacts/contracts/fintech_factory.sol/subscriptionFactory.json"

const Subscription: NextPage = () => {
	const mounted = isMounted()

	const [subscriptionDetails, setSubscriptionDetails] = useState({
		subscriptionName: "",
		monthlyPrices: "",
		isUSDTAccepted: false,
		isNativeAccepted: false,
		isRecurringPayment: false,
		isStreamingPayment: false,
	})

	const {
		subscriptionName,
		monthlyPrices,
		isUSDTAccepted,
		isNativeAccepted,
		isRecurringPayment,
		isStreamingPayment,
	} = subscriptionDetails

	const { address, isConnected } = useAccount()
	const { config } = usePrepareContractWrite({
		//FACTORY
		address: fintechFactory.address as `0x${string}`,
		abi: fintechFactoryAbi.abi,
		functionName: "createSubscription",
		args: [
			convertPricesToArray(monthlyPrices),
			subscriptionName,
			address,
			isUSDTAccepted,
			isNativeAccepted,
			isRecurringPayment,
			isStreamingPayment,
		],
	})
	useContractEvent({
		//FACTORY
		address: fintechFactory.address as `0x${string}`,
		abi: fintechFactoryAbi.abi,
		eventName: "SubscriptionCreated",
		listener(subscription) {
			console.log(subscription)
		},
	})

	const { data, isLoading, isSuccess, write } = useContractWrite(config)

	var { isSuccess: txSuccess } = useWaitForTransaction({
		hash: data?.hash,
	})

	function handleChange(event: Event) {
		if (!event.target) return
		const target = event.target as HTMLInputElement
		if (target.type === "checkbox") {
			setSubscriptionDetails((prev) => ({
				...prev,
				[target.name]: !prev[target.name],
			}))
		} else {
			setSubscriptionDetails((prev) => ({
				...prev,
				[target.name]: target.value,
			}))
		}
	}

	function convertPricesToArray(monthlyPrices: string) {
		return monthlyPrices.split(",").map(Number)
	}

	function handleSubmit(event: Event) {
		event.preventDefault()
		write?.()
	}

	function handleFlip() {
		// var hi = (document.getElementById('mainForm') as HTMLFormElement);
		// hi.reset()y
		// not sure why the above doesnt work

		var element = document.getElementById("card")
		if (element != null) {
			element.classList.toggle(styles.is_flipped)
		}
	}

	return (
		<div>
			<Head>
				<title>Create Subscription | SuperFlow</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<ApplicationLayout isActive={[0, 1, 0]}>
				<main className={`${styles.scene}`}>
					<div
						id="card"
						className={`${styles.card} ${txSuccess && styles.is_flipped}`}
					>
						<form
							id="mainForm"
							className={`${styles.card__face} ${styles.card__face__front}`}
							onSubmit={handleSubmit}
						>
							<div className={styles.headerTag}>
								<p className={styles.headerTagTxt}>Create Subscription</p>
							</div>
							<label>
								Subscription name:
								<input
									type="text"
									name="subscriptionName"
									placeholder="e.g. SuperFlow subscription"
									value={subscriptionName}
									onChange={handleChange}
									className={styles.text_input}
									required
								/>
							</label>
							<label>
								Monthly price(s): <br />
								<small>Separate by "," for multiple prices</small>
								<input
									type="text"
									name="monthlyPrices"
									placeholder="e.g. 7, 10, 15"
									value={monthlyPrices}
									onChange={handleChange}
									className={styles.text_input}
									required
								/>
							</label>
							Accepted tokens:
							<label className={styles.stablecoin_box}>
								<p className={styles.subscription_text}>USDT:</p>
								<img
									src="https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Tether-USDT-icon.png"
									className={styles.token_icon}
								/>
								<label className={styles.switch}>
									<input
										type="checkbox"
										name="isUSDTAccepted"
										value="true"
										onChange={handleChange}
									/>
									<span className={styles.slider}></span>
								</label>
								<p className={styles.subscription_text}>XRP:</p>
								<img
									src="https://cdn-icons-png.flaticon.com/512/6675/6675833.png"
									className={styles.token_icon}
								/>
								<label className={styles.switch}>
									<input
										type="checkbox"
										name="isNativeAccepted"
										value="true"
										onChange={handleChange}
									/>
									<span className={styles.slider}></span>
								</label>
							</label>
							<label className={styles.subscription_box}>
								<p className={styles.subscription_text}>Recurring payment:</p>
								<label className={styles.switch}>
									<input
										type="checkbox"
										name="isRecurringPayment"
										value="true"
										onChange={handleChange}
									/>
									<span className={styles.slider}></span>
								</label>

								<p className={styles.subscription_text}>Streaming payment:</p>
								<label className={styles.switch}>
									<input
										type="checkbox"
										name="isStreamingPayment"
										value="true"
										onChange={handleChange}
									/>
									<span className={styles.slider}></span>
								</label>
							</label>
							<div>
								{mounted ? (
									isConnected ? (
										<button
											type="submit"
											className={styles.submit_btn}
											disabled={isLoading || isSuccess}
											data-mint-loading={isLoading}
											data-mint-started={isSuccess}
										>
											{isLoading && "Waiting for approval"}
											{isSuccess && "Deploying please wait..."}
											{!isLoading && !isSuccess && "Deploy subscription!"}
										</button>
									) : (
										<div className={styles.connectButton}>
											<ConnectButton />
										</div>
									)
								) : null}
							</div>
						</form>
						<div className={`${styles.card__face} ${styles.card__face__back}`}>
							<div className={styles.success_msg_box}>
								<h2>SUCCESS</h2>
							</div>
							<div className={styles.success_info_box}>
								<p className={styles.success_msg}>
									Congratulations, your subscription contract is successfully
									deployed.
								</p>
								<a
									href={`https://goerli.etherscan.io/tx/${data?.hash}`}
									target="_blank"
									className={styles.link}
								>
									View transaction details
								</a>
								<form>
									<button className={styles.button} onClick={handleFlip}>
										Deploy another contract
									</button>
								</form>
								<Link className={styles.button} href="/dashboard">
									View dashboard
								</Link>
							</div>
						</div>
					</div>
				</main>
			</ApplicationLayout>
		</div>
	)
}

export default Subscription
