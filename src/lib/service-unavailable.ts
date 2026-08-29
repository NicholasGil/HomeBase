import { NextResponse } from "next/server";

export function serviceUnavailableResponse() {
  return new NextResponse("Service Unavailable", {
    status: 503,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
