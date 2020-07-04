import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaViewModel");
log.setLevel("debug");
log.debug("FormulaViewModel");

import chai from "chai";
const { expect } = chai;

// import { SupportedFormulas, Parser } from "hot-formula-parser";
import SupportedFormulas from "./SupportedFormulas";
import { run } from "formula";

import {
	observable,
	action,
	computed,
	decorate,
	toJS,
	autorun,
	IReactionDisposer,
} from "mobx";

import { base, cursor, globalConfig } from "@airtable/blocks";
import { Table, Field, FieldType, Record } from "@airtable/blocks/models";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";

export enum SaveStatus {
	// We use antd form validationStatus warning, since it has a more appropriate color
	success = "warning",
	error = "error",
}

export interface Choice {
	name: string;
}

export interface Option extends Choice {
	value: string;
}

// export interface ParseResult {
// 	result: any;
// 	error: any;
// }

interface FormulaModel {
	table: {
		id: string;
		name: string;
	} | null;
	field: { id: string; name: string } | null;
	formula: string;
}

export class FormulaViewModel {
	activeTableId: string;
	_table: Table | null;
	field: Field | null;
	_selectedRecord: Record | null;
	supportedFormulas: Array<string>;
	_formula: string;
	formulaTextArea: HTMLTextAreaElement;
	runResult: any;
	runResultFormValue: string;
	runError: Error;
	saver: IPromiseBasedObservable<void> | null;
	saveError: Error | null;
	configSaver: IReactionDisposer;

	constructor() {
		log.debug("FormulaViewModel.constructor");
		this.activeTableId = cursor.activeTableId;
		this._table = null;
		this.field = null;
		this.selectedRecord = null;
		this.supportedFormulas = SupportedFormulas;
		this._formula = "";
		this.runResultFormValue = null;
		this.runError = null;
		this.saver = null;
		this.saveError = null;

		const json = globalConfig.get("config") as FormulaModel;
		this.fromJSON(json);

		cursor.watch(["activeTableId"], this.onActiveTableIdChange);

		this.configSaver = autorun(
			() => {
				const json = this.toJSON;
				log.debug("FormulaViewModel.configSaver, toJSON:", json);
				try {
					globalConfig.setAsync("config", json as any);
				} catch (e) {
					log.error("Error saving config to global config. Error:", e);
				}
			},
			{ name: "FormulaViewModel.configSaver" }
		);
	}

	// TODO Generate warnings if fields where deleted or changed and update server side model immediatelly
	// Same if table name was changed
	fromJSON(json: FormulaModel) {
		if (!json) {
			return;
		}
		if (json.table) {
			const table = base.getTableByIdIfExists(json.table.id);
			if (table) {
				this._table = table;
				if (json.field) {
					const field = table.getFieldByIdIfExists(json.field.id);
					if (field) {
						this.field = field;
					}
				}
			}
		}

		this.formula = json.formula;

		// alertsViewModel.addAlert(fieldJSON.id, {
		// 	type: AlertType.warning,
		// 	message: `The ${fieldJSON.name} field was deleted.`,
		// 	description: `The ${fieldJSON.name} field was deleted from the table and removed from the form.`,
		// 	closable: true,
		// });
	}

	get toJSON(): FormulaModel {
		return {
			table:
				this._table || this.field
					? {
							id: toJS(this.table.id),
							name: toJS(this.table.name),
					  }
					: null,
			field: this.field
				? {
						id: toJS(this.field.id),
						name: toJS(this.field.name),
				  }
				: null,
			formula: toJS(this.formula),
		};
	}

	// Generate unique array of supported formulas since SupportedFormulas has duplicates
	initSupportedFormulas() {
		const formulasSet: Set<string> = new Set();

		for (const formula of SupportedFormulas) {
			formulasSet.add(formula);
		}

		for (const formula of formulasSet) {
			this.supportedFormulas.push(formula);
		}
	}

	onActiveTableIdChange(): void {
		log.debug("FormulaViewModel.onActiveTableIdChange");
		this.activeTableId = cursor.activeTableId;
		if (!this._table) {
			this.field = null;
		}
	}

	get table(): Table {
		log.debug("FormulaViewModel.table get");
		if (this._table) {
			return this._table;
		}
		if (this.activeTableId) {
			const table = base.getTableById(cursor.activeTableId);
			log.debug("FormulaViewModel.table get, activeTable:", table.name);
			return table;
		}
		return null;
	}

	set table(table: Table) {
		this._table = table;
		this.field = null;
	}

	get tableId(): string | null {
		log.debug("FormulaViewModel.tableId get");
		if (this.table) {
			return this.table.id;
		}
		return null;
	}

	get nonComputedFields(): Field[] {
		if (!this.table) {
			return [];
		}
		return this.table.fields.filter((field) => !field.isComputed);
	}

	get fieldId(): string {
		if (this.field && !this.field.isDeleted) {
			return this.field.id;
		}
		return null;
	}

	set fieldId(fieldId: string) {
		this.field = this.table.getFieldById(fieldId);
	}

	get availableFields(): Field[] {
		if (!this.table) {
			return [];
		}
		return this.table.fields;
	}

