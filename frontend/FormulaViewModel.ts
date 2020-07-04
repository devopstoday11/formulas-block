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
	configure,
	observable,
	action,
	computed,
	decorate,
	toJS,
	autorun,
	IReactionDisposer,
	flow,
} from "mobx";

// configure({ enforceActions: "observed" });

import { base, cursor, globalConfig } from "@airtable/blocks";
import {
	Table,
	View,
	Field,
	FieldType,
	Record,
	ViewType,
} from "@airtable/blocks/models";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";

export enum SaveStatus {
	// We use antd form validationStatus warning, since it has a more appropriate color
	success = "warning",
	error = "error",
}

export enum CalculateInViewStatus {
	none = "none",
	loadingRecords = "loadingRecords",
	calculating = "calculating",
	saving = "saving",
	done = "done",
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
	view: {
		id: string;
		name: string;
	} | null;
	field: { id: string; name: string } | null;
	formula: string;
}

export class FormulaViewModel {
	activeTableId: string;
	activeViewId: string;
	_table: Table | null;
	_view: View | null;
	field: Field | null;
	_selectedRecord: Record | null;
	supportedFormulas: Array<string>;
	_formula: string;
	formulaTextArea: HTMLTextAreaElement;
	runResult: any;
	runResultFormValue: string;
	runError: Error;
	recordSaver: IPromiseBasedObservable<void> | null;
	recordSaveError: Error | null;
	calculateInViewError: Error | null;
	configSaver: IReactionDisposer;
	calculateInViewStatus: CalculateInViewStatus;
	recordsToUpdateCount: number;
	updatedRecords: number;

