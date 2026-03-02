import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "URLs array is required" },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      urls.map(async (url: string) => {
        try {
          await del(url);
          return { url, success: true };
        } catch (error) {
          return { 
            url, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          };
        }
      })
    );

    const deletedUrls = results
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => r.status === "fulfilled" ? r.value.url : null);

    const failedUrls = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => r.status === "fulfilled" ? r.value : null);

    return NextResponse.json({
      success: true,
      deleted: deletedUrls,
      failed: failedUrls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
