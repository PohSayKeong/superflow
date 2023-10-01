import type { NextPage } from "next"
import Head from "next/head"
import React from "react"
import ApplicationLayout from "../components/ApplicationLayout"
import styles from "../styles/Dashboard.module.css"
import { isMounted } from "../hooks/isMounted"
import WrapToken from "../components/WrapToken"

const Dashboard: NextPage = () => {
	const mounted = isMounted()

	return (
		<div>
			<Head>
				<title>Dashboard | SuperFlow</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<ApplicationLayout isActive={[0, 0, 1]}>
				<main className={styles.container}>
					<div className={styles.contents}>
						<div>{mounted ? <WrapToken /> : null}</div>
					</div>
				</main>
			</ApplicationLayout>
		</div>
	)
}

export default Dashboard
