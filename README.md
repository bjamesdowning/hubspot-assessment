# Breezy HubSpot Integration POC

This repository contains a Proof of Concept (POC) demonstrating a seamless integration between Breezy's platform and HubSpot CRM. It showcases data synchronization, deal management, and AI-powered sales intelligence.

## A. Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- A HubSpot account with Super Admin access (to create Private Apps)
- A Google Cloud Project with Gemini API access (or a Gemini API key)

### Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Ensure the following variables are set:
- `HUBSPOT_ACCESS_TOKEN`: Private App token with `crm.objects.contacts`, `crm.objects.deals` (read/write), and `crm.schemas.deals` (read) scopes.
- `GEMINI_TOKEN`: API key for Google Gemini (Generative AI).

### Installation & Local Execution

**Quick Start**

1.  **Install everything:**
    ```bash
    npm run setup
    ```

2.  **Run the App (Server + Client):**
    ```bash
    npm start
    ```
    - Server: http://localhost:3001
    - Client: http://localhost:5173

    > **To stop the app:** Press `Ctrl + C` in the terminal to shut down both the server and client.

**Manual Startup (Optional)**

If you prefer to run them separately:
- Server: `npm run server:dev`
- Client: `npm run client:dev`

---

## B. Project Overview

This POC demonstrates how Breezy can leverage HubSpot as its central customer truth source while maintaining a custom, high-performance application experience.

**Key Capabilities:**
-   **Bi-directional Sync**: Creates and retrieves Contacts and Deals in real-time.
-   **Sales Intelligence**: Uses Generative AI to score leads and provide actionable sales tips based on prospect data.
-   **Secure Architecture**: Backend-for-Frontend (BFF) pattern ensures API keys are never exposed to the client.

---

## C. AI Usage Documentation

**AI Tools Used:**
> This section is not written by AI

- Utilized Google's Antigravity IDE coupled with Gemini 3 Pro (high) for orchestration of the application build itself. I simply guided the agentic platform towards several iterations of testing and adding features until requirements were met. I used Gemini to generate the inital prompt to ensure the agentic platform had a verbose and clearly defined set of requirements to avoid halucinations and ensure quicker adhearance to my own preferences of language choice, simplicity in design, and ease of deployment. 
- This was an exercise of learning about the Antigravity IDE and how to guide it to create, test, and ensure the application is secure by following simple design philosophy and efficiency. In addition to learning about HubSpots API, object modeling, and data models associated. 
- The AI feature within the application simply uses a faster, lower cost and faster model (gemini 2.5 flash lite) within Google's free-tier in Google AI Studio.
- Gemini also assisted me in parsing HubSpot documentation to better understand the platform itself and data models associated.
- AI Helped tremendously and allowed me to create a much more polished product as a PoC. AI allowed me to provide a declarative state of functions, and features, and orchestrate the implementation versus manually coding each feature and function.
- AI also helped me to better understand the platform and data models associated with HubSpot, and talk through various design options (such as language choice, build tools, styling tools, etc)
- However, for the purpose of this PoC, the application has several external dependencies. AI tended to add dependencies that were not necessary for the PoC, and I had to remove them manually. Or, over engineered tooling for the context of this assignment. 

- What was Challenging:
  - The most challenging aspect of this PoC was not technical, however it was focusing on the customer, their business, and the business use-case for this application. AI took care of a majority of the technical nuance based on my guidance, however it was not as useful in terms of understanding the business use-case and customer needs from a consultative perspective. 

---

## D. HubSpot Data Architecture

### Entity Relationship Diagram (ERD)
The architecture follows a standard B2B CRM pattern (Company-Centric), ensuring that data is organized by Account rather than just individual people. This supports Breezy's high-volume sales motion by grouping multiple leads under one organization.

```mermaid
erDiagram
    OWNER ||--o{ CONTACT : "owns"
    OWNER ||--o{ DEAL : "owns"
    COMPANY ||--o{ CONTACT : "employs"
    COMPANY ||--o{ DEAL : "billing_entity_for"
    CONTACT ||--o{ DEAL : "associated_with (ID:3)"

    OWNER {
        string email
        string first_name
        string last_name
    }
    COMPANY {
        string domain "Primary Key / De-duplication"
        string name
        string industry
        string annual_revenue
    }
    CONTACT {
        string email "Primary Key"
        string jobtitle
        string lifecycle_stage "Subscriber -> Customer"
        number ai_lead_score "Custom: 0-100 Qualification"
        string ai_icebreaker "Custom: AI Generated Insight"
    }
    DEAL {
        string dealname
        float amount
        string dealstage
        date closedate
        string pipeline
    }
```

