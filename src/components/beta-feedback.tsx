"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Star, Send } from "lucide-react";
import { submitBetaFeedback, type BetaFeedback } from "@/lib/beta-config";

interface BetaFeedbackProps {
  userId: string;
  cohortId: string;
  currentPage: string;
  className?: string;
}

export function BetaFeedback({ userId, cohortId, currentPage, className }: BetaFeedbackProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState<'bug' | 'feature' | 'improvement' | 'general'>('general');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !feedback.trim()) {
      toast.error("Please provide a rating and feedback");
      return;
    }

    setSubmitting(true);
    try {
      submitBetaFeedback({
        userId,
        cohortId,
        rating,
        feedback: feedback.trim(),
        category,
        page: currentPage
      });

      toast.success("Thank you for your feedback!");
      
      // Reset form
      setRating(0);
      setFeedback("");
      setCategory('general');
      setOpen(false);
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`fixed bottom-4 right-4 z-50 shadow-lg ${className}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Beta Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Beta Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Help us improve Diary+ by sharing your experience. Your feedback directly shapes the product!
            </p>
          </div>

          <div className="space-y-2">
            <Label>How would you rate your experience?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 rounded transition-colors ${
                    star <= rating 
                      ? 'text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Poor - needs significant improvement"}
                {rating === 2 && "Fair - some issues to address"}
                {rating === 3 && "Good - works well overall"}
                {rating === 4 && "Very good - minor improvements needed"}
                {rating === 5 && "Excellent - exceeds expectations"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience, what you liked, what could be improved..."
              rows={4}
            />
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>Page:</strong> {currentPage} • <strong>Cohort:</strong> {cohortId}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !rating || !feedback.trim()}
            >
              {submitting ? "Submitting..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
