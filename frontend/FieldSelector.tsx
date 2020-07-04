import log from "loglevel";
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;

import { useBase } from "@airtable/blocks/ui";

import viewModel from "./FormulaViewModel";
import { StyledFormItem } from "./StyledComponents";

const FieldSelector = observer(() => {
	log.debug("FieldSelector.render");

	const base = useBase();

	const onSelect = (fieldId: string) => {
		viewModel.fieldId = fieldId;
	};

	return (
		<StyledFormItem
			label="Field to save calculations in"
			rules={[{ required: true, message: "Please select a field" }]}
			style={{ marginBottom: "16px" }}
		>
			<Select
				onSelect={onSelect}
				value={
					viewModel.field && !viewModel.field.isDeleted
						? viewModel.field.id
						: null
				}
			>
				{viewModel.nonComputedFields.map((field) => (
					<Option key={field.id} value={field.id}>
						{field.name}
					</Option>
				))}
			</Select>
		</StyledFormItem>
	);
});

export default FieldSelector;