### Design Decisions & Rationale

1.  **Company-First Architecture**:
    *   **Relation**: `COMPANY ||--o{ CONTACT`
    *   **Why**: Breezy sells to businesses, not just people. Using the `Company` object allows sales reps to see all stakeholders (Contacts) for a single Account in one view. It prevents data silos where 5 people from the same company exist as unconnected records.

2.  **Custom AI Properties**:
    *   **Properties**: `ai_lead_score` (Number), `ai_icebreaker` (String)
    *   **Why**: Storing AI insights as structured data properties (rather than just Notes) is critical. It allows Breezy to:
        *   Create **Active Lists** of "Hot Leads" (e.g., Score > 80).
        *   Trigger **Workflows** to auto-assign high-scoring leads.
        *   Visualize lead quality in **Reports**.

3.  **Deal Associations**:
    *   **Relation**: `COMPANY` is the primary parent of `DEAL`.
    *   **Why**: If a Contact leaves their job (the "Champion"), the Deal should not be orphaned. Associating Deals with the Company ensures historical revenue data remains intact even as employees churn.

4.  **HubSpot Owner (User) Mapping**:
    *   **Relation**: `OWNER ||--o{ CONTACT` and `OWNER ||--o{ DEAL`
    *   **Why**: In a production environment, "Users" (Sales Reps) must be assigned to records to manage accountability. The `hubspot_owner_id` field on Contacts and Deals links them to a specific system User. This allows for:
        *   **Pipeline Partitioning**: Reps only see their own deals.
        *   **Commission Reporting**: attributing closed revenue to the correct user.

---

## E. AI Feature Explanation

### Feature: Smart Lead Qualification (Sales Intelligence)

**Description:**
When a contact is viewed or created, the system uses Google Gemini to analyze their `jobtitle` and `company` fields. It assigns a numerical score (0-100) and provides a specific "icebreaker" or talking point.

**Why this feature?**
Breezy likely generates high volumes of signups. Sales reps cannot manualy review every lead. This feature instantly highlights "High Priority" prospects (e.g., CTOs, VPs) versus casual browsers.


---

## F. Design Decisions

> This section is not written by AI

**Technical Choices:**
-   **Express.js Proxy**: Chosen to securely manage the HubSpot Private App Token. Direct client-side calls would expose credentials.
-   **React + Vite**: Built as a stateless front end to query HubSpot vs maintaining a PG db for local hosting and bi-directional sync.
-   **Gemini Flash**: Selected for speed/cost balance essential for real-time features.

- Compared object sync best practices outline here: https://github.com/hubspotdev/crm-object-sync
  - This PoC differs in the following ways:
    - Stateless, opposed to hosting data in postgres - Ensures HubSpot is the single source of truth
    - Sync Strategy - direct query of hubspot API opposed to client side enforced sync (will not overwrite hubspot data)
    - Authentication - Used private app token for simplicity vs oAuth
  - Design Benefits:
    - Simpler to deploy and maintain
    - No need to manage a database
    - No need to manage authentication per user
  - Design Drawbacks:
    - Scalability
    - Potential API rate limiting errors
    - Actions not tied to a specific user (relees on legacy app token)

- Future Improvements:
  - Implement rate limiting - dynamic back off timers based on API response
  - Implement pagination - As contacts grow, currently the app will load all contacts at once which is not scalable
  - Improve scalability by implementing best practice object sync as defined in https://github.com/hubspotdev/crm-object-sync
    - Solve high-volume latency issues with current API query only implementation

- What to ask the client before building production version:
  - What aspects of customer data have historically indicated the highest value prospects?
    - Utilize this to improve data gather by front-end and prompt used by AI Feature to improve lead qualification
  - Average volume of contacts and deals added
    - Justify need for improved scalability, review best practice of data storage (PG db) 
