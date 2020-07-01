import log from "loglevel";
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;

import { cursor } from "@airtable/blocks";
import { useBase, useLoadable } from "@airtable/blocks/ui";

import viewModel from "./FormulaViewModel";
import { StyledFormItem } from "./StyledComponents";

const TableSelector = observer(() => {
	log.debug("TableSelector.render");

	useLoadable(cursor);

	const base = useBase();

	const onSelect = (value: string) => {
		viewModel.table = base.getTableById(value);
	};

	return (
		<StyledFormItem
			label="Table to run calculations in:"
			rules={[{ required: true, message: "Please select a table" }]}
		>
			<Select onSelect={onSelect} value={viewModel.tableId}>
				{base.tables.map((table) => (
					<Option key={table.id} value={table.id}>
						{table.name}
					</Option>
				))}
			</Select>
		</StyledFormItem>
	);
});

export default TableSelector;
