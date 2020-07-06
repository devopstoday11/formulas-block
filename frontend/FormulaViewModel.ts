import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaViewModel");
log.setLevel("debug");
log.debug("FormulaViewModel");

import chai from "chai";
const { expect } = chai;

import { run /*, min, max*/ } from "@superblocks-at/formula";

import {
	// configure,
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

import { fromPromise, IPromiseBasedObservable } from "mobx-utils";

import { base, cursor, globalConfig } from "@airtable/blocks";
import {
	Table,
	View,
	Field,
	FieldType,
	Record,
	ViewType,
} from "@airtable/blocks/models";
import { loadScriptFromURLAsync } from "@airtable/blocks/ui";

import SupportedFunctions from "./SupportedFunctions";

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
	functionScripts: string[];
}

export class FormulaViewModel {
	activeTableId: string;
	activeViewId: string;
	_table: Table | null;
	_view: View | null;
	field: Field | null;
	_selectedRecord: Record | null;
	_supportedFunctions: Set<string>;
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
	addedFunctions: { [name: string]: Function };
	scriptURL: string;
	functionScripts: string[];
	rerenderFunctionScripts: number;
	loadingScripts: boolean;
	showReloadBlockModal: boolean;

	constructor() {
		log.debug("FormulaViewModel.constructor");
		this.activeTableId = cursor.activeTableId;
		this.activeViewId = cursor.activeViewId;
		this._table = null;
		this._view = null;
		this.field = null;
		this.selectedRecord = null;
		this._supportedFunctions = new Set();
		this._formula = "";
		this.runResultFormValue = null;
		this.runError = null;
		this.recordSaver = null;
		this.recordSaveError = null;
		this.calculateInViewStatus = CalculateInViewStatus.none;
		this.calculateInViewError = null;
		this.recordsToUpdateCount = 0;
		this.updatedRecords = 0;
		this.addedFunctions = {};
		this.scriptURL = "";
		this.functionScripts = [];
		this.rerenderFunctionScripts = 0;
		this.loadingScripts = false;
		this.showReloadBlockModal = false;

		const json = globalConfig.get("config") as FormulaModel;
		this.fromJSON(json);

		this.initSupportedFunctions();

		cursor.watch(["activeTableId"], this.onActiveTableIdChange);
		cursor.watch(["activeViewId"], this.onActiveViewIdChange);

		// this.addFunctions({ mymin: min, mymax: max });

		// @ts-ignore
		if (!window.superblocks) {
			// @ts-ignore
			window.superblocks = {};
		}
		// @ts-ignore
		if (!window.superblocks.formulas) {
			// @ts-ignore
			window.superblocks.formulas = {};
		}
		// @ts-ignore
		window.superblocks.formulas.addFunctions = this.addFunctions.bind(this);

		if (this.functionScripts.length > 0) {
			this.loadScripts();
		}

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

	initSupportedFunctions(): void {
		log.debug("FormulaViewModel.initSupportedFunctions");
		SupportedFunctions.forEach((func) => this._supportedFunctions.add(func));
	}

	addFunctions(funcs: { [name: string]: Function }): void {
		log.debug("FormulaViewModel.addFunctions");
		for (const funcName in funcs) {
			log.debug("FormulaViewModel.addFunctions, adding", funcName);
			const func = funcs[funcName];
			expect(func).to.be.a("function");
			this.addedFunctions[funcName.toUpperCase()] = funcs[funcName];
			this.addedFunctions[funcName.toLowerCase()] = funcs[funcName];
			this._supportedFunctions.add(funcName.toUpperCase());
		}
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

		if (json.formula) this.formula = json.formula;
		if (json.functionScripts) this.functionScripts = json.functionScripts;

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
			functionScripts: toJS(this.functionScripts),
		};
	}

	compareStrings(a: string, b: string): number {
		return a.localeCompare(b);
	}

