import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaEditor");
log.setLevel("debug");

import React, { useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";

import { Input } from "antd";
const { TextArea } = Input;

import { observer } from "mobx-react-lite";

import viewModel from "./FormulaViewModel";

import { StyledFormItem } from "./StyledComponents";

const FormulaEditor = observer(() => {
	log.debug("FormulaEditor.render");

	const textAreaRef = useCallback((node) => {
		log.debug("FormulaEditor.onCallback, node:", node);
		if (node !== null) {
			viewModel.formulaTextArea = ReactDOM.findDOMNode(
				node
			) as HTMLTextAreaElement;
			log.debug(
				"FormulaEditor.onCallback, formulaTextArea:",
				viewModel.formulaTextArea
			);
		}
	}, []);

	// log.debug("FormulaEditor, textAreaRef:", textAreaRef);
	// if (textAreaRef) {
	// 	viewModel.formulaTextArea = ReactDOM.findDOMNode(
	// 		textAreaRef.current
	// 	) as HTMLTextAreaElement;
	// 	log.debug("FormulaEditor, formulaTextArea:", viewModel.formulaTextArea);
	// }

	const onChange = (e) => {
		const value = e.target.value;
		log.debug("FormulaEditor, typeof value:", typeof value, ", value:", value);
		viewModel.formula = value;
	};

	return (
		<StyledFormItem
			validateStatus={viewModel.formulaErrorStatus}
			help={viewModel.formulaError}
		>
			<TextArea
				ref={textAreaRef}
				placeholder="Enter formula here"
				autoSize={{ minRows: 2 }}
				value={viewModel.formula}
				onChange={onChange}
				style={{ marginTop: "16px", marginBottom: "8px" }}
			/>
		</StyledFormItem>
	);
});

export default FormulaEditor;
