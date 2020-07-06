import loglevel from "loglevel";
const log = loglevel.getLogger("FunctionsDropdown");
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;

import { StyledSelect } from "./StyledComponents";

import viewModel from "./FormulaViewModel";

const FunctionsDropdown = () => {
	log.debug(
		"FunctionsDropdown.render, supportedFunctions.length:",
		viewModel.supportedFunctions.length
	);

	const onChange = (value) => {
		log.debug("FunctionsDropdown.onChange, value:", value);
		viewModel.insertFunction(value);
	};

	const filterOption = (input, option) => {
		return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
	};

	// function onBlur() {
	// 	console.log("blur");
	// }

	// function onFocus() {
	// 	console.log("focus");
	// }

	// function onSearch(val) {
	// 	console.log("search:", val);
	// }

	return (
		<StyledSelect
			showSearch
			placeholder="Insert a function"
			optionFilterProp="children"
			onChange={onChange}
			value={null}
			// onFocus={onFocus}
			// onBlur={onBlur}
			// onSearch={onSearch}
			filterOption={filterOption}
			style={{ width: "50%", paddingLeft: "4px" }}
		>
			{viewModel.supportedFunctions.map((name) => {
				return (
					<Option key={name} value={name}>
						{name}
					</Option>
				);
			})}
		</StyledSelect>
	);
};

export default FunctionsDropdown;
