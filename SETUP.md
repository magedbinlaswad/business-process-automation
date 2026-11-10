# Setup

## Prerequisites

Use an n8n installation that supports the node versions in the JSON: Data Table 1.1, Code 2, Switch 3.5, If 2.4, Telegram Trigger 1.5, Telegram 1.2, Google Drive 3, Google Docs 2, HTTP Request 4.5, and Limit 1. Older installations may require node upgrades. No minimum n8n release is asserted without integration testing.

Create a dedicated test Telegram bot and Google workspace/account for initial testing. Do not reuse a bot attached to another active webhook workflow: registering a webhook can disrupt its existing workflow.

## 1. Create the data tables

Create tables in the same n8n project as the imported workflow. All custom columns below are **String** fields. n8n manages its own row ID and timestamps.

**Access table**

| Column | Values / purpose |
| --- | --- |
| `user_id` | Telegram user ID represented as text |
| `username` | Optional Telegram username |
| `status` | `pending`, `approved`, `rejected`, or `revoked` |
| `role` | `owner` or `user` |

Create one owner row with your own private `user_id`, `status=approved`, and `role=owner`. The configured owner ID must match it. Do not commit this row to GitHub.

**Session table**

| Column | Values / purpose |
| --- | --- |
| `chat_id` | Private Telegram chat ID represented as text |
| `template_key` | `template_a` or `template_b` |
| `step` | `awaiting_documents` |

Keep one access row per user and one session row per chat. The workflow uses upserts, but does not enforce a database uniqueness constraint under concurrent requests. Add database-level uniqueness if scaling beyond a small deployment.

## 2. Create the templates

Copy each body in [TEMPLATES.md](TEMPLATES.md) into a separate Google document. Keep a single tab, place all content in the body, and preserve the exact placeholders. Give the connected Google account access to both files. Do not place private template links in this repository.

## 3. Configure the workflow

Import `business-process-automation.json` into a **new** workflow. Open **Project Configuration** and replace:

| Configuration key | Your private value |
| --- | --- |
| `ownerUserId` | Owner's Telegram user ID as a string |
| `accessTableId` | Access table ID |
| `sessionTableId` | Session table ID |
| `templateAId` | Service Confirmation Google document ID |
| `templateBId` | Internal Request Summary Google document ID |
| `allowedLinkHosts` | Exact HTTPS hostnames permitted in document links |

The default host `example.com` is for synthetic examples. Add your own approved hostname before real use. Links with credentials, custom ports, unsafe schemes, or unlisted hosts are rejected. Links are embedded in the PDF, never fetched by the workflow.

## 4. Connect credentials

| Nodes | Credential to select |
| --- | --- |
| Receive Request and all Telegram delivery/notice nodes | Your Telegram bot credential |
| Copy Selected Template, Export PDF, Delete Temporary Copy | Google Drive OAuth2 |
| Fill Document Fields, Read Document Structure | Google Docs OAuth2 |
| Apply Document Links | Predefined credential type: Google Docs OAuth2 |

Use n8n's credential editor. Do not paste tokens into code or upload credential exports. The workflow JSON deliberately contains no credential assignments.

## 5. Acceptance checklist

Start only after credentials and resources are configured. Use a test bot and disposable, synthetic documents.

- A new user sends `/start`; one pending record and one owner request appear.
- The owner approves the request; the user and owner receive confirmation.
- A non-owner cannot approve or reject another user by sending a callback-like string.
- Rejected/revoked users cannot enter the document pipeline.
- An approved user sends `/start`, chooses a template, and submits `sample-request.txt`.
- Two correctly named PDFs arrive with the expected fields and links; original templates remain unchanged.
- Temporary copies are deleted after successful delivery.
- Invalid input returns an error notice and creates no documents.
- A request without a selected template returns the input guidance.
- Test provider failure and establish a manual cleanup procedure before production.

The public export disables saved success/error execution data and manual execution retention. Verify your installation applies those settings, and check its organization-level retention policy. Adjust observability privately if required.

Official reference: [n8n workflow export/import](https://docs.n8n.io/workflows/export-import/).
