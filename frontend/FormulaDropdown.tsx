import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaDropdown");
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;
import { DownOutlined } from "@ant-design/icons";

import { useBase } from "@airtable/blocks/ui";

import viewModel from "./FormulaViewModel";

const FormulaDropdown = () => {
	log.debug(
		"FormulaDropdown.enter, supportedFormulas.length:",
		viewModel.supportedFormulas.length
	);

	const onChange = (value) => {
		log.debug("FormulaDropdown.onChange, value:", value);
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
		<Select
			showSearch
			placeholder="Insert a formula"
			optionFilterProp="children"
			onChange={onChange}
			// onFocus={onFocus}
			// onBlur={onBlur}
			// onSearch={onSearch}
			filterOption={filterOption}
			style={{ width: "50%", paddingLeft: "4px" }}
		>
			{viewModel.supportedFormulas.map((name) => {
				return (
					<Option key={name} value={name}>
						{name}
					</Option>
				);
			})}
		</Select>
	);
};

export default FormulaDropdown;