	constructor() {
		log.debug("FormulaViewModel.constructor");
		this.activeTableId = cursor.activeTableId;
		this.activeViewId = cursor.activeViewId;
		this._table = null;
		this._view = null;
		this.field = null;
		this.selectedRecord = null;
		this.supportedFormulas = SupportedFormulas;
		this._formula = "";
		this.runResultFormValue = null;
		this.runError = null;
		this.recordSaver = null;
		this.recordSaveError = null;
		this.calculateInViewStatus = CalculateInViewStatus.none;
		this.calculateInViewError = null;
		this.recordsToUpdateCount = 0;
		this.updatedRecords = 0;

		const json = globalConfig.get("config") as FormulaModel;
		this.fromJSON(json);

		cursor.watch(["activeTableId"], this.onActiveTableIdChange);
		cursor.watch(["activeViewId"], this.onActiveViewIdChange);

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
				if (json.view) {
					const view = table.getViewByIdIfExists(json.view.id);
					if (view) {
						this.view = view;
					}
				}
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
				this._table || this.view || this.field
					? {
							id: toJS(this.table.id),
							name: toJS(this.table.name),
					  }
					: null,
			view: this.view
				? {
						id: toJS(this.view.id),
						name: toJS(this.view.name),
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

	onActiveViewIdChange(): void {
		log.debug("FormulaViewModel.onActiveViewIdChange");
		this.activeViewId = cursor.activeViewId;
	}

	get table(): Table {
		log.debug("FormulaViewModel.table get");
		if (this._table) {
			return this._table;
		}
		if (this.activeTableId) {
			const table = base.getTableById(this.activeTableId);
			log.debug("FormulaViewModel.table get, activeTable:", table.name);
			return table;
		}
		return null;
	}

	set table(table: Table) {
		this._table = table;
		this._view = null;
		this.field = null;
	}

	get tableId(): string | null {
		log.debug("FormulaViewModel.tableId get");
		if (this.table) {
			return this.table.id;
		}
		return null;
	}

	get view(): View {
		log.debug("FormulaViewModel.view get");
		if (this._view) {
			return this._view;
		}
		if (this.table && this.activeViewId) {
			const view = this.table.getViewByIdIfExists(this.activeViewId);
			if (view) return view;
		}
		return null;
	}

	set view(view: View) {
		this._view = view;
	}

	get validViews(): View[] {
		if (!this.table) {
			return [];
		}
		return this.table.views.filter((view) => view.type != ViewType.FORM);
	}

	get viewId(): string | null {
		log.debug("FormulaViewModel.viewId get");
		if (this.view) {
			return this.view.id;
		}
		return null;
	}

	set viewId(viewId: string) {
		this.view = this.table.getViewById(viewId);
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
		this.recordSaver = null;
		this.recordSaveError = null;
		this.calculateInViewStatus = CalculateInViewStatus.none;
		this.calculateInViewError = null;
		this.updatedRecords = 0;
		this.recordsToUpdateCount = 0;
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

	get disableCalculateInView(): boolean {
		return !this.table || !this.view || !this.field || this.formula.length == 0;
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

	// TODO: Once testing is added, split into testable functions
	calculateInView = flow(function* () {
		expect(this.table).to.not.be.null;
		expect(this.view).to.not.be.null;
		try {
			this._view = this.view;

			this.calculateInViewStatus = CalculateInViewStatus.loadingRecords;
			const queryResult = yield this._view.selectRecordsAsync();

			this.calculateInViewStatus = CalculateInViewStatus.calculating;

			const recordsToUpdate = [];
			for (const record of queryResult.records) {
				const values = {};
				for (const field of this.table.fields) {
					const value = record.getCellValue(field);
					values[field.name] = value;
				}
				const result = run(this._formula, values);
				recordsToUpdate.push({
					id: record.id,
					fields: { [toJS(this.field.name)]: result },
				});
			}

			this.calculateInViewStatus = CalculateInViewStatus.saving;

			const BATCH_SIZE = 50;

			this.recordsToUpdateCount = recordsToUpdate.length;
			this.updatedRecords = 0;
			while (this.updatedRecords < recordsToUpdate.length) {
				const recordsBatch = recordsToUpdate.slice(
					this.updatedRecords,
					this.updatedRecords + BATCH_SIZE
				);
				yield this.table.updateRecordsAsync(recordsBatch);
				this.updatedRecords += BATCH_SIZE;
			}

			this.calculateInViewStatus = CalculateInViewStatus.done;
		} catch (error) {
			log.error("FormulaViewModel.calculateInView, error:", error);
			this.viewCalculationError = error;
		} finally {
			this.calculateInViewStatus = CalculateInViewStatus.done;
		}
	});

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

		this.recordSaver = fromPromise(
			this._table.updateRecordAsync(this.selectedRecord, fields)
		);
		this.recordSaver.then(
			() => {
				log.debug("FormulaViewModel.onSaveSuccess");
			},
			(rejectReason: any) => {
				log.error("FormulaViewModel.onSaveError, error:", rejectReason);
				this.recordSaveError = rejectReason;
			}
		);
		return this.recordSaver;
	}

	get isSaving(): boolean {
		const value: boolean =
			this.recordSaver != null && this.recordSaver.state == "pending";
		log.debug("FormulaViewModel.isSaving:", value);
		return value;
	}

	get saveStatus(): string | null {
		if (!this.recordSaver) {
			return null;
		}
		switch (this.recordSaver.state) {
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
				if (this.recordSaveError) return this.recordSaveError.message;
				return null;
		}
	}

	get isCalculatingInView(): boolean {
		return (
			this.calculateInViewStatus != CalculateInViewStatus.none &&
			this.calculateInViewStatus != CalculateInViewStatus.done
		);
	}

	get calculateInViewButtonStatus(): string | null {
		switch (this.calculateInViewStatus) {
			case CalculateInViewStatus.none:
				return null;
			case CalculateInViewStatus.loadingRecords:
			case CalculateInViewStatus.calculating:
			case CalculateInViewStatus.saving:
				return "validating";

			case CalculateInViewStatus.done:
				if (this.calculateInViewError) {
					return "error";
				}
				return "success";
		}
	}

	get calculateInViewButtonStatusMessage(): string | null {
		switch (this.calculateInViewStatus) {
			case CalculateInViewStatus.none:
				return null;
			case CalculateInViewStatus.loadingRecords:
				return "Loading view records...";
			case CalculateInViewStatus.calculating:
				return "Calculating...";
			case CalculateInViewStatus.saving:
				return `Updated ${this.updatedRecords} / ${this.recordsToUpdateCount} records in view`;

			case CalculateInViewStatus.done:
				if (this.calculateInViewError) {
					return this.calculateInViewError.message;
				}
				return `Successfully updated ${this.recordsToUpdateCount} records in view`;
		}
	}

	get calculateInViewProgressPercent(): number {
		if (this.updatedRecords >= this.recordsToUpdateCount) {
			return 100;
		}
		return (this.updatedRecords / this.recordsToUpdateCount) * 100;
	}

	get calculateInViewProgressStatus(): "active" | "success" {
		if (this.calculateInViewProgressPercent < 100) {
			return "active";
		}
		return "success";
	}
}

decorate(FormulaViewModel, {
	toJSON: computed,
	activeTableId: observable,
	activeViewId: observable,
	onActiveTableIdChange: action.bound,
	onActiveViewIdChange: action.bound,
	_table: observable,
	_view: observable,
	field: observable,
	table: computed,
	tableId: computed,
	view: computed,
	viewId: computed,
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
	recordSaver: observable,
	recordSaveError: observable,
	isSaving: computed,
	saveStatus: computed,
	saveStatusMessage: computed,
	calculateInViewError: observable,
	disableCalculateInView: computed,
	calculateInViewStatus: observable,
	isCalculatingInView: computed,
	calculateInViewButtonStatus: computed,
	calculateInViewButtonStatusMessage: computed,
	recordsToUpdateCount: observable,
	updatedRecords: observable,
	calculateInViewProgressPercent: computed,
	calculateInViewProgressStatus: computed,
	// calculateInView: action,
});

const viewModel = new FormulaViewModel();

export default viewModel;
