"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, ExternalLink, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface PublicUpdate {
  id: string;
  month: number;
  year: number;
  content_md: string;
  ai_summary?: string;
  created_at: string;
  project: {
    name: string;
    slug: string;
  };
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PublicUpdatePage({ params }: { params: { slug: string } }) {
  const [update, setUpdate] = useState<PublicUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdate();
  }, [params.slug]);

  const fetchUpdate = async () => {
    try {
      const res = await fetch(`/api/public/updates/${params.slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Update not found or not publicly accessible");
        } else {
          throw new Error("Failed to fetch update");
        }
        return;
      }
      const data = await res.json();
      setUpdate(data.update);
    } catch (err: any) {
      setError(err.message || "Failed to load update");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !update) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Update Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              {error || "This update doesn't exist or is not publicly accessible."}
            </p>
            <Link href="/">
              <Button>
                Go to Founder Diary
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{update.project.name}</h1>
              <p className="text-gray-600">Monthly Investor Update</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Powered by Founder Diary
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                  {monthNames[update.month - 1]} {update.year} Update
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2 text-base">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Published: {new Date(update.created_at).toLocaleDateString()}
                  </span>
                  {update.ai_summary && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Enhanced
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {update.ai_summary && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Summary
                </h4>
                <p className="text-purple-800 text-sm">{update.ai_summary}</p>
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {update.content_md}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <span>This update was created with</span>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Founder Diary
            </Link>
            <span>- Track your startup journey</span>
          </div>
        </div>
      </main>
    </div>
  );
}
