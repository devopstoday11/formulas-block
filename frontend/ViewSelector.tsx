import log from "loglevel";
log.setLevel("debug");

import React from "react";

import { observer } from "mobx-react-lite";

import { Select } from "antd";
const { Option } = Select;

import { useBase } from "@airtable/blocks/ui";

import viewModel from "./FormulaViewModel";
import { StyledFormItem } from "./StyledComponents";

const ViewSelector = observer(() => {
	log.debug("ViewSelector.render");

	const base = useBase();

	const onSelect = (viewId: string) => {
		viewModel.viewId = viewId;
	};

	return (
		<StyledFormItem
			label="View to run calculations in"
			rules={[{ required: true, message: "Please select a view" }]}
		>
			<Select
				onSelect={onSelect}
				value={
					viewModel.view && !viewModel.view.isDeleted ? viewModel.view.id : null
				}
			>
				{viewModel.validViews.map((view) => (
					<Option key={view.id} value={view.id}>
						{view.name}
					</Option>
				))}
			</Select>
		</StyledFormItem>
	);
});

export default ViewSelector;
