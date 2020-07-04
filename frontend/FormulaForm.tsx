import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaForm");
log.setLevel("debug");

import React from "react";

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";

import { Form, Input } from "antd";

import styled from "styled-components";

import { base, cursor } from "@airtable/blocks";
import { useLoadable, useWatchable, useRecordById } from "@airtable/blocks/ui";

import TableSelector from "./TableSelector";
import FieldsDropdown from "./FieldsDropdown";
import FormulaDropdown from "./FormulaDropdown";
import FormulaEditor from "./FormulaEditor";
import { StyledSubmitButton, StyledFormItem } from "./StyledComponents";
import viewModel from "./FormulaViewModel";
import FieldSelector from "./FieldSelector";

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
		log.debug("FormulaForm.onRun");
		viewModel.runAndSave(record);
	};

	return (
		<Form layout="vertical">
			<TableSelector />
			<FieldSelector />
			<FieldsDropdown />
			<FormulaDropdown />
			<FormulaEditor />
			<StyledFormItem>
				<StyledResultInput
					id="result"
					placeholder="Result on selected record"
					value={viewModel.runResultFormValue}
					disabled={true}
				/>
			</StyledFormItem>
			<StyledSubmitButton
				id="run"
				type="primary"
				justified="true"
				disabled={viewModel.disableRun}
				onClick={onRun}
			>
				Run on selected record
			</StyledSubmitButton>
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
					Run & save in selected record
				</StyledSubmitButton>
			</StyledFormItem>
		</Form>
	);
});

export default FormulaForm;
