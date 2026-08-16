import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

/**
 * 生成 LiveKit 接入 token
 * GET /api/token?room=<roomName>&identity=<identity>&name=<displayName>
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room") ?? "default";
  const identity = searchParams.get("identity") ?? `user-${Math.random().toString(36).slice(2, 8)}`;
  const name = searchParams.get("name") ?? identity;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LIVEKIT_API_KEY / LIVEKIT_API_SECRET 未配置" },
      { status: 500 },
    );
  }

  // 房间由首个参与者加入时自动创建，无需显式调用 RoomServiceClient.createRoom
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: "10m",
  });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, url: process.env.LIVEKIT_URL });
}
