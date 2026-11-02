# Email Forwarder (Google Apps Script)

     This is a thin forwarder service for **HireFlow**. It automatically polls unread emails from a Gmail mailbox and forwards their raw content to the backend
      webhook for processing.

     ## Features
     - **Batch Processing:** Processes up to 10 unread threads per run.
     - **Attachment Handling:** Extracts and encodes supported attachments (PDF, DOCX, DOC, JPEG, PNG) up to 25MB into Base64.
     - **Link Extraction:** Automatically finds URLs within the email body.
     - **Reliable Delivery (ACK):** Only marks emails as read if the backend confirms successful receipt.
     - **Time-based Trigger:** Designed to run every 15 minutes.

    ## Project Structure
    - `src/index.ts`: Main logic and data processing.
    - `src/appsscript.json`: Manifest file for Google Apps Script.
    - `tsconfig.json`: TypeScript configuration for GAS environment.
    - `.clasp.json`: Configuration for the `clasp` CLI tool.

    ## Setup Instructions

    ### 1. Prerequisites
    Ensure you have [Node.js](https://nodejs.org/) installed and a Google account.

    ### 2. Install Dependencies
    Navigate to the project folder and run:

    npm install

    ### 3. Login to Google

    Authorize `clasp` to access your Google account:
    npx clasp login

    ### 4. Create or Connect Script
    If you haven't created a script project yet, you can create one:

    npx clasp create --title "HireFlow Email Forwarder" --type standalone

    Or, if you already have a `scriptId` in `.clasp.json`, skip this step.

    ### 5. Deploy Code
    Push your local TypeScript code to the Google Apps Script environment:

    npm run push

     ## Configuration (Script Properties)
     The script requires the following properties to be set in the Google Apps Script project settings (**Project Settings > Script Properties**):

     |            Property         |                        Description                  |
     |-----------------------------|-----------------------------------------------------|
     | `WEBHOOK_BASE_URL`          | The full URL of the backend webhook endpoint.       |
     | `X_HIRE_FLOW_WEBHOOK_TOKEN` | Security token for authorization (sent in headers). |

    ## Automation Setup
    To run the script automatically:
    1. Open the [Apps Script console](https://script.google.com/).
    2. Go to **Triggers** (clock icon) in the left sidebar.
    3. Click **Add Trigger**.
    4. Select `processEmailsBatch` as the function to run.
    5. Choose **Time-driven** as the event source.
    6. Set the type to **Minutes timer** and the interval to **Every 15 minutes**.

    ## Monitoring
    - Execution logs can be found in the **Executions** tab of the Apps Script console.
    - Detailed error logs are sent to **Stackdriver Logging**.

     ## Developer Instructions (CI/CD Setup)

     To enable automatic deployment via GitHub Actions:
     1.  **Retrieve Credentials:** Get the content of your local `~/.clasprc.json` file (usually found in `C:\Users\<YourName>\` on Windows).
     2.  **GitHub Secrets:** Navigate to your repository settings on GitHub: **Settings > Secrets and variables > Actions**.
     3.  **Add Secret:** Create a new secret named `CLASP_CREDENTIALS` and paste the entire JSON content from `.clasprc.json`.
     4.  **Verification:** Ensure that the `scriptId` in your `.clasp.json` matches your Google Apps Script project ID.

     The workflow will now automatically deploy your code using `clasp push` whenever changes are pushed to the `main` branch.

    ##  Recruiter Instructions (Gmail Forwarding Setup)

    To allow the system to process your incoming applications, you need to set up a forwarding rule in your Gmail account:

    1.  **Add Forwarding Address:**
        - Go to Gmail Settings -> **Forwarding and POP/IMAP**.
        - Click **Add a forwarding address** and enter the technical email (e.g., `applications@hireflow-dev.example`).
        - A verification email will be sent. The developer can find the verification code in the **Apps Script Execution Logs**.

    2.  **Create a Filter:**
        - In the Gmail search bar, click the **Show search options** icon.
        - In the **To** field, enter your public job application email (e.g., `jobs@yourcompany.com`).
        - Click **Create filter**.
        - Select **Forward it to:** and choose the technical address you added in step 1.
        - Click **Create filter** again.

    Once configured, all new applications sent to your email will be automatically forwarded to HireFlow for processing
