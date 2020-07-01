import loglevel from "loglevel";
const log = loglevel.getLogger("FormulaViewModel");
log.setLevel("debug");
log.debug("FormulaViewModel");

import chai from "chai";
const { expect } = chai;

import { SUPPORTED_FORMULAS, Parser } from "hot-formula-parser";

import { observable, action, computed, decorate, toJS } from "mobx";

import Table from "@airtable/blocks/dist/types/src/models/table";
import { base, cursor, globalConfig } from "@airtable/blocks";
import { Field, FieldType, Record } from "@airtable/blocks/models";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";

export enum SubmitStatus {
	// We use antd form validationStatus warning, since it has a more appropiate color
	success = "warning",
	error = "error",
}

export interface Choice {
	name: string;
}

export interface Option extends Choice {
	value: string;
}

export interface ParseResult {
	result: any;
	error: any;
}

export class FormulaViewModel {
	activeTableId: string;
	_table: Table | null;
	supportedFormulas: Array<string>;
	formula: string;
	parseResult: ParseResult | null;
	creator: IPromiseBasedObservable<Field> | null;
	createError: Error | null;

	constructor() {
		log.debug("FormulaViewModel.constructor");
		this.activeTableId = cursor.activeTableId;
		this._table = null;
		this.supportedFormulas = [];
		this.formula = "";
		this.parseResult = null;
		this.creator = null;
		this.createError = null;

		cursor.watch(["activeTableId"], this.onActiveTableIdChange);

		this.initSupportedFormulas();
	}

	// Generate unique array of supported formulas since SUPPORTED_FORMULAS has duplicates
	initSupportedFormulas() {
		const formulasSet: Set<string> = new Set();

		for (const formula of SUPPORTED_FORMULAS) {
			formulasSet.add(formula);
		}

		for (const formula of formulasSet) {
			this.supportedFormulas.push(formula);
		}
	}

	onActiveTableIdChange(): void {
		log.debug("FormulaViewModel.onActiveTableIdChange");
		this.activeTableId = cursor.activeTableId;
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
	}

	get tableId(): string | null {
		log.debug("FormulaViewModel.tableId get");
		if (this.table) {
			return this.table.id;
		}
		return null;
	}

	get availableFields(): Field[] {
		if (!this.table) {
			return [];
		}
		return this.table.fields;
	}

	preview(record: Record): ParseResult {
		const parser = new Parser();

		for (const field of this.availableFields) {
			const value = record.getCellValue(field);
			log.debug(
				"preview, field name:",
				field.name,
				"typeof value:",
				typeof value,
				"value:",
				value
			);
			parser.setVariable(field.name, value);

			const variable = parser.getVariable(field.name);
			log.debug(
				"parser.getVariable, name:",
				field.name,
				"typeof variable:",
				typeof variable,
				"variable:",
				variable
			);
		}

		this.parseResult = parser.parse(this.formula);

		return this.parseResult;
	}

	// create(values): IPromiseBasedObservable<Field> {
	// 	const name = toJS(this.name);
	// 	const type = toJS(this.type);
	// 	const choices = this.options.map((choice) => {
	// 		return { name: choice.name };
	// 	});
	// 	const options = { choices: choices };
	// 	log.debug(
	// 		"FormulaViewModel.create, name: ",
	// 		name,
	// 		", type:",
	// 		type,
	// 		", options: ",
	// 		options
	// 	);
	// 	this._table = this.table;
	// 	this.creator = fromPromise(
	// 		this._table.unstable_createFieldAsync(name, type, options)
	// 	);
	// 	this.creator.then(
	// 		() => {},
	// 		(rejectReason: any) => {
	// 			log.error("FormulaViewModel.onCreateError, error:", rejectReason);
	// 			this.createError = rejectReason;
	// 		}
	// 	);
	// 	return this.creator;
	// }

	// get isCreating(): boolean {
	// 	const value: boolean =
	// 		this.creator != null && this.creator.state == "pending";
	// 	log.debug("FormulaViewModel.isCreating:", value);
	// 	return value;
	// }

	// get submitStatus(): SubmitStatus {
	// 	if (!this.creator) {
	// 		return null;
	// 	}
	// 	switch (this.creator.state) {
	// 		case "fulfilled":
	// 			return SubmitStatus.success;
	// 		case "rejected":
	// 			return SubmitStatus.error;
	// 	}
	// 	return null;
	// }

	// get submitStatusMessage(): string | null {
	// 	if (!this.submitStatus) {
	// 		return null;
	// 	}
	// 	switch (this.submitStatus) {
	// 		case SubmitStatus.success:
	// 			return `Successfully created the ${this.name} field in the ${this._table.name} table`;
	// 		case SubmitStatus.error:
	// 			return `Something went wrong. Please try again. If the problem persists, please contact support@superblocks.at`;
	// 	}
	// }

	// Reset so that we don't see the submit status message
	// onValuesChange(changedValues, allValues): void {
	// 	if (this.submitStatus != null) {
	// 		this.creator = null;
	// 		this.createError = null;
	// 	}
	// }

	// reset(): void {
	// 	this._table = null;
	// 	this.creator = null;
	// 	this.createError = null;
	// }
}

decorate(FormulaViewModel, {
	activeTableId: observable,
	_table: observable,
	table: computed,
	tableId: computed,
	availableFields: computed,
	formula: observable,
	preview: action,
	parseResult: observable,
	// options: computed,
	// isCreating: computed,
	// creator: observable,
	// createError: observable,
	// submitStatus: computed,
	// submitStatusMessage: computed,
	// onValuesChange: action,
	onActiveTableIdChange: action.bound,
	// formValues: computed,
	// reset: action,
});

const viewModel = new FormulaViewModel();

export default viewModel;
