# RAG Improvement Cases

This file documents five cases where retrieval-augmented generation improved the quality, grounding, and safety of NomadScholar AI's responses.

## Case 1: DAAD scholarship documents

**Question:**  
What documents do I need for a DAAD scholarship?

**Without retrieval:**  
A general LLM may provide a generic scholarship document list without explaining that DAAD requirements vary by program.

**With retrieval:**  
NomadScholar AI retrieves DAAD-related documents and explains that each DAAD scholarship program has its own eligibility rules, deadlines, language requirements, and document list. It provides common documents such as CV, transcripts, motivation letter, recommendation letters, language proof, admission documents, and research proposal or study plan.

**Improvement:**  
The answer is more specific, grounded, and cautious. It avoids presenting a single universal DAAD document list.

---

## Case 2: Master's in AI in France

**Question:**  
I want to apply for a master's in AI in France. What options should I explore?

**Without retrieval:**  
A general LLM might invent university names, recommend programs without source grounding, or give broad advice.

**With retrieval:**  
NomadScholar AI retrieves the Campus France guidance document and recommends using official Campus France program search tools, English-taught program catalogs, and relevant search keywords such as artificial intelligence, data science, computer science, machine learning, robotics, and applied mathematics.

**Improvement:**  
The response avoids hallucinating specific programs and directs the student toward official search tools and verification steps.

---

## Case 3: Arabic scholarship guidance

**Question:**  
شو المستندات المطلوبة للتقديم على منحة؟

**Without retrieval:**  
A general LLM may answer in Arabic but provide a broad, unsupported list.

**With retrieval:**  
NomadScholar AI retrieves scholarship-related documents and answers in Arabic with a practical checklist of common requirements, while explaining that requirements vary by scholarship and university.

**Improvement:**  
The answer combines bilingual support with grounded retrieval and safer wording.

---

## Case 4: Image-based scholarship screenshot

**Question:**  
Can you explain this screenshot and make a checklist?

**Without OCR and retrieval:**  
The assistant would not be able to use the image content directly, or it might only give generic advice.

**With OCR and retrieval:**  
NomadScholar AI extracts text from the uploaded screenshot, identifies important details such as required documents, deadlines, funding coverage, and application steps, then combines the image text with retrieved scholarship context.

**Improvement:**  
The assistant supports multimodal input and turns unstructured image text into actionable guidance.

---

## Case 5: Admission guarantee safety

**Question:**  
Can you guarantee I will get accepted?

**Without safety handling:**  
A general assistant might overpromise or give unsupported confidence.

**With project-specific handling:**  
NomadScholar AI clearly refuses to guarantee admission, scholarships, visas, or funding. It explains that final decisions are made by official universities, scholarship providers, or embassies, and redirects the user toward requirements, checklists, missing information, and next steps.

**Improvement:**  
The response is safer, more ethical, and aligned with the project scope.