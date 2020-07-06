import loglevel from "loglevel";
const log = loglevel.getLogger("BlockViewModel");
log.setLevel("debug");

import { observable, decorate, computed, action } from "mobx";

export enum MainView {
	editFormula = "editFormula",
	addFunctions = "addFunctions",
}

export class BlockViewModel {
	activeView: MainView;

	constructor() {
		log.debug("BlockViewModel.constructor");
		this.activeView = MainView.editFormula;
	}

	get switchViewButtonLabel(): string {
		log.debug(
			"BlockViewModel.switchViewButtonLabel, activeView:",
			this.activeView
		);
		if (this.activeView == MainView.editFormula) {
			return "Add functions";
		} else {
			return "Edit formula";
		}
	}

	switchView(): void {
		log.debug("BlockViewModel.switchView, activeView:", this.activeView);
		if (this.activeView == MainView.editFormula) {
			this.activeView = MainView.addFunctions;
		} else {
			this.activeView = MainView.editFormula;
		}
	}
}

decorate(BlockViewModel, {
	activeView: observable,
	switchViewButtonLabel: computed,
	switchView: action.bound,
});

const blockViewModel = new BlockViewModel();

export default blockViewModel;
