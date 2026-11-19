import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
export const metadata:Metadata={title:"Corrections & Updates",description:"How to report an error or request a correction to PaulNova editorial content."};
export default function CorrectionsPage(){return <InfoPage eyebrow="Editorial accountability" title="Corrections & updates" intro="Accuracy matters. If you spot a factual error, broken source, missing context or information that has become outdated, please tell us so we can review it." sections={[
{heading:"How to report an issue",paragraphs:["Email contact.paulnova@gmail.com with the article URL, the sentence or claim you are concerned about, and a reliable source or explanation that helps us assess it. Please include “Correction request” in the subject line."]},
{heading:"How we review reports",paragraphs:["We review correction requests in context and check the evidence available. A report does not automatically mean an article is wrong; we assess the underlying claim before making a change."]},
{heading:"How changes are shown",paragraphs:["When a material correction or clarification is made, we aim to add a visible correction or update note to the article. Minor spelling or formatting fixes may be made without a separate notice."]},
{heading:"Editorial independence",paragraphs:["Correction decisions are made on accuracy and reader clarity, not on commercial pressure. We do not promise a particular outcome or response time, but we welcome good-faith reports."]}
]}/>}