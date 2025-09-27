"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  BookOpen, Download, FileText, Calendar, Camera, MapPin, 
  Heart, Shield, Trash2, Plus, Settings, Sparkles
} from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";

interface YearbookGeneration {
  id: string;
  title: string;
  format: 'pdf' | 'epub';
  start_date: string;
  end_date: string;
  entry_count: number;
  file_size: number;
  download_url: string;
  download_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

interface YearbookGeneratorProps {
  projectId: string;
  className?: string;
}

export function YearbookGenerator({ projectId, className }: YearbookGeneratorProps) {
  const [yearbooks, setYearbooks] = useState<YearbookGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [format, setFormat] = useState<'pdf' | 'epub'>('pdf');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [includeMood, setIncludeMood] = useState(true);
  const [redactSensitive, setRedactSensitive] = useState(false);
  const [coverStyle, setCoverStyle] = useState<'minimal' | 'elegant' | 'modern'>('elegant');

  useEffect(() => {
    fetchYearbooks();
    setDefaultDates();
  }, [projectId]);

  const setDefaultDates = () => {
    const today = new Date();
    const lastMonth = subMonths(today, 1);
    setEndDate(format(today, 'yyyy-MM-dd'));
    setStartDate(format(lastMonth, 'yyyy-MM-dd'));
  };

  const fetchYearbooks = async () => {
    try {
      const res = await fetch(`/api/yearbook?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch yearbooks");
      
      const data = await res.json();
      setYearbooks(data.yearbooks);
    } catch (error) {
      toast.error("Failed to load yearbooks");
      console.error("Error fetching yearbooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateYearbook = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/yearbook/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format,
          startDate,
          endDate,
          title: title || undefined,
          includePhotos,
          includeLocation,
          includeMood,
          redactSensitive,
          coverStyle
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate yearbook");
      }
      
      const data = await res.json();
      toast.success(`${format.toUpperCase()} yearbook generated successfully!`);
      
      // Reset form and close dialog
      setDialogOpen(false);
      setTitle('');
      setDefaultDates();
      
      // Refresh yearbooks list
      fetchYearbooks();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate yearbook");
      console.error("Error generating yearbook:", error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadYearbook = async (yearbook: YearbookGeneration) => {
    try {
      const filename = yearbook.download_url.split('/').pop();
      const res = await fetch(`/api/yearbook/download/${filename}`);
      
      if (!res.ok) throw new Error("Failed to download yearbook");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `yearbook.${yearbook.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Yearbook downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download yearbook");
      console.error("Error downloading yearbook:", error);
    }
  };

  const deleteYearbook = async (yearbookId: string) => {
    try {
      const res = await fetch(`/api/yearbook?id=${yearbookId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete yearbook");
      
      toast.success("Yearbook deleted successfully");
      fetchYearbooks();
    } catch (error) {
      toast.error("Failed to delete yearbook");
      console.error("Error deleting yearbook:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQuickDateRange = (range: string) => {
    const today = new Date();
    switch (range) {
      case 'last-week':
        return {
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'last-month':
        return {
          start: format(subMonths(today, 1), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'last-3-months':
        return {
          start: format(subMonths(today, 3), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'last-year':
        return {
          start: format(subYears(today, 1), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      default:
        return { start: startDate, end: endDate };
    }
  };

  const applyQuickRange = (range: string) => {
    const { start, end } = getQuickDateRange(range);
    setStartDate(start);
    setEndDate(end);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Year Book Generator
          </h2>
          <p className="text-gray-600 mt-1">
            Create beautiful PDF or EPUB books from your journal entries
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Generate Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Generate Your Year Book
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={(value: 'pdf' | 'epub') => setFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF (Printable)</SelectItem>
                        <SelectItem value="epub">EPUB (E-reader)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="coverStyle">Cover Style</Label>
                    <Select value={coverStyle} onValueChange={(value: 'minimal' | 'elegant' | 'modern') => setCoverStyle(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Book Title (Optional)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My 2024 Journal"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Date Range</h3>
                
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Last Week', value: 'last-week' },
                    { label: 'Last Month', value: 'last-month' },
                    { label: 'Last 3 Months', value: 'last-3-months' },
                    { label: 'Last Year', value: 'last-year' }
                  ].map(range => (
                    <Button
                      key={range.value}
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Content Options */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Content Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <Label htmlFor="includePhotos">Include Photos</Label>
                    </div>
                    <Switch
                      id="includePhotos"
                      checked={includePhotos}
                      onCheckedChange={setIncludePhotos}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <Label htmlFor="includeLocation">Include Location Data</Label>
                    </div>
                    <Switch
                      id="includeLocation"
                      checked={includeLocation}
                      onCheckedChange={setIncludeLocation}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <Label htmlFor="includeMood">Include Mood Data</Label>
                    </div>
                    <Switch
                      id="includeMood"
                      checked={includeMood}
                      onCheckedChange={setIncludeMood}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <Label htmlFor="redactSensitive">Redact Sensitive Information</Label>
                    </div>
                    <Switch
                      id="redactSensitive"
                      checked={redactSensitive}
                      onCheckedChange={setRedactSensitive}
                    />
                  </div>
                </div>

                {redactSensitive && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Sensitive information like credit card numbers, SSNs, emails, and phone numbers will be automatically redacted.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={generateYearbook} disabled={generating}>
                  {generating ? "Generating..." : `Generate ${format.toUpperCase()}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generated Yearbooks */}
      {yearbooks.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Year Books Yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first year book to compile your journal entries into a beautiful, downloadable format.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {yearbooks.map((yearbook) => (
            <Card key={yearbook.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{yearbook.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(yearbook.start_date).toLocaleDateString()} - {new Date(yearbook.end_date).toLocaleDateString()}
                        </span>
                        <span>{yearbook.entry_count} entries</span>
                        <span>{formatFileSize(yearbook.file_size)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="uppercase">
                      {yearbook.format}
                    </Badge>
                    <Badge 
                      variant={yearbook.status === 'completed' ? 'default' : 'secondary'}
                      className={yearbook.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                    >
                      {yearbook.status}
                    </Badge>
                    {yearbook.download_count > 0 && (
                      <span className="text-xs text-gray-500">
                        Downloaded {yearbook.download_count} times
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadYearbook(yearbook)}
                        disabled={yearbook.status !== 'completed'}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteYearbook(yearbook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
