import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaEditor");
log.setLevel("debug");

import React from "react";

import { Input } from "antd";
const { TextArea } = Input;

import { observer } from "mobx-react-lite";

import viewModel from "./FormulaViewModel";

import { StyledFormItem } from "./StyledComponents";

const FormulaEditor = observer(() => {
	log.debug("FormulaEditor.render");

	const onChange = (e) => {
		const value = e.target.value;
		log.debug("FormulaEditor, typeof value:", typeof value, ", value:", value);
		viewModel.formula = value;
	};

	return (
		<StyledFormItem>
			<TextArea
				placeholder="Enter formula here"
				autoSize={true}
				value={viewModel.formula}
				onChange={onChange}
				style={{ marginTop: "24px" }}
			/>
		</StyledFormItem>
	);
});

export default FormulaEditor;
