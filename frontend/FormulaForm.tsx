import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaForm");
log.setLevel("debug");

import React from "react";

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";

import { Form, Input } from "antd";

import { base, cursor } from "@airtable/blocks";
import { useLoadable, useWatchable, useRecordById } from "@airtable/blocks/ui";

import TableSelector from "./TableSelector";
import FieldsDropdown from "./FieldsDropdown";
import FormulaDropdown from "./FormulaDropdown";
import FormulaEditor from "./FormulaEditor";
import { StyledSubmitButton, StyledFormItem } from "./StyledComponents";
import viewModel from "./FormulaViewModel";

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

	const onPreview = () => {
		log.debug("FormulaForm.preview");
		const result = viewModel.preview(record);
		log.debug("result:", toJS(result));
	};

	const parseResult = viewModel.parseResult;
	let previewValue = null;
	if (parseResult != null) {
		previewValue =
			parseResult.error != null ? parseResult.error : parseResult.result;
	}

	return (
		<Form layout="vertical">
			<TableSelector />
			<FieldsDropdown />
			<FormulaDropdown />
			<FormulaEditor />
			<StyledFormItem>
				<Input
					placeholder="Result on selected record"
					value={previewValue}
					disabled={true}
					style={{ width: "100%" }}
				/>
			</StyledFormItem>
			<StyledSubmitButton
				id="submit"
				type="primary"
				// htmlType="submit"
				// loading={field.isCreating}
				// justified="true"
				disabled={record == null ? true : undefined}
				onClick={onPreview}
			>
				Preview on selected record
			</StyledSubmitButton>
		</Form>
	);
});

export default FormulaForm;
