# Generic document templates

Create two separate Google Docs files. Copy the plain text bodies below; Markdown formatting is optional. Style the headings, add your own logo, and keep the four placeholders unchanged.

Each template must contain `{{Record_ID}}`, `{{Department}}`, `{{Reference}}`, and `{{EMAIL}}`. Put the email placeholder and the literal label **Open record** exactly once in the document body. The workflow replaces the placeholders, then applies the hyperlinks.

Use a single document tab. Headers, footers, drawings, and repeated contact email text are outside this template's supported range lookup. These examples are operational summaries, not legally binding certificates or approvals.

## Template A — Service Confirmation

```text
SERVICE CONFIRMATION

Record ID: {{Record_ID}}
Department: {{Department}}
Reference: {{Reference}}

This document summarizes the submitted service information.
Review the linked record for the current operational status.

Contact: {{EMAIL}}
Open record

Generated from the submitted request. Verify details before external use.
```

## Template B — Internal Request Summary

```text
INTERNAL REQUEST SUMMARY

Request ID: {{Record_ID}}
Responsible department: {{Department}}
Related reference: {{Reference}}

This summary supports internal coordination and record keeping.
It does not itself authorize spending or approve the request.

Contact: {{EMAIL}}
Open record

Generated from the submitted request. Follow your organization's approval process.
```
