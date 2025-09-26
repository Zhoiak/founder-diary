"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle, ArrowRight, ArrowLeft, Rocket, Target, BookOpen, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: OnboardingStep[] = [
  {
    id: "project",
    title: "Create Your Project",
    description: "Give your startup a name and get started",
    icon: Rocket,
  },
  {
    id: "goal",
    title: "Set Your First Goal",
    description: "Define what you want to achieve this quarter",
    icon: Target,
  },
  {
    id: "log",
    title: "Write Your First Log",
    description: "Document what you're working on today",
    icon: BookOpen,
  },
  {
    id: "reminder",
    title: "Stay Consistent",
    description: "Set up daily reminders to keep logging",
    icon: Bell,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Form data for each step
  const [projectData, setProjectData] = useState({ name: "" });
  const [goalData, setGoalData] = useState({ 
    objective: "", 
    keyResults: [{ name: "", target: "" }] 
  });
  const [logData, setLogData] = useState({ 
    title: "", 
    content: "", 
    mood: 4,
    tags: ["onboarding"] 
  });
  const [reminderData, setReminderData] = useState({ 
    enabled: true, 
    time: "19:00" 
  });

  const [createdProjectId, setCreatedProjectId] = useState<string>("");

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = async () => {
    if (currentStep === 0) {
      await createProject();
    } else if (currentStep === 1) {
      await createGoal();
    } else if (currentStep === 2) {
      await createLog();
    } else if (currentStep === 3) {
      await setupReminder();
    }
  };

  const createProject = async () => {
    if (!projectData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectData.name }),
      });
      
      if (!res.ok) throw new Error("Failed to create project");
      
      const data = await res.json();
      setCreatedProjectId(data.project.id);
      setCompletedSteps([...completedSteps, "project"]);
      setCurrentStep(1);
      toast.success("Project created! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!goalData.objective.trim()) {
      toast.error("Please enter a goal objective");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: createdProjectId,
          objective: goalData.objective,
          key_results: goalData.keyResults
            .filter(kr => kr.name.trim())
            .map(kr => ({
              name: kr.name,
              target: kr.target ? parseFloat(kr.target) : 100,
              unit: "units",
            })),
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create goal");
      
      setCompletedSteps([...completedSteps, "goal"]);
      setCurrentStep(2);
      toast.success("Goal set! 🎯");
    } catch (err: any) {
      toast.error(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  const createLog = async () => {
    if (!logData.title.trim()) {
      toast.error("Please enter a log title");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: createdProjectId,
          date: new Date().toISOString().split('T')[0],
          title: logData.title,
          content_md: logData.content,
          mood: logData.mood,
          tags: logData.tags,
          time_spent_minutes: 30, // Default 30 minutes
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create log");
      
      setCompletedSteps([...completedSteps, "log"]);
      setCurrentStep(3);
      toast.success("First log created! 📝");
    } catch (err: any) {
      toast.error(err.message || "Failed to create log");
    } finally {
      setLoading(false);
    }
  };

  const setupReminder = async () => {
    // For now, just mark as complete and redirect
    // In production, you'd integrate with email service or push notifications
    setCompletedSteps([...completedSteps, "reminder"]);
    toast.success("You're all set! Welcome to Founder Diary! 🚀");
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addKeyResult = () => {
    setGoalData({
      ...goalData,
      keyResults: [...goalData.keyResults, { name: "", target: "" }]
    });
  };

  const updateKeyResult = (index: number, field: string, value: string) => {
    const updated = [...goalData.keyResults];
    updated[index] = { ...updated[index], [field]: value };
    setGoalData({ ...goalData, keyResults: updated });
  };

  const removeKeyResult = (index: number) => {
    setGoalData({
      ...goalData,
      keyResults: goalData.keyResults.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Founder Diary</h1>
          <p className="text-gray-600 mb-6">Let's get you set up in just 90 seconds</p>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-gray-500 mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Step Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Create Project */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name" className="text-base font-medium">
                    What's your startup called?
                  </Label>
                  <Input
                    id="project-name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ name: e.target.value })}
                    placeholder="e.g., My Amazing Startup"
                    className="mt-2 text-lg"
                    autoFocus
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> You can create multiple projects later for different ventures or side projects.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Create Goal */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective" className="text-base font-medium">
                    What's your main objective this quarter?
                  </Label>
                  <Input
                    id="objective"
                    value={goalData.objective}
                    onChange={(e) => setGoalData({ ...goalData, objective: e.target.value })}
                    placeholder="e.g., Launch MVP and get first 100 users"
                    className="mt-2 text-lg"
                    autoFocus
                  />
                </div>
                
                <div>
                  <Label className="text-base font-medium">Key Results (optional)</Label>
                  <p className="text-sm text-gray-600 mb-3">How will you measure success?</p>
                  {goalData.keyResults.map((kr, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={kr.name}
                        onChange={(e) => updateKeyResult(index, "name", e.target.value)}
                        placeholder="e.g., Get 100 signups"
                        className="flex-1"
                      />
                      <Input
                        value={kr.target}
                        onChange={(e) => updateKeyResult(index, "target", e.target.value)}
                        placeholder="100"
                        className="w-20"
                        type="number"
                      />
                      {goalData.keyResults.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeKeyResult(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addKeyResult}
                    className="mt-2"
                  >
                    + Add Key Result
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Create Log */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="log-title" className="text-base font-medium">
                    What did you work on today?
                  </Label>
                  <Input
                    id="log-title"
                    value={logData.title}
                    onChange={(e) => setLogData({ ...logData, title: e.target.value })}
                    placeholder="e.g., Built user authentication system"
                    className="mt-2 text-lg"
                    autoFocus
                  />
                </div>
                
                <div>
                  <Label htmlFor="log-content" className="text-base font-medium">
                    Any details? (optional)
                  </Label>
                  <Textarea
                    id="log-content"
                    value={logData.content}
                    onChange={(e) => setLogData({ ...logData, content: e.target.value })}
                    placeholder="Share your progress, challenges, or insights..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How are you feeling? 😊</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((mood) => (
                      <Button
                        key={mood}
                        type="button"
                        variant={logData.mood === mood ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLogData({ ...logData, mood })}
                      >
                        {"😊".repeat(mood)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Setup Reminder */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold mb-2">You're almost done!</h3>
                  <p className="text-gray-600 mb-6">
                    Consistency is key to building a successful startup. 
                    Daily logging helps you track progress and stay motivated.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ What you've accomplished:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Created your project: "{projectData.name}"</li>
                    <li>• Set your first goal: "{goalData.objective}"</li>
                    <li>• Wrote your first log: "{logData.title}"</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">🚀 Next steps:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Log daily progress (even just 2-3 sentences)</li>
                    <li>• Generate weekly reviews to reflect on your journey</li>
                    <li>• Update your goals as you make progress</li>
                    <li>• Use analytics to track your patterns</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  "Loading..."
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Complete
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full ${
                index <= currentStep
                  ? "bg-blue-600"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