	get selectedRecord() {
		return this._selectedRecord;
	}

	set selectedRecord(value) {
		// log.debug("FormulaViewModel.set selectedRecord");
		if (toJS(this._selectedRecord) != value) {
			log.debug("FormulaViewModel.set selectedRecord, changed");
			this._selectedRecord = value;
			this.resetResult();
		}
	}

	get formula(): string {
		return this._formula;
	}

	// As soon as formula is touched again, we reset preview result and run error message
	set formula(value: string) {
		// log.debug("FormulaViewModel.set formula");
		if (toJS(this._formula) != value) {
			log.debug("FormulaViewModel.set formula, changed");
			this._formula = value;
			this.resetResult();
		}
	}

	resetResult(): void {
		log.debug("FormulaViewModel.resetResult");

		this.runResult = null;
		this.runResultFormValue = null;
		this.runError = null;
		this.saver = null;
		this.saveError = null;
	}

	insertField(fieldName: string) {
		expect(this.formulaTextArea).to.be.not.null;

		this.formulaTextArea.setRangeText(fieldName);
		this.formulaTextArea.selectionStart += fieldName.length;
		this.formulaTextArea.focus();
	}

	insertFormula(formula: string) {
		expect(this.formulaTextArea).to.be.not.null;

		this.formulaTextArea.setRangeText(formula);
		this.formulaTextArea.selectionStart += formula.length;
		this.formulaTextArea.focus();
	}

	get disableRun(): boolean {
		return (
			this.selectedRecord == null ||
			this.formula == null ||
			this.formula.length == 0
		);
	}

	get disableRunAndSave(): boolean {
		return this.disableRun || !this.field;
	}

	run(record: Record): any {
		const values = {};

		for (const field of this.availableFields) {
			const value = record.getCellValue(field);
			values[field.name] = value;
		}

		try {
			this.runResult = run(this._formula, values);
			if (this.runResult != null) {
				this.runResultFormValue = this.runResult.toString();
			} else {
				this.runResultFormValue = "Calculation returned null";
			}
			return this.runResultFormValue;
		} catch (e) {
			this.runError = e;
			return null;
		}
	}

	runAndSave(record: Record): void {
		this.run(record);
		if (this.runError) {
			return;
		}
		this.save();
	}

	get formulaErrorStatus(): string | null {
		if (this.runError) {
			return "error";
		}
		return null;
	}

	get formulaError(): string | null {
		if (this.runError) {
			return this.runError.message;
		}
		return null;
	}

	save(): IPromiseBasedObservable<void> {
		expect(this.table).to.not.be.null;
		expect(this.field).to.not.be.null;
		expect(this.selectedRecord).to.not.be.null;

		const fields = {
			[toJS(this.field.name)]: toJS(this.runResult),
		};
		// const records = { id: toJS(this.selectedRecord.id) };
		this._table = this.table;

		log.debug("FormulaViewModel.save, fields:", fields);

		this.saver = fromPromise(
			this._table.updateRecordAsync(this.selectedRecord, fields)
		);
		this.saver.then(
			() => {
				log.debug("FormulaViewModel.onSaveSuccess");
			},
			(rejectReason: any) => {
				log.error("FormulaViewModel.onSaveError, error:", rejectReason);
				this.saveError = rejectReason;
			}
		);
		return this.saver;
	}

	get isSaving(): boolean {
		const value: boolean = this.saver != null && this.saver.state == "pending";
		log.debug("FormulaViewModel.isSaving:", value);
		return value;
	}

	get saveStatus(): string | null {
		if (!this.saver) {
			return null;
		}
		switch (this.saver.state) {
			case "fulfilled":
				return SaveStatus.success;
			case "rejected":
				return SaveStatus.error;
		}
		return null;
	}

	get saveStatusMessage(): string | null {
		if (!this.saveStatus) {
			return null;
		}
		switch (this.saveStatus) {
			case SaveStatus.success:
				return "Successfully saved result";
			case SaveStatus.error:
				if (this.saveError) return this.saveError.message;
				return null;
		}
	}
}

decorate(FormulaViewModel, {
	toJSON: computed,
	activeTableId: observable,
	_table: observable,
	field: observable,
	table: computed,
	tableId: computed,
	_selectedRecord: observable,
	selectedRecord: computed,
	availableFields: computed,
	_formula: observable,
	formula: computed,
	resetResult: action,
	formulaTextArea: observable,
	insertFormula: action,
	disableRun: computed,
	disableRunAndSave: computed,
	run: action,
	runAndSave: action,
	save: action,
	runResult: observable,
	runResultFormValue: observable,
	runError: observable,
	formulaError: computed,
	formulaErrorStatus: computed,
	// options: computed,
	saver: observable,
	saveError: observable,
	isSaving: computed,
	saveStatus: computed,
	saveStatusMessage: computed,
	// submitStatus: computed,
	// submitStatusMessage: computed,
	// onValuesChange: action,
	onActiveTableIdChange: action.bound,
	// formValues: computed,
	// reset: action,
});

const viewModel = new FormulaViewModel();

export default viewModel;
