import { Queue, Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { handleSendSigningEmails } from "./send-signing-emails";
import { handleFinalizePdf } from "./finalize-pdf";

const connection = redis;

export const signingQueue = new Queue("signing", { connection });
export const pdfQueue = new Queue("pdf-finalization", { connection });

// Workers
new Worker(
  "signing",
  async (job) => {
    if (job.name === "send-signing-email") {
      await handleSendSigningEmails(job.data);
    }
  },
  { connection }
);

new Worker(
  "pdf-finalization",
  async (job) => {
    if (job.name === "finalize-pdf") {
      await handleFinalizePdf(job.data);
    }
  },
  { connection }
);

console.log("Workers started");
