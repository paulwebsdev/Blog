import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Answers to common questions about PaulNova, its coverage, contributions and contact." };
export default function FAQPage() { return <InfoPage eyebrow="Helpful answers" title="Frequently asked questions" intro="A few quick answers about PaulNova and what you can expect from the publication." sections={[
{heading:"What is PaulNova?",paragraphs:["PaulNova is a global publication focused on technology, artificial intelligence, business and money, and education and careers. Our aim is to make useful ideas and opportunities easier to understand."]},
{heading:"Who can read PaulNova?",paragraphs:["Everyone. Our coverage is intended for a global audience, including students, professionals, entrepreneurs, creators and curious readers."]},
{heading:"Can I suggest a topic or report an error?",paragraphs:["Yes. Send the article link or topic idea, explain the context and include any useful sources. Email contact.paulnova@gmail.com."]},
{heading:"Can I contribute an article?",paragraphs:["We welcome relevant pitches and expert perspectives, but sending a pitch does not guarantee publication. Include a short introduction, proposed topic, outline and links to previous work if available."]},
{heading:"Can my organisation partner with PaulNova?",paragraphs:["We are open to relevant partnership conversations. Please see our Partnerships & Advertising page and email us with details. Any sponsored content must be clearly labelled."]},
{heading:"Does PaulNova provide professional advice?",paragraphs:["No. Our content is general information and education, not personalised financial, legal, medical or other professional advice. Make important decisions using qualified advice appropriate to your circumstances."]},
{heading:"How do I contact the team?",paragraphs:["Email contact.paulnova@gmail.com or use the Contact page."]}
]}/> }