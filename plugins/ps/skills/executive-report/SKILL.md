---
name: executive-report
description: Turn raw project notes into a polished, branded biweekly executive report PDF — anonymizing teammate and customer names along the way. Use when the user wants to write an executive report, status report, or biweekly update from messy notes, or runs /ps:executive-report.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Executive Report Generator

Transform raw project notes into a polished biweekly executive report PDF.

## Overview

This skill takes messy bullet points, brain dumps, and unstructured notes and produces a professional, branded PDF executive report. The report follows a consistent structure and applies project management expertise to organize and present information clearly.

## Privacy Guardrails

**IMPORTANT: Never include personal names in the generated report.**

- **Teammate names**: Replace with role descriptions (e.g., "Alex" → "a team member", "Jordan" → "a colleague")
- **Customer names**: Replace with generic references (e.g., "Morgan" → "the customer", "the client team")
- **Company names** (external): Replace with "the customer" or "the partner organization" unless it's Fonoster
- **Meeting attendees**: Describe by role, not name (e.g., "met with stakeholders" not "met with Casey and Riley")

When processing raw notes that contain names, automatically anonymize them in the final report. The customer/project name field is an exception—this is used for the report header and should be the project or internal codename, not individual names.

## Required Inputs

Before generating the report, **always ask the user for**:

1. **Customer/Project Name**: "Who is the customer or what project is this report for?"
2. **Additional Risks or Blockers**: "Are there any additional risks or blockers I should include beyond what's in your notes?"
3. **Reporting Period**: If not obvious from the notes, ask "What is the reporting period for this report? (e.g., Feb 3-14, 2025)"

## Report Structure

The report must contain exactly these five sections:

### 1. Executive Summary (Narrative Prose)
- 2-3 paragraphs providing a high-level overview
- Conversational but professional tone
- Highlight the most impactful accomplishments
- Note any critical risks or upcoming milestones
- Should stand alone as a quick read for busy stakeholders

### 2. Key Accomplishments (Mix of Prose and Bullets)
- Group related accomplishments thematically
- Lead each group with a brief contextual sentence
- Use bullets for specific items within each group
- Quantify impact where possible
- Focus on outcomes, not just activities

### 3. Metrics / KPIs (Mix of Prose and Bullets)
- Extract any measurable data from the raw notes
- Present metrics in a clear, scannable format
- Include context for what metrics mean
- Note trends or changes from previous periods if mentioned
- If no explicit metrics exist, derive reasonable ones (tickets closed, features delivered, etc.)

### 4. Risks & Blockers (Mix of Prose and Bullets)
- Categorize by severity if multiple risks exist
- Include mitigation strategies where known
- Be specific about impact and timeline
- **Always include any additional risks provided by the user**
- If no risks are present, state "No significant risks identified this period"

### 5. Next Steps (Bullets)
- Actionable items for the upcoming period
- Include owners if mentioned in notes
- Prioritize by importance
- Be specific about deliverables and timelines

## Writing Guidelines

### Tone
- Conversational but professional
- Direct and confident
- Avoid jargon unless industry-specific terms are necessary
- Write for cross-functional stakeholders (primarily direct manager)

### Length
- Total report: 1-2 pages
- Executive Summary: ~150-200 words
- Other sections: Concise, scannable content

### Transformation Rules
When processing raw notes:
1. **Consolidate**: Group related items together
2. **Elevate**: Identify what matters most to stakeholders
3. **Clarify**: Rewrite technical details in accessible language
4. **Complete**: Fill in obvious gaps (e.g., if "closed tickets" is mentioned, it's an accomplishment)
5. **Quantify**: Add numbers where they exist in the notes or can be reasonably inferred

## PDF Generation

After writing the report content, generate a branded PDF using the included Python script.

### Brand Specifications
- **Primary Color (Teal)**: #39E19E
- **Dark Green (Header/Text/Accents)**: #053204
- **Tertiary Dark**: #27150C
- **White**: #FFFFFF
- **Font**: Helvetica (clean, professional)

### To Generate the PDF

1. First, write the report content following the structure above
2. Run the `references/generate_report.py` script with the report content
3. The script will create a professionally formatted PDF with:
   - Fonoster logo in the header
   - Branded color accents
   - Consistent typography
   - Proper section formatting

```bash
pip install reportlab svglib --break-system-packages
python references/generate_report.py
```

## Example Workflow

**User provides raw notes:**
```
- Two minor releases with updates for the tms-migrator
- Clarification on tool use to Alex
- Closed tickets
- Reply to ticket around upgrading VQ to 4.6.3
...
```

**Claude asks:**
1. "Who is the customer or project this report is for?"
2. "Are there any additional risks or blockers I should include?"
3. (If needed) "What's the reporting period?"

**Claude then:**
1. Analyzes notes as an expert project manager
2. Organizes content into the five required sections
3. Writes the Executive Summary in narrative prose
4. Formats remaining sections with appropriate mix of prose and bullets
5. Generates the branded PDF

See `references/example_usage.py` for a full worked example, from raw notes through to the `generate_report()` call.

## File Structure

```
executive-report/
├── SKILL.md                        # This file
└── references/
    ├── generate_report.py           # PDF generation script
    ├── example_usage.py             # Worked example (raw notes → report)
    └── assets/
        └── logo.svg                 # Fonoster logo
```

## Notes

- Always maintain a positive but honest tone
- Highlight wins while being transparent about challenges
- The Executive Summary should tell the story; details go in other sections
- When in doubt about categorization, ask the user
- Keep the reader's time in mind—every word should add value
