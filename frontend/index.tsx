import React from "react";
import { initializeBlock, loadCSSFromURLAsync } from "@airtable/blocks/ui";
import FormulasBlock from "./FormulasBlock";
import { globalConfig } from "@airtable/blocks";

// import { run, min, max } from "formula";
// import * as formula from "formula";

// window.formula = formula;
// window.formula.MYMIN = max;
// window.formula.mymin = max;

// globalConfig.setAsync("config", undefined).then(() => {
loadCSSFromURLAsync(
	"https://cdnjs.cloudflare.com/ajax/libs/antd/4.4.0/antd.min.css"
).then(() =>
	initializeBlock(() => (
		// <SuperblockWrapper>
		<FormulasBlock />
		// </SuperblockWrapper>
	))
);
// });
