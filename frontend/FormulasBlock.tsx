import loglevel from "loglevel";
const log = loglevel.getLogger("FormulasBlock");
log.setLevel("debug");

import React from "react";
import { observer } from "mobx-react-lite";
import { Layout, Button } from "antd";
import ErrorBoundary from "./ErrorBoundary";
import BlockHeader from "./BlockHeader";
import BlockFooter from "./BlockFooter";
import {
	StyledFormContent,
	StyledFormLayout,
	StyledContent,
} from "./StyledComponents";
import blockViewModel, { MainView } from "./BlockViewModel";
import FormulaForm from "./FormulaForm";
import AddFunctions from "./AddFunctions";
import NewVersionIndicator from "./NewVersionIndicator";

const FormulasBlock = observer(() => {
	const showEditFormulaView = blockViewModel.activeView == MainView.editFormula;
	log.debug("FormulasBlock.render, showEditFormulaView:", showEditFormulaView);

	return (
		<ErrorBoundary>
			<Layout
				style={{
					position: "fixed",
					top: "34px",
					bottom: "26px",
					left: 0,
					right: 0,
					paddingTop: 0,
					paddingBottom: 0,
				}}
			>
				<BlockHeader title="Formulas">
					<div>
						<Button type="link" onClick={blockViewModel.switchView}>
							{blockViewModel.switchViewButtonLabel}
						</Button>
						<NewVersionIndicator />
					</div>
				</BlockHeader>
				<StyledFormLayout>
					<StyledFormContent>
						{showEditFormulaView ? <FormulaForm /> : <AddFunctions />}
					</StyledFormContent>
				</StyledFormLayout>
				<BlockFooter />
			</Layout>
		</ErrorBoundary>
	);
});

export default FormulasBlock;
