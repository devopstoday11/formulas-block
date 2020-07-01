import React from "react";
import { initializeBlock, loadCSSFromURLAsync } from "@airtable/blocks/ui";
import FormulasBlock from "./FormulasBlock";

loadCSSFromURLAsync(
	"https://cdnjs.cloudflare.com/ajax/libs/antd/4.4.0/antd.min.css"
).then(() =>
	initializeBlock(() => (
		// <SuperblockWrapper>
		<FormulasBlock />
		// </SuperblockWrapper>
	))
);
