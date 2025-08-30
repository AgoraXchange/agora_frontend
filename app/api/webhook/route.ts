import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
} from "@/lib/notification";
import { sendFrameNotification } from "@/lib/notification-client";
import { http } from "viem";
import { createPublicClient } from "viem";
import { optimism } from "viem/chains";
import { trackServerEvent } from "@/lib/server-analytics";
import { EVENTS } from "@/lib/analytics";

const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME;

const KEY_REGISTRY_ADDRESS = "0x00000000Fc1237824fb747aBDE0FF18990E59b7e";

const KEY_REGISTRY_ABI = [
  {
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "key", type: "bytes" },
    ],
    name: "keyDataOf",
    outputs: [
      {
        components: [
          { name: "state", type: "uint8" },
          { name: "keyType", type: "uint32" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function verifyFidOwnership(fid: number, appKey: `0x${string}`) {
  const client = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  try {
    const result = await client.readContract({
      address: KEY_REGISTRY_ADDRESS,
      abi: KEY_REGISTRY_ABI,
      functionName: "keyDataOf",
      args: [BigInt(fid), appKey],
    });

    return result.state === 1 && result.keyType === 1;
  } catch (error) {
    console.error("Key Registry verification failed:", error);
    return false;
  }
}

function decode(encoded: string) {
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
}

export async function GET() {
  return Response.json({ success: true, message: "Webhook endpoint is ready" });
}

interface NotificationDetails {
  url: string;
  token: string;
}

interface FrameEvent {
  event: string;
  notificationDetails?: NotificationDetails;
}

export async function POST(request: Request) {
  let event: FrameEvent;
  let fid: number;
  
  try {
    const requestJson = await request.json();

    const { header: encodedHeader, payload: encodedPayload } = requestJson;

    if (!encodedHeader || !encodedPayload) {
      return Response.json({ success: true });
    }

    const headerData = decode(encodedHeader);
    event = decode(encodedPayload);

    fid = headerData.fid;
    const key = headerData.key;

    const valid = await verifyFidOwnership(fid, key);

    if (!valid) {
      return Response.json(
        { success: false, error: "Invalid FID ownership" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ success: true });
  }

  switch (event.event) {
    case "frame_added":
      console.log(
        "frame_added",
        "event.notificationDetails",
        event.notificationDetails,
      );
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails);
        await sendFrameNotification({
          fid,
          title: `Welcome to ${appName}`,
          body: `Thank you for adding ${appName}`,
        });
        // Server-side analytics: frame added with notifications
        await trackServerEvent(EVENTS.FRAME_ADDED, fid, {
          frame_action: "added",
          has_notification_details: true,
        });
      } else {
        await deleteUserNotificationDetails(fid);
        // Server-side analytics: frame added without notifications
        await trackServerEvent(EVENTS.FRAME_ADDED, fid, {
          frame_action: "added",
          has_notification_details: false,
        });
      }

      break;
    case "frame_removed": {
      console.log("frame_removed");
      await deleteUserNotificationDetails(fid);
      await trackServerEvent(EVENTS.FRAME_REMOVED, fid, {
        frame_action: "removed",
      });
      break;
    }
    case "notifications_enabled": {
      console.log("notifications_enabled", event.notificationDetails);
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails);
        await sendFrameNotification({
          fid,
          title: `Welcome to ${appName}`,
          body: `Thank you for enabling notifications for ${appName}`,
        });
        await trackServerEvent(EVENTS.NOTIFICATIONS_ENABLED, fid, {
          frame_action: "notifications_enabled",
        });
      }

      break;
    }
    case "notifications_disabled": {
      console.log("notifications_disabled");
      await deleteUserNotificationDetails(fid);
      await trackServerEvent(EVENTS.NOTIFICATIONS_DISABLED, fid, {
        frame_action: "notifications_disabled",
      });

      break;
    }
  }

  return Response.json({ success: true });
}
