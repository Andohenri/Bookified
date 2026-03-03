import { searchBookSegments } from "@/lib/actions/book.action";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (message?.type === "tool-calls") {
      const toolCalls = message.toolCalls || [];

      const results = await Promise.all(
        toolCalls.map(async (toolCall: any) => {
          if (toolCall.function?.name === "searchBook") {
            const { bookId, query } = toolCall.function.arguments;

            const result = await searchBookSegments(bookId, query, 3);

            let content = "No information found about this topic.";

            if (result.success && result.data && result.data.length > 0) {
              content = result.data
                .map((segment: any) => segment.content)
                .join("\n\n");
            }

            return {
              toolCallId: toolCall.id,
              result: content,
            };
          }

          return {
            toolCallId: toolCall.id,
            result: "Unknown tool call.",
          };
        })
      );

      return NextResponse.json({ results });
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Error in Vapi search-book route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
