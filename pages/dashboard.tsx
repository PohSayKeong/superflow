import type { NextPage } from "next"
import Head from "next/head"
import React from "react"
import ApplicationLayout from "../components/ApplicationLayout"
import DashboardTables from "../components/DashboardTables"
import styles from "../styles/Dashboard.module.css"
import { isMounted } from "../hooks/isMounted"

const Dashboard: NextPage = () => {
	const mounted = isMounted()

	return (
		<div>
			<Head>
				<title>Dashboard | SuperFlow</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<ApplicationLayout isActive={[1, 0, 0]}>
				<main className={styles.container}>
					<div className={styles.contents}>
						<div className={styles.headerTag}>
							<h2 className={styles.headerTagTxt}>Deployed Contracts:</h2>
						</div>
						<div>{mounted ? <DashboardTables /> : null}</div>
					</div>
				</main>
			</ApplicationLayout>
		</div>
	)
}

export default Dashboard
