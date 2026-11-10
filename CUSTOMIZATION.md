# Adapt the process

The reusable core is **access → structured input → selected template → generated PDF → delivery**. Telegram is the intake/delivery adapter; the business document fields and templates are independent customization points.

| Example adaptation | Fields to consider | Additional work |
| --- | --- | --- |
| Service handover summary | Service ID, team, work reference | Add completion status and sign-off rules |
| Procurement request summary | Request ID, department, cost center | Add line items and a separate spending approval process |
| Operational letter | Reference, department, recipient | Add recipient fields and approved wording |
| Customer service case summary | Case ID, team, case reference | Connect the case system and enforce its access rules |

These are proposed adaptations; they are not included integrations.

## Change the document fields

1. Update the input format and validation in **Validate Document Batch**.
2. Update the mappings in **Fill Document Fields**.
3. Replace the corresponding placeholders in both private Google templates.
4. Update **Request Document Data**, **Invalid Input Notice**, examples, and validation cases.
5. If link labels change, update **Locate Link Ranges** and its tests.

## Add a template

Add a configuration ID, a template-menu button, a router branch and a session value. Extend the parser's template allowlist and replace the two-way selector in **Copy Selected Template** with an explicit key-to-ID mapping. Reject unknown keys rather than defaulting silently.

## Use another intake channel

Replace the trigger/normalizer and notification nodes with a form, webhook, or enterprise messaging adapter. Preserve the normalized contract (`user_id`, `chat_id`, `action`) or explicitly remap downstream expressions. Authentication must be redesigned for the new channel; do not assume a supplied user ID is trustworthy.

## Improve reliability

Add an idempotency key, a record-level audit table, an error workflow, controlled retry/backoff, rate limits, and a cleanup policy. Test these against provider errors and concurrent requests before making reliability claims.
