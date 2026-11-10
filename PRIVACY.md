# Privacy and public-export policy

## Repository contents

This repository contains a generic workflow, synthetic examples, generic document bodies, documentation and offline tests. The published workflow has no credential objects, source webhook IDs, cached resource names/URLs, private table/document IDs, original instance metadata, pinned records, or original operational message text.

All deployment values are explicit placeholders in **Project Configuration**. Node identifiers were regenerated. Example hosts and email addresses use `example.com`. The example Telegram IDs are synthetic test fixtures, not real account data.

## Runtime privacy

A configured deployment necessarily processes the data its users submit. Telegram receives messages/PDFs, Google processes document copies, and n8n processes workflow items and access/session records. Removing information from the public export does not remove it from those services.

Successful/error execution saving is disabled in the template, as is manual execution retention. Verify these settings in your installation and establish a retention policy. Access and session table rows persist until you manage them. Delivered PDFs remain in recipients' chats. Temporary document copies are deleted only on the successful path; provider failures require review.

## Keep private configuration private

- Configure credentials in n8n, never in Git-tracked source.
- Keep local exports, `.env` files, live templates and generated PDFs outside this repository.
- After customizing, inspect exports again before sharing. n8n exports can include credential names/IDs and hardcoded parameters.
- Rotate a secret through its provider if it is ever exposed; deleting a commit alone does not revoke it.
- Do not publish production execution screenshots or access-table rows.

`validate.mjs` checks structural restrictions and common secret shapes. It is an aid, not a complete secret detector. Review any new literal value, message, note and URL manually.

Reference: [n8n export/import guidance](https://docs.n8n.io/workflows/export-import/).
