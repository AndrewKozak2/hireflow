/**
 * interface for data typing
 */
interface EmailAttachment {
  name: string;
  contentType: string;
  size: number;
  contentBase64?: string;
  isMetadataOnly: boolean;
}

interface IngestEmailItem {
  subject: string;
  body: string;
  sender: string;
  forwardedBy: string;
  gmailMessageId: string;
  threadId: string;
  receivedAt: string;
  links: string[];
  attachments: EmailAttachment[];
}

interface WebhookResult {
  gmailMessageId: string;
  status: "received" | "duplicate" | "processed" | "not_application" | "failed";
}

interface WebhookResponse {
  results: WebhookResult[];
}

/**
 * Main function triggered by time-based events
 */
function processEmailsBatch(): void {
  const scriptProperties = PropertiesService.getScriptProperties();
  const baseUrl = scriptProperties.getProperty("WEBHOOK_BASE_URL");
  const webhookToken = scriptProperties.getProperty(
    "X_HIRE_FLOW_WEBHOOK_TOKEN",
  );

  if (!baseUrl || !webhookToken) {
    console.error(
      "Configuration error: WEBHOOK_BASE_URL or X_HIRE_FLOW_WEBHOOK_TOKEN is missing.",
    );
    return;
  }

  const fullWebhookUrl = `${baseUrl.replace(/\/$/, "")}/webhooks/email-ingest`;

  // Searching for up to 10 unread threads
  const threads = GmailApp.search("is:unread", 0, 10);
  if (threads.length === 0) {
    console.log("There are no new unread messages.");
    return;
  }

  const batch: IngestEmailItem[] = [];
  const threadMap = new Map<string, GoogleAppsScript.Gmail.GmailThread>();

  for (const thread of threads) {
    try {
      const messages = thread.getMessages();
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage.getId();

      threadMap.set(messageId, thread);

      batch.push({
        subject: lastMessage.getSubject(),
        body: lastMessage.getPlainBody(),
        sender: lastMessage.getFrom(),
        forwardedBy: extractForwardedBy(lastMessage),
        gmailMessageId: messageId,
        threadId: thread.getId(),
        receivedAt: lastMessage.getDate().toISOString(),
        links: extractLinks(lastMessage.getPlainBody()),
        attachments: processAttachments(lastMessage.getAttachments()),
      });
    } catch (e) {
      console.error(`Error processing the message ${thread.getId()}: ${e}`);
    }
  }

  if (batch.length === 0) {
    console.log("No valid messages processed in this batch");
    return;
  }

  // Sending data to the backend
  sendBatchToWebhook(fullWebhookUrl, webhookToken, batch, threadMap);
}

function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extracts information about who forwarded the email (X-Forwarded-For або Sender)
 */
function extractForwardedBy(
  message: GoogleAppsScript.Gmail.GmailMessage,
): string {
  const headersToTry = ["X-Forwarded-For", "Resent-From", "Sender"];

  for (const headerName of headersToTry) {
    const value = message.getHeader(headerName);
    if (value && value.trim() !== "") {
      return value;
    }
  }
  return message.getFrom();
}

function processAttachments(
  gmailAttachments: GoogleAppsScript.Gmail.GmailAttachment[],
): EmailAttachment[] {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/msword", // doc
    "image/jpeg",
    "image/png",
  ];
  const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

  return gmailAttachments.map((att) => {
    const isAllowedType = allowedMimeTypes.includes(att.getContentType());
    const isSmallEnough = att.getSize() <= MAX_SIZE;
    const isGoogleType =
      att.getContentType().indexOf("application/vnd.google-apps") !== -1;

    const result: EmailAttachment = {
      name: att.getName(),
      contentType: att.getContentType(), 
      size: att.getSize(),
      isMetadataOnly: true,
    };

    if (!isGoogleType && isAllowedType && isSmallEnough) {
      result.contentBase64 = Utilities.base64Encode(att.getBytes());
      result.isMetadataOnly = false;
    }

    return result;
  });
}

/**
 * Sending a data packet and processing confirmations (ACK)
 */
function sendBatchToWebhook(
  url: string,
  token: string,
  batch: IngestEmailItem[],
  threadMap: Map<string, GoogleAppsScript.Gmail.GmailThread>,
): void {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    headers: { "X-HireFlow-Webhook-Token": token },
    payload: JSON.stringify(batch),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const content = response.getContentText();
    const responseCode = response.getResponseCode();

    if (responseCode >= 200 && responseCode < 300) {
      if (!content || !content.trim().startsWith("{")) {
        console.error(
          "The server returned a non-JSON response. Check your webhook settings. Received:",
          content,
        );
        return;
      }

      const responseBody: WebhookResponse = JSON.parse(content);

      const successStatuses = [
        "received",
        "duplicate",
        "processed",
        "not_application",
      ];

      responseBody.results.forEach((result) => {
        const thread = threadMap.get(result.gmailMessageId);
        if (thread) {
          const originalItem = batch.find(
            (item) => item.gmailMessageId === result.gmailMessageId,
          );
          const fwdBy = originalItem ? originalItem.forwardedBy : "unknown";
          if (successStatuses.includes(result.status)) {
            thread.markRead();
            console.log(
              `[ACK] MessageID: ${result.gmailMessageId} | FwdBy: ${fwdBy} | Status: ${result.status}`,
            );
          } else {
            console.warn(
              `[RETRY] MessageID: ${result.gmailMessageId} | FwdBy: ${fwdBy} | Status: ${result.status}. Leaving unread.`,
            );
          }
        }
      });
    } else if (responseCode >= 400 && responseCode < 500) {
      console.error(
        `[CRITICAL] HTTP ${responseCode}: Payload structure error. Check DTOs. Batch rejected.`,
      );
    } else {
      console.error(
        `[ERROR] HTTP ${responseCode}: Server side issue or timeout. Will retry in 15 mins.`,
      );
    }
  } catch (e) {
    console.error(`[NETWORK ERROR] Failed to reach webhook: ${e}`);
  }
}
