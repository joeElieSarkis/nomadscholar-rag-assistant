# RAG Improvement Cases

Test date: 2 June 2026

This file documents five cases showing how retrieval improved NomadScholar AI's answers. For comparison, the "without retrieval" answers were generated with the same Gemini model using a prompt that asked it to answer without using the project knowledge base or uploaded context. The "with retrieval" answers were tested through NomadScholar AI.

## Summary Table

| Case | Question | Sources retrieved by NomadScholar AI | Retrieval improvement |
| --- | --- | --- | --- |
| 1 | What documents do I need for a DAAD scholarship? | DAAD Applicant Information; DAAD Scholarships and Funding | Added DAAD-specific source grounding and stronger warning that every DAAD program has its own official announcement. |
| 2 | I want to apply for a master's in AI in France. What options should I explore? | Campus France Programs and Scholarships; Erasmus Mundus Joint Masters | Avoided confidently naming universities/programs and pointed the student to official Campus France search tools and keywords. |
| 3 | What should I prepare for Erasmus Mundus? | Erasmus Mundus Joint Masters; Common App First-Year Application Guide; Common App College Requirements | Shifted the answer from travel/logistics advice to application preparation and Erasmus Mundus program-specific requirements. |
| 4 | What should a Lebanese student do if they want advising for studying in the United States? | EducationUSA Lebanon Advising; Common App International Students; EducationUSA Financial Aid | Used Lebanon-specific EducationUSA/AMIDEAST advising context instead of only general U.S. study advice. |
| 5 | شو المستندات المطلوبة للتقديم على منحة؟ | DAAD Applicant Information; DAAD Scholarships and Funding; Erasmus Mundus Joint Masters | Kept the Arabic answer grounded in the same scholarship sources used for English answers. |

## Case 1: DAAD Scholarship Documents

**Question:** What documents do I need for a DAAD scholarship?

**Gemini without retrieval, observed answer summary:** Gemini gave a useful general list: online DAAD form, CV, motivation letter, transcripts/degrees, language proof, recommendations, admission letter, research proposal/project plan, and passport copy. It ended with a general reminder that requirements can vary slightly.

**NomadScholar AI with retrieval, observed answer summary:** NomadScholar retrieved DAAD Applicant Information and DAAD Scholarships and Funding. It listed common documents such as CV, academic certificates/transcripts, motivation letter, recommendation letters, language proof, admission documents, research proposal/study plan, portfolio/work samples, and passport information. It also emphasized that each DAAD scholarship has its own eligibility criteria, academic level, deadline, language requirements, funding period, required documents, submission method, and official announcement.

**How retrieval improved the answer:** The no-retrieval answer was helpful but broad. The RAG answer was safer because it tied the checklist to DAAD-specific guidance and more clearly warned the student not to treat one DAAD document list as universal.

## Case 2: Master's in AI in France

**Question:** I want to apply for a master's in AI in France. What options should I explore?

**Gemini without retrieval, observed answer summary:** Gemini named categories such as public universities and Grandes Ecoles and gave example places/schools, including Paris, Sorbonne Universite, Universite Paris-Saclay, CentraleSupelec, Ecole Polytechnique, Mines ParisTech, Telecom Paris, INSA, and IMT.

**NomadScholar AI with retrieval, observed answer summary:** NomadScholar retrieved Campus France Programs and Scholarships and Erasmus Mundus Joint Masters. It recommended Campus France official guidance, the Campus France catalog of programs taught in English, and search keywords such as artificial intelligence, data science, computer science, machine learning, intelligent systems, robotics, software engineering, cybersecurity, and applied mathematics. It told the student to verify admission requirements, deadlines, and details on official program pages.

**How retrieval improved the answer:** The no-retrieval answer risked looking like an authoritative university shortlist. The RAG answer avoided inventing a final list and instead gave a grounded search strategy based on Campus France tools.

## Case 3: Erasmus Mundus Preparation

**Question:** What should I prepare for Erasmus Mundus?

**Gemini without retrieval, observed answer summary:** Gemini focused mainly on logistics: visa, accommodation, finances, insurance, academic calendars, university systems, local language/culture, networking, flexibility, and independence.

**NomadScholar AI with retrieval, observed answer summary:** NomadScholar retrieved Erasmus Mundus Joint Masters. It explained that each Erasmus Mundus Joint Masters program has its own admission requirements, deadlines, selection criteria, required documents, and scholarship rules. It listed application materials such as transcripts, degree certificates, CV, motivation letters, recommendation letters, language proof, passport information, and program-specific documents.

**How retrieval improved the answer:** The no-retrieval answer was useful for travel preparation but missed the assignment-domain need: application requirements. Retrieval shifted the answer to concrete Erasmus Mundus application preparation.

## Case 4: EducationUSA Lebanon Advising

**Question:** What should a Lebanese student do if they want advising for studying in the United States?

**Gemini without retrieval, observed answer summary:** Gemini recommended contacting EducationUSA, speaking with a high school counselor, researching universities, preparing standardized tests, and planning finances. It was generally correct but did not cite the local knowledge-base document.

**NomadScholar AI with retrieval, observed answer summary:** After fixing the scope-routing miss found during testing, NomadScholar retrieved EducationUSA Lebanon Advising first. It answered that Lebanese students should seek EducationUSA Lebanon/AMIDEAST advising and listed help with the U.S. higher education system, university search, application materials, standardized testing, financial aid, student visa planning, timeline organization, comparing universities, and financing studies.

**How retrieval improved the answer:** Retrieval made the answer locally relevant and tied it to the project's Lebanon-specific advising document instead of leaving the advice as generic U.S. admissions guidance.

## Case 5: Arabic Scholarship Document Guidance

**Question:** شو المستندات المطلوبة للتقديم على منحة؟

**Gemini without retrieval, observed answer summary:** Gemini answered in Arabic with a general list: academic certificates/transcripts, motivation letter, CV, recommendation letters, language proof, passport/ID, research proposal for graduate/research scholarships, and financial-need proof for some scholarships.

**NomadScholar AI with retrieval, observed answer summary:** NomadScholar retrieved DAAD Applicant Information, DAAD Scholarships and Funding, and Erasmus Mundus Joint Masters. It answered in Arabic and listed scholarship documents such as CV, academic certificates/transcripts, motivation letter, recommendation letters, language proof, passport information, admission documents, research proposal/study plan, portfolio/work samples, plus a warning that exact requirements differ by scholarship, university, country, and program.

**How retrieval improved the answer:** The no-retrieval Arabic answer was fluent but generic. The RAG answer demonstrated bilingual support while still grounding the advice in the curated scholarship documents and giving a stronger official-source warning.

## Overall RAG Value

Across the five cases, retrieval improved the assistant by:

- grounding answers in curated official-source documents
- reducing hallucinated program names, deadlines, and universal requirements
- making advice more specific to DAAD, Campus France, Erasmus Mundus, EducationUSA Lebanon, and scholarship document preparation
- supporting Arabic answers with the same retrieval process used for English answers
- displaying retrieved source titles separately in the UI for transparency
