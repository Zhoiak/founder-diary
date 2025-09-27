import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the yearbook generation by filename
    const { data: yearbook, error: yearbookError } = await supabase
      .from('yearbook_generations')
      .select('*')
      .eq('user_id', session.user.id)
      .like('download_url', `%${filename}`)
      .single();

    if (yearbookError || !yearbook) {
      return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
    }

    // Update download count
    await supabase
      .from('yearbook_generations')
      .update({ 
        download_count: (yearbook.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', yearbook.id);

    // In a real implementation, you would:
    // 1. Fetch the file from storage (S3, Supabase Storage, etc.)
    // 2. Stream it back to the user
    // 3. Set appropriate headers for download

    // For now, we'll return a mock response
    const mockContent = generateMockFile(yearbook.format, yearbook.title);
    const contentType = yearbook.format === 'pdf' ? 'application/pdf' : 'application/epub+zip';

    return new NextResponse(mockContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': mockContent.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Unexpected error in yearbook download:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockFile(format: string, title: string): Buffer {
  // Generate a mock file for demonstration
  const content = `Mock ${format.toUpperCase()} file for: ${title}\n\nGenerated at: ${new Date().toISOString()}\n\nThis is a placeholder file. In a real implementation, this would be the actual generated yearbook.`;
  
  return Buffer.from(content, 'utf-8');
}
