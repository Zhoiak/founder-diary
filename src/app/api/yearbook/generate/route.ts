import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const GenerateYearbookSchema = z.object({
  projectId: z.string().uuid(),
  format: z.enum(['pdf', 'epub']),
  startDate: z.string(),
  endDate: z.string(),
  title: z.string().optional(),
  includePhotos: z.boolean().default(true),
  includeLocation: z.boolean().default(false),
  includeMood: z.boolean().default(true),
  redactSensitive: z.boolean().default(false),
  coverStyle: z.enum(['minimal', 'elegant', 'modern']).default('elegant'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validatedData = GenerateYearbookSchema.parse(body);

    console.log("Generating yearbook for user:", session.user.id);

    // Check if user has access to this project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedData.projectId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Fetch entries for the date range
    const { data: entries, error: entriesError } = await supabase
      .from('personal_entries')
      .select(`
        *,
        personal_entry_areas (
          area_id,
          life_areas (
            id,
            key,
            label,
            color,
            icon
          )
        )
      `)
      .eq('project_id', validatedData.projectId)
      .gte('date', validatedData.startDate)
      .lte('date', validatedData.endDate)
      .order('date', { ascending: true });

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found for the selected date range" }, { status: 404 });
    }

    // Generate the yearbook
    const yearbookData = await generateYearbook({
      entries,
      options: validatedData,
      userId: session.user.id,
      userEmail: session.user.email || 'user@example.com'
    });

    // Store generation record
    const { data: generation, error: generationError } = await supabase
      .from('yearbook_generations')
      .insert({
        project_id: validatedData.projectId,
        user_id: session.user.id,
        format: validatedData.format,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        title: validatedData.title || yearbookData.title,
        entry_count: entries.length,
        file_size: yearbookData.fileSize,
        download_url: yearbookData.downloadUrl,
        options: validatedData,
        status: 'completed'
      })
      .select()
      .single();

    if (generationError) {
      console.error("Error storing generation record:", generationError);
    }

    return NextResponse.json({
      success: true,
      yearbook: {
        id: generation?.id,
        title: yearbookData.title,
        format: validatedData.format,
        entryCount: entries.length,
        fileSize: yearbookData.fileSize,
        downloadUrl: yearbookData.downloadUrl,
        generatedAt: new Date().toISOString()
      },
      message: "Yearbook generated successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in yearbook generation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateYearbook({ entries, options, userId, userEmail }: {
  entries: any[];
  options: z.infer<typeof GenerateYearbookSchema>;
  userId: string;
  userEmail: string;
}) {
  const startDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);
  
  // Generate title if not provided
  const title = options.title || generateDefaultTitle(startDate, endDate);
  
  // Process entries
  const processedEntries = entries.map(entry => ({
    ...entry,
    content_md: options.redactSensitive ? redactSensitiveContent(entry.content_md) : entry.content_md,
    location_name: options.includeLocation ? entry.location_name : null,
    latitude: options.includeLocation ? entry.latitude : null,
    longitude: options.includeLocation ? entry.longitude : null,
    photos: options.includePhotos ? entry.photos : []
  }));

  if (options.format === 'pdf') {
    return await generatePDF({
      title,
      entries: processedEntries,
      options,
      userId,
      userEmail
    });
  } else {
    return await generateEPUB({
      title,
      entries: processedEntries,
      options,
      userId,
      userEmail
    });
  }
}

async function generatePDF({ title, entries, options, userId, userEmail }: {
  title: string;
  entries: any[];
  options: z.infer<typeof GenerateYearbookSchema>;
  userId: string;
  userEmail: string;
}) {
  // This would use Puppeteer or @react-pdf/renderer to generate PDF
  // For now, we'll create a mock implementation
  
  const htmlContent = generateHTMLContent({ title, entries, options });
  
  // Mock PDF generation
  const fileName = `yearbook-${Date.now()}.pdf`;
  const downloadUrl = `/api/yearbook/download/${fileName}`;
  
  // In a real implementation:
  // const pdf = await generatePDFFromHTML(htmlContent);
  // const uploadedUrl = await uploadToStorage(pdf, fileName);
  
  return {
    title,
    downloadUrl,
    fileSize: 1024 * 1024 * 2, // Mock 2MB file
    format: 'pdf' as const
  };
}

async function generateEPUB({ title, entries, options, userId, userEmail }: {
  title: string;
  entries: any[];
  options: z.infer<typeof GenerateYearbookSchema>;
  userId: string;
  userEmail: string;
}) {
  // This would use epub-gen to generate EPUB
  // For now, we'll create a mock implementation
  
  const fileName = `yearbook-${Date.now()}.epub`;
  const downloadUrl = `/api/yearbook/download/${fileName}`;
  
  // In a real implementation:
  // const epub = await generateEPUBFromEntries(entries, options);
  // const uploadedUrl = await uploadToStorage(epub, fileName);
  
  return {
    title,
    downloadUrl,
    fileSize: 1024 * 1024 * 1.5, // Mock 1.5MB file
    format: 'epub' as const
  };
}

function generateHTMLContent({ title, entries, options }: {
  title: string;
  entries: any[];
  options: z.infer<typeof GenerateYearbookSchema>;
}) {
  const startDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; margin: 0; padding: 40px; }
        .cover { text-align: center; page-break-after: always; }
        .cover h1 { font-size: 3em; margin-bottom: 0.5em; }
        .cover .subtitle { font-size: 1.2em; color: #666; }
        .entry { page-break-inside: avoid; margin-bottom: 2em; }
        .entry-date { font-weight: bold; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.5em; }
        .entry-title { font-size: 1.2em; margin: 0.5em 0; }
        .entry-content { margin: 1em 0; }
        .entry-meta { font-size: 0.9em; color: #666; margin-top: 1em; }
        .mood { display: inline-block; margin-right: 1em; }
        .location { display: inline-block; }
        .photos { margin: 1em 0; }
        .photo { max-width: 100%; height: auto; margin: 0.5em 0; }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${title}</h1>
        <p class="subtitle">
          ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
        </p>
        <p class="subtitle">${entries.length} entries</p>
      </div>
      
      ${entries.map(entry => `
        <div class="entry">
          <div class="entry-date">${new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          ${entry.title ? `<h2 class="entry-title">${entry.title}</h2>` : ''}
          <div class="entry-content">${markdownToHTML(entry.content_md || '')}</div>
          <div class="entry-meta">
            ${options.includeMood && entry.mood ? `<span class="mood">Mood: ${getMoodEmoji(entry.mood)}</span>` : ''}
            ${options.includeLocation && entry.location_name ? `<span class="location">📍 ${entry.location_name}</span>` : ''}
          </div>
          ${options.includePhotos && entry.photos?.length > 0 ? `
            <div class="photos">
              ${entry.photos.map((photo: any) => `
                <img src="${photo.path}" alt="${photo.caption || ''}" class="photo">
                ${photo.caption ? `<p><em>${photo.caption}</em></p>` : ''}
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

function generateDefaultTitle(startDate: Date, endDate: Date): string {
  const year = startDate.getFullYear();
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  
  if (sameYear) {
    return `My ${year} Journal`;
  } else {
    return `My Journal ${startDate.getFullYear()}-${endDate.getFullYear()}`;
  }
}

function redactSensitiveContent(content: string): string {
  // Simple redaction - in a real implementation, you'd use NLP or pattern matching
  return content
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED-CARD]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED-PHONE]');
}

function markdownToHTML(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function getMoodEmoji(mood: number): string {
  const moods = ['😢', '😕', '😐', '😊', '😄'];
  return moods[mood - 1] || '😐';
}
