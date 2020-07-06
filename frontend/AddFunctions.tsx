import loglevel from "loglevel";
const log = loglevel.getLogger("AddFunctions");
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Form, Input, Button, List, Spin, Tooltip, Typography } from "antd";
const { Paragraph } = Typography;

import viewModel from "./FormulaViewModel";
import { CloseCircleOutlined } from "@ant-design/icons";
import Modal from "antd/lib/modal/Modal";

// TODO: Split to separate viewModel
const AddScriptForm = observer(() => {
	log.debug("AddFunctionsForm.render");

	const onScriptUrlChange = (e) => {
		viewModel.scriptURL = e.target.value;
	};

	const onAddScript = () => {
		log.debug("AddFunctions.onAddScript");
		viewModel.addScript();
	};

	return (
		<Form
			layout="inline"
			// style={{
			// 	display: "flex",
			// 	flexDirection: "row",
			// 	justifyContent: "stretch",
			// }}
		>
			<Form.Item
				style={{ marginRight: "8px" }}
				{...viewModel.scriptURLValidationProps}
			>
				<Input
					type="url"
					placeholder="Enter script url"
					style={{ width: "268px" }}
					value={viewModel.scriptURL}
					onChange={onScriptUrlChange}
				/>
			</Form.Item>
			<Form.Item style={{ marginRight: "0px" }}>
				<Button
					type="primary"
					style={{ width: "100px" }}
					disabled={viewModel.disableAddScriptButton}
					onClick={onAddScript}
				>
					Add script
				</Button>
			</Form.Item>
		</Form>
	);
});

// TODO: Split to separate viewModel
const ScriptsList = observer(() => {
	log.debug("ListScripts.render", viewModel.rerenderFunctionScripts);

	return (
		<List
			header="Loaded function scripts"
			size="small"
			bordered
			dataSource={viewModel.functionScripts}
			renderItem={(script) => (
				<List.Item
					actions={[
						<Tooltip title="Remove script">
							<Button
								type="link"
								icon={<CloseCircleOutlined style={{ color: "gray" }} />}
								onClick={() => viewModel.removeScript(script)}
							/>
						</Tooltip>,
					]}
				>
					<a href={script} target="_blank">
						{script}
					</a>
				</List.Item>
			)}
			locale={{ emptyText: "No scripts loaded" }}
			style={{ marginTop: "16px" }}
		/>
	);
});

const ReloadBlockModal = observer(() => {
	log.debug("ReloadBlockModal.render");

	return (
		<Modal
			title="Block reload required"
			// centered={true}
			visible={viewModel.showReloadBlockModal}
			okText="Yes"
			cancelText="No"
			onOk={() => {
				location.reload();
			}}
			onCancel={() => {
				viewModel.showReloadBlockModal = false;
			}}
		>
			You need to reload the block for the changes to take effect. Would you
			like to reload the block now?
		</Modal>
	);
});

// TODO: Split to separate viewModel
const AddFunctions = observer(() => {
	log.debug("AddFunctions.render");

	return (
		<Spin spinning={viewModel.loadingScripts} tip="Loading script...">
			<Paragraph style={{ textAlign: "justify" }}>
				The formulas block can be extended with additional functions from
				dynamically loaded scripts. To view a list of scripts with extension
				functions for the block,{" "}
				<a
					href="https://www.npmjs.com/search?q=keywords:formulas-superblock-functions"
					target="_blank"
				>
					click here.
				</a>
			</Paragraph>
			<Paragraph style={{ textAlign: "justify" }}>
				For instructions on how to create a script with dynamically loaded
				extension functions, visit the block's{" "}
				<a
					href="https://github.com/superblocks-at/formulas-block"
					target="_blank"
				>
					open source repository.
				</a>
			</Paragraph>
			<AddScriptForm />
			<ScriptsList />
			<ReloadBlockModal />
		</Spin>
	);
});

export default AddFunctions;
