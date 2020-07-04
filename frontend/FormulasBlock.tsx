import React from "react";
import { Layout } from "antd";
import ErrorBoundary from "./ErrorBoundary";
import BlockHeader from "./BlockHeader";
import BlockFooter from "./BlockFooter";
import {
	StyledFormContent,
	StyledFormLayout,
	StyledContent,
} from "./StyledComponents";
import FormulaForm from "./FormulaForm";

export default function FormulasBlock() {
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
				<BlockHeader />
				<StyledFormLayout>
					<StyledFormContent>
						<FormulaForm />
					</StyledFormContent>
				</StyledFormLayout>
				<BlockFooter />
			</Layout>
		</ErrorBoundary>
	);
}
