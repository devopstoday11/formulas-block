import loglevel from "loglevel";
const log = loglevel.getLogger("NewVersion");
log.setLevel("debug");

import { expect } from "chai";

import { Octokit } from "@octokit/core";
import Package from "../package.json";

import { observable, decorate, autorun, computed, flow } from "mobx";
import * as mobxUtils from "mobx-utils";

const octokit = new Octokit();

export class NewVersion {
	isChecking: boolean;
	checkError: Error | null;
	autorunDisposer: any;
	latestRelease: any;
	latestVersion: string | null;
	exists: boolean;
	showInfo: boolean;

	constructor() {
		log.debug("NewVersion.constructor");

		expect(Package.github).to.be.an("object");
		expect(Package.github.owner).to.be.a("string").that.is.ok;
		expect(Package.github.repo).to.be.a("string").that.is.ok;

		this.isChecking = false;
		this.checkError = null;
		this.latestRelease = null;
		this.latestVersion = null;
		this.exists = true;
		this.showInfo = false;

		this.autorunDisposer = autorun(() => {
			// autorun every 5 minutes.
			// Github limits non authenticated api calls to 60 per hour by ip address
			mobxUtils.now(300000);
			this.check();
		});
	}

	check = flow(function* () {
		this.checkingForNewVersion = true;
		try {
			const result = yield octokit.request(
				"GET /repos/{owner}/{repo}/releases",
				{
					owner: Package.github.owner,
					repo: Package.github.repo,
				}
			);
			log.debug("NewVersion.check, result:", result);
			if (result.status != 200) {
				log.error("NewVersion.check, error result:", result);
				this.checkForNewVersionError = result;
				return;
			}
		} catch (e) {
			log.error("NewVersion.check, error:", e);
			this.checkForNewVersionError = e;
		} finally {
			this.checkingForNewVersion = false;
		}
	});
}

decorate(NewVersion, {
	isChecking: observable,
	checkError: observable,
	latestVersion: observable,
	exists: observable,
	showInfo: observable,
});

const newVersion = new NewVersion();

export default newVersion;
