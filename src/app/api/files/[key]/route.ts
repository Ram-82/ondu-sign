import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || "./uploads";

// Serve locally stored files (only used in local dev mode)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (process.env.S3_ACCESS_KEY_ID) {
    return NextResponse.json({ error: "Not available in S3 mode" }, { status: 404 });
  }

  try {
    const decodedKey = decodeURIComponent(key);
    const filePath = path.join(LOCAL_STORAGE_DIR, decodedKey.replace(/\//g, "_"));

    // Prevent path traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(LOCAL_STORAGE_DIR);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileBuffer = await fs.readFile(resolvedPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
