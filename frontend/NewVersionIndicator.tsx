import loglevel from "loglevel";
const log = loglevel.getLogger("NewVersionIndicator");
log.setLevel("debug");

import { expect } from "chai";

import React from "react";

import { observer } from "mobx-react-lite";

import { Modal, Button } from "antd";

import Package from "../package.json";

import newVersion from "./NewVersion";

const NewVersionIndicator = observer(() => {
	log.debug("NewVersionIndicator.render");

	expect(Package.homepage).to.be.a("string").that.is.ok;
	expect(Package.releaseNotes).to.be.a("string").that.is.ok;

	const onClick = () => {
		Modal.info({
			title: "New version available",
			// centered: true,
			content: (
				<div>
					<p>
						A new version is available, version {newVersion.latestVersion}. Your
						current version is {Package.version}.
					</p>
					<p>
						For update instructions, visit the block's{" "}
						<a href={Package.homepage} target="_blank">
							homepage
						</a>
						.
					</p>
					<p>
						For information about the new version, visit the block's{" "}
						<a href={Package.releaseNotes} target="_blank">
							release notes
						</a>
						.
					</p>
				</div>
			),
			onOk() {},
		});
	};

	if (!newVersion.exists) {
		return null;
	}

	return (
		<Button type="link" onClick={onClick}>
			New version available
		</Button>
	);
});

export default NewVersionIndicator;