	// Generate unique array of supported formulas since SupportedFormulas has duplicates
	get supportedFunctions(): Array<string> {
		const funcs = [];
		for (const func of this._supportedFunctions) {
			funcs.push(func);
		}
		funcs.sort(this.compareStrings);
		return funcs;
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

	// don't return selected record if it's a selected record of another table
	get selectedRecord() {
		log.debug("FormulaViewModel.get selectedRecord");
		const _table = toJS(this._table);
		const activeTableId = toJS(this.activeTableId);
		if (!_table || (activeTableId && activeTableId == _table.id)) {
			return this._selectedRecord;
		}
		return null;
	}

	set selectedRecord(value) {
		log.debug("FormulaViewModel.set selectedRecord");
		if (toJS(this._selectedRecord) != value) {
			log.debug("FormulaViewModel.set selectedRecord, changed");
			this._selectedRecord = value;
			this.resetResult();
		}
	}

	get selectedRecordValidationProps(): {
		validateStatus?: "warning";
		help?: string;
	} {
		if (
			this._selectedRecord &&
			this._table &&
			this._table.id != this.activeTableId
		) {
			return {
				validateStatus: "warning",
				help: `The selected record is not in the ${this._table.name} table`,
			};
		}

		return {};
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

		let fieldNameToInsert = fieldName;
		if (fieldName.indexOf(" ") >= 0) {
			fieldNameToInsert = `{${fieldName}}`;
		}

		this.formulaTextArea.setRangeText(fieldNameToInsert);
		this.formulaTextArea.selectionStart += fieldNameToInsert.length;
		this.formula = this.formulaTextArea.value;
		this.formulaTextArea.focus();
	}

	insertFunction(func: string) {
		expect(this.formulaTextArea).to.be.not.null;

		this.formulaTextArea.setRangeText(func);
		this.formulaTextArea.selectionStart += func.length;
		this.formula = this.formulaTextArea.value;
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
		this.resetResult();

		const formula = this.prepareFormulaForRun();
		const values = this.prepareFieldsForRun(record);

		try {
			this.runResult = run(formula, values, this.addedFunctions);
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

	// Replace field names with spaces surrounded by {} with field ids
	prepareFormulaForRun(): string {
		let formula = this._formula;
		for (const field of this.table.fields) {
			if (field.name.indexOf(" ") >= 0) {
				const regex = new RegExp(`{${field.name}}`, "g");
				formula = formula.replace(regex, field.id);
			}
		}

		log.debug("FormulaViewModel.prepareFormula, formula:", formula);

		return formula;
	}

	// Replace field names with spaces with field ids in object map of values
	prepareFieldsForRun(record: Record): { [key: string]: any } {
		let values = {};
		for (const field of this.table.fields) {
			if (field.name.indexOf(" ") >= 0) {
				values[field.id] = record.getCellValue(field.id);
			} else {
				values[field.name] = record.getCellValue(field.id);
			}
		}

		log.debug("FormulaViewModel.prepareFieldsForRun, values:", values);

		return values;
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
		this.resetResult();
		expect(this.table).to.not.be.null;
		expect(this.view).to.not.be.null;
		try {
			this._view = this.view;
			const formula = this.prepareFormulaForRun();

			this.calculateInViewStatus = CalculateInViewStatus.loadingRecords;
			const queryResult = yield this._view.selectRecordsAsync();

			this.calculateInViewStatus = CalculateInViewStatus.calculating;

			const recordsToUpdate = [];
			for (const record of queryResult.records) {
				const values = this.prepareFieldsForRun(record);
				const result = run(formula, values, this.extraFuncs);
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

	get scriptURLAlreadyExists(): boolean {
		return (
			this.functionScripts.findIndex((script) => script == this.scriptURL) >= 0
		);
	}

	get scriptURLValidationProps(): {
		validateStatus?: "error";
		help?: string;
	} {
		if (this.scriptURLAlreadyExists) {
			return {
				validateStatus: "error",
				help: "This script already exists",
			};
		}

		return {};
	}

	get disableAddScriptButton(): boolean {
		return this.scriptURL.length == 0 || this.scriptURLAlreadyExists;
	}

	addScript = flow(function* () {
		this.loadingScripts = true;
		try {
			yield loadScriptFromURLAsync(this.scriptURL);
			this.functionScripts.push(this.scriptURL);
			this.rerenderFunctionScripts++;
			this.scriptURL = "";
		} catch (e) {
			log.error("FormulaViewModel.addScript, error:", e);
			this.loadingScriptsError = e;
		} finally {
			this.loadingScripts = false;
		}
	});

	loadScripts = flow(function* () {
		log.debug("FormulaViewModel.loadScripts");
		this.loadingScripts = true;
		try {
			for (const script of this.functionScripts) {
				yield loadScriptFromURLAsync(script);
			}
		} catch (e) {
			log.error("FormulaViewModel.loadScripts, error:", e);
			this.loadingScriptsError = e;
		} finally {
			this.loadingScripts = false;
		}
	});

	removeScript(script: string): void {
		log.debug("FormulaViewModel.removeScript, script:", script);
		const i = this.functionScripts.findIndex((item) => item == script);
		expect(i).to.not.equal(-1);
		this.functionScripts.splice(i, 1);
		this.rerenderFunctionScripts++;
		this.showReloadBlockModal = true;
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
	_supportedFunctions: observable,
	supportedFunctions: computed,
	resetResult: action,
	formulaTextArea: observable,
	insertFunction: action,
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
	scriptURL: observable,
	scriptURLAlreadyExists: computed,
	scriptURLValidationProps: computed,
	disableAddScriptButton: computed,
	functionScripts: observable,
	rerenderFunctionScripts: observable,
	loadingScripts: observable,
	removeScript: action,
	showReloadBlockModal: observable,
});

const viewModel = new FormulaViewModel();

export default viewModel;

// PMT(InterestRate/12,NumberOfPayments,LoanAmount)
// RATE(NumberOfPayments,MonthlyPayment,LoanAmount) * 12
