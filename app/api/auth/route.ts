import md5 from "spark-md5";
import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../../config/server";

export async function POST(req: NextRequest) {
  const serverConfig = getServerSideConfig();

  if (!serverConfig.needCode) {
    return NextResponse.json({ ok: true });
  }

  const body = (await req.json().catch(() => null)) as {
    accessCode?: string;
  } | null;
  const accessCode = body?.accessCode?.trim() ?? "";

  if (!accessCode) {
    return NextResponse.json(
      { ok: false, msg: "empty access code" },
      { status: 400 },
    );
  }

  const hashedCode = md5.hash(accessCode);

  if (!serverConfig.codes.has(hashedCode)) {
    return NextResponse.json(
      { ok: false, msg: "wrong access code" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}

export const runtime = "edge";
