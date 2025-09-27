"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Heart, Zap, Calendar, Camera, MapPin, Shield, 
  ArrowRight, ArrowLeft, CheckCircle, Sparkles,
  Clock, Target, BookOpen
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
}

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  onClose: () => void;
  projectId: string;
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-10 h-10 text-pink-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Personal Life OS!</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Let's set up your personal space in just 90 seconds. We'll help you create habits, 
          routines, and your first journal entry.
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>~90 seconds</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4" />
          <span>Private by default</span>
        </div>
      </div>
      <Button onClick={onNext} className="bg-pink-600 hover:bg-pink-700">
        Let's Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// Step 2: Choose Habits
function HabitsStep({ onNext, onData }: { onNext: () => void; onData: (data: any) => void }) {
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const suggestedHabits = [
    { id: 'morning-pages', title: 'Morning Pages', description: '3 pages of stream-of-consciousness writing', icon: '📝' },
    { id: 'meditation', title: 'Daily Meditation', description: '10 minutes of mindfulness', icon: '🧘' },
    { id: 'exercise', title: 'Exercise', description: '30 minutes of physical activity', icon: '💪' },
    { id: 'reading', title: 'Reading', description: '20 minutes of reading', icon: '📚' },
    { id: 'gratitude', title: 'Gratitude Practice', description: 'Write 3 things you\'re grateful for', icon: '🙏' },
    { id: 'water', title: 'Drink Water', description: '8 glasses throughout the day', icon: '💧' },
    { id: 'sleep', title: 'Good Sleep', description: '8 hours of quality sleep', icon: '😴' },
    { id: 'nature', title: 'Time in Nature', description: '15 minutes outdoors', icon: '🌳' }
  ];

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : prev.length < 3 
          ? [...prev, habitId] 
          : prev
    );
  };

  const handleNext = () => {
    onData({ selectedHabits: selectedHabits.map(id => suggestedHabits.find(h => h.id === id)) });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Choose 3 Habits to Track</h2>
        <p className="text-gray-600">
          Select habits that align with your goals. You can always add more later.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {suggestedHabits.map((habit) => (
          <Card 
            key={habit.id}
            className={`cursor-pointer transition-all ${
              selectedHabits.includes(habit.id)
                ? 'ring-2 ring-pink-500 bg-pink-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => toggleHabit(habit.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{habit.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{habit.description}</p>
                </div>
                {selectedHabits.includes(habit.id) && (
                  <CheckCircle className="w-5 h-5 text-pink-500 shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          Selected: {selectedHabits.length}/3
        </p>
        <Button 
          onClick={handleNext} 
          disabled={selectedHabits.length === 0}
          className="bg-pink-600 hover:bg-pink-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Activate Routines
function RoutinesStep({ onNext, onData }: { onNext: () => void; onData: (data: any) => void }) {
  const [enableMorning, setEnableMorning] = useState(true);
  const [enableEvening, setEnableEvening] = useState(true);

  const handleNext = () => {
    onData({ enableMorning, enableEvening });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Activate Your Routines</h2>
        <p className="text-gray-600">
          Structured reflection helps you start and end each day with intention.
        </p>
      </div>

      <div className="space-y-4">
        <Card 
          className={`cursor-pointer transition-all ${
            enableMorning ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
          }`}
          onClick={() => setEnableMorning(!enableMorning)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Morning Reflection</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Set intentions, express gratitude, and plan your day
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>• How are you feeling?</span>
                  <span>• What are you grateful for?</span>
                  <span>• Main intention for today?</span>
                </div>
              </div>
              {enableMorning && (
                <CheckCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            enableEvening ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
          }`}
          onClick={() => setEnableEvening(!enableEvening)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Evening Reflection</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Reflect on your day, celebrate wins, and prepare for tomorrow
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>• Day's highlight?</span>
                  <span>• What did you learn?</span>
                  <span>• How to improve tomorrow?</span>
                </div>
              </div>
              {enableEvening && (
                <CheckCircle className="w-6 h-6 text-purple-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleNext}
          className="bg-pink-600 hover:bg-pink-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: First Entry
function FirstEntryStep({ onNext, onData }: { onNext: () => void; onData: (data: any) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number>(3);
  const [location, setLocation] = useState("");
  const [useLocation, setUseLocation] = useState(false);

  const moodEmojis = ['😢', '😕', '😐', '😊', '😄'];
  const moodLabels = ['Terrible', 'Bad', 'Okay', 'Good', 'Amazing'];

  const handleNext = () => {
    onData({ 
      title: title || "My First Entry",
      content,
      mood,
      location: useLocation ? location : null
    });
    onNext();
  };

  const getCurrentLocation = () => {
    setUseLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Could not get location");
          setUseLocation(false);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your First Entry</h2>
        <p className="text-gray-600">
          Start your personal journal with a meaningful first entry.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Entry Title (Optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A great day to start journaling..."
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="content">What's on your mind?</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Today I'm starting my personal journal journey. I'm feeling excited about..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div>
          <Label>How are you feeling right now?</Label>
          <div className="flex items-center gap-2 mt-2">
            {moodEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => setMood(index + 1)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                  mood === index + 1
                    ? 'bg-pink-100 ring-2 ring-pink-500'
                    : 'hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {moodLabels[mood - 1]}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Location (Optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={useLocation}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {useLocation ? "Location Added" : "Add Location"}
            </Button>
          </div>
          {useLocation && (
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Current location..."
              className="mt-2"
            />
          )}
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleNext}
          disabled={!content.trim()}
          className="bg-pink-600 hover:bg-pink-700"
        >
          Create Entry
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: Privacy Explanation
function PrivacyStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Shield className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Privacy Matters</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your Personal project has the Private Vault enabled by default. This means:
        </p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left max-w-md mx-auto">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span>Sensitive content is encrypted at rest</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span>Only you can access your private entries</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span>Location data is anonymized in exports</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span>Photos are stored securely with EXIF stripped</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-gray-500">
        You can toggle the "Private" flag on individual entries for extra security.
      </p>

      <Button onClick={onNext} className="bg-green-600 hover:bg-green-700">
        Got It, Let's Finish!
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// Step 6: Completion
function CompletionStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-pink-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set! 🎉</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your Personal Life OS is ready. You now have habits to track, routines to follow, 
          and your first journal entry is saved.
        </p>
      </div>
      
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-pink-900 mb-3">What's Next?</h3>
        <ul className="space-y-2 text-sm text-pink-800 text-left">
          <li className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Check off your daily habits</span>
          </li>
          <li className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Complete your morning/evening routines</span>
          </li>
          <li className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Add more journal entries</span>
          </li>
        </ul>
      </div>

      <Button onClick={onComplete} className="bg-pink-600 hover:bg-pink-700">
        Start Using Your Personal OS
        <Heart className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

export function OnboardingWizard({ open, onComplete, onClose, projectId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: OnboardingStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Get started', icon: Heart, component: WelcomeStep },
    { id: 'habits', title: 'Habits', description: 'Choose 3 habits', icon: Zap, component: HabitsStep },
    { id: 'routines', title: 'Routines', description: 'Activate routines', icon: Calendar, component: RoutinesStep },
    { id: 'entry', title: 'First Entry', description: 'Create entry', icon: BookOpen, component: FirstEntryStep },
    { id: 'privacy', title: 'Privacy', description: 'Learn about security', icon: Shield, component: PrivacyStep },
    { id: 'complete', title: 'Complete', description: 'All done!', icon: Sparkles, component: CompletionStep }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (data: any) => {
    setOnboardingData((prev: any) => ({ ...prev, ...data }));
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);
    try {
      // Submit all onboarding data
      await submitOnboardingData();
      onComplete();
    } catch (error) {
      toast.error("Failed to complete onboarding");
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnboardingData = async () => {
    // Create habits
    if (onboardingData.selectedHabits) {
      for (const habit of onboardingData.selectedHabits) {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: habit.title,
            description: habit.description,
            target_per_week: 7
          })
        });
      }
    }

    // Update routines (they should already exist from seeding)
    // Just mark them as active/inactive based on user choice

    // Create first journal entry
    if (onboardingData.title || onboardingData.content) {
      await fetch("/api/personal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: onboardingData.title,
          content_md: onboardingData.content,
          mood: onboardingData.mood,
          location_name: onboardingData.location,
          date: new Date().toISOString().split('T')[0]
        })
      });
    }

    // Mark onboarding as completed
    await fetch("/api/user/onboarding-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId })
    });
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <currentStepData.icon className="w-5 h-5 text-pink-500" />
                {currentStepData.title}
              </DialogTitle>
              <Badge variant="outline">
                {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          <StepComponent 
            onNext={currentStep === steps.length - 1 ? completeOnboarding : nextStep}
            onData={updateData}
            onComplete={completeOnboarding}
          />
        </div>

        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex justify-start">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
