import loglevel from "loglevel";
const log = loglevel.getLogger("FieldsDropdown");
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;
import { DownOutlined } from "@ant-design/icons";

import { useBase } from "@airtable/blocks/ui";

import viewModel from "./FormulaViewModel";

const FieldsDropdown = observer(() => {
	log.debug("FieldsDropdown.enter");

	const base = useBase();

	const onChange = (value) => {
		log.debug("FieldsDropdown.onChange, value:", value);
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
			placeholder="Insert a field"
			optionFilterProp="children"
			onChange={onChange}
			// onFocus={onFocus}
			// onBlur={onBlur}
			// onSearch={onSearch}
			filterOption={filterOption}
			style={{ width: "50%", paddingRight: "4px" }}
		>
			{viewModel.availableFields.map((field) => {
				return (
					<Option key={field.id} value={field.id}>
						{field.name}
					</Option>
				);
			})}
		</Select>
	);
});

export default FieldsDropdown;
