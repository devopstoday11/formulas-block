import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaForm");
log.setLevel("debug");

import React from "react";

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";

import { Form, Input, Progress } from "antd";

import styled from "styled-components";

import { base, cursor } from "@airtable/blocks";
import { useLoadable, useWatchable, useRecordById } from "@airtable/blocks/ui";

import viewModel, { CalculateInViewStatus } from "./FormulaViewModel";
import { StyledSubmitButton, StyledFormItem } from "./StyledComponents";
import TableSelector from "./TableSelector";
import ViewSelector from "./ViewSelector";
import FieldSelector from "./FieldSelector";
import FieldsDropdown from "./FieldsDropdown";
import FormulaDropdown from "./FormulaDropdown";
import FormulaEditor from "./FormulaEditor";

const StyledResultInput = styled(Input)`
	&& {
		width: 100%;
		background-color: white;
		color: rgba(0, 0, 0, 0.65);
		text-align: center;
	}

	&&::placeholder {
		text-align: center;
	}
`;

const FormulaForm = observer(() => {
	log.debug("FormulaForm.render");

	// load selected records and fields
	useLoadable(cursor);
	// re-render whenever the list of selected records or fields changes
	useWatchable(cursor, ["activeTableId", "selectedRecordIds"]);

	const table = base.getTableByIdIfExists(cursor.activeTableId as any);

	const record = useRecordById(
		table as any,
		cursor.selectedRecordIds.length > 0
			? cursor.selectedRecordIds[0]
			: ("" as any)
	);

	viewModel.selectedRecord = record;

	const onRun = () => {
		log.debug("FormulaForm.onRun");
		const result = viewModel.run(record);
		log.debug("FormulaForm.onRun, result:", toJS(result));
	};

	const onRunAndSave = () => {
		log.debug("FormulaForm.onRunAndSave");
		viewModel.runAndSave(record);
	};

	const onCalculateInView = () => {
		log.debug("FormulaForm.onCalculateInView");
		viewModel.calculateInView();
	};

	return (
		<Form layout="vertical">
			<TableSelector />
			<ViewSelector />
			<FieldSelector />
			<FieldsDropdown />
			<FormulaDropdown />
			<FormulaEditor />
			<StyledFormItem style={{ marginBottom: "16px" }}>
				<StyledResultInput
					id="result"
					placeholder="Result for selected record"
					value={viewModel.runResultFormValue}
					disabled={true}
				/>
			</StyledFormItem>
			<StyledFormItem>
				<StyledSubmitButton
					id="run"
					type="primary"
					justified="true"
					disabled={viewModel.disableRun}
					onClick={onRun}
				>
					Run on selected record
				</StyledSubmitButton>
			</StyledFormItem>
			<StyledFormItem
				validateStatus={viewModel.saveStatus}
				help={viewModel.saveStatusMessage}
			>
				<StyledSubmitButton
					id="save"
					type="primary"
					// htmlType="submit"
					loading={viewModel.isSaving}
					justified="true"
					disabled={viewModel.disableRunAndSave}
					onClick={onRunAndSave}
				>
					Run & update selected record
				</StyledSubmitButton>
			</StyledFormItem>
			<StyledFormItem
				validateStatus={viewModel.calculateInViewButtonStatus}
				help={viewModel.calculateInViewButtonStatusMessage}
				style={{ marginBottom: "0px" }}
			>
				<StyledSubmitButton
					id="calculateInView"
					type="primary"
					loading={viewModel.isCalculatingInView}
					justified="true"
					disabled={viewModel.disableCalculateInView}
					onClick={onCalculateInView}
				>
					Run & update view
				</StyledSubmitButton>
			</StyledFormItem>
			<CalculateInViewProgress />
		</Form>
	);
});

const CalculateInViewProgress = observer(() => {
	if (viewModel.calculateInViewStatus == CalculateInViewStatus.none) {
		return null;
	}

	return (
		<Progress
			style={{ width: "100%" }}
			percent={viewModel.calculateInViewProgressPercent}
			status={viewModel.calculateInViewProgressStatus}
		/>
	);
});

export default FormulaForm;
