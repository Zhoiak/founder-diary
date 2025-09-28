"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Crown, Heart, Brain, Zap, Shield, Flame,
  Sparkles, Target, Users, BookOpen, Activity,
  CheckCircle, ArrowRight, Shuffle
} from "lucide-react";

interface AnimalArchetype {
  id: string;
  name: string;
  animal_emoji: string;
  animal_icon: string;
  personality_traits: string[];
  strengths: string[];
  challenges: string[];
  motivation_style: string;
  preferred_reminder_style: string;
  optimal_session_length: number;
  best_time_of_day: string;
  primary_color: string;
  secondary_color: string;
  gradient_from: string;
  gradient_to: string;
  dopamine_triggers: string[];
  stress_indicators: string[];
  recovery_methods: string[];
}

interface UserArchetype {
  id: string;
  user_id: string;
  archetype_id: string;
  confidence_score: number;
  custom_traits: string[];
  adaptation_level: number;
  engagement_score: number;
  completion_rate: number;
  satisfaction_score: number;
  archetype: AnimalArchetype;
}

const iconMap: { [key: string]: any } = {
  crown: Crown,
  heart: Heart,
  brain: Brain,
  zap: Zap,
  shield: Shield,
  flame: Flame
};

export default function ArchetypeSelector() {
  const [userArchetype, setUserArchetype] = useState<UserArchetype | null>(null);
  const [availableArchetypes, setAvailableArchetypes] = useState<AnimalArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  useEffect(() => {
    loadArchetypeData();
  }, []);

  const loadArchetypeData = async () => {
    try {
      const res = await fetch('/api/user/archetype');
      if (res.ok) {
        const data = await res.json();
        setUserArchetype(data.userArchetype);
        setAvailableArchetypes(data.availableArchetypes || []);
      } else {
        toast.error('Failed to load archetype data');
      }
    } catch (error) {
      toast.error('Error loading archetype data');
    } finally {
      setLoading(false);
    }
  };

  const assignArchetype = async (archetypeId: string, isAuto = false) => {
    setAssigning(true);
    try {
      const res = await fetch('/api/user/archetype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isAuto ? 'auto_assign' : 'assign_archetype',
          archetype_id: archetypeId
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        await loadArchetypeData();
        setSelectedArchetype(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to assign archetype');
      }
    } catch (error) {
      toast.error('Error assigning archetype');
    } finally {
      setAssigning(false);
    }
  };

  const autoAssign = async () => {
    await assignArchetype('', true);
  };

  const getTraitColor = (trait: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[trait.length % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading your archetype...</span>
      </div>
    );
  }

  // Show current archetype if assigned
  if (userArchetype) {
    const archetype = userArchetype.archetype;
    const Icon = iconMap[archetype.animal_icon] || Target;

    return (
      <Card className={`border-0 shadow-lg bg-gradient-to-r ${archetype.gradient_from} ${archetype.gradient_to} text-white`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="text-4xl">{archetype.animal_emoji}</div>
            <div>
              <h3 className="text-2xl font-bold">You are a {archetype.name}!</h3>
              <p className="text-white/80">
                Confidence: {Math.round(userArchetype.confidence_score * 100)}%
              </p>
            </div>
            <Icon className="w-8 h-8 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personality Traits */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Your Personality Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {archetype.personality_traits.map((trait, index) => (
                <Badge key={index} className="bg-white/20 text-white border-white/30">
                  {trait.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Your Strengths
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {archetype.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3" />
                  {strength.replace('_', ' ')}
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Settings */}
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Personalized for You</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-80">Best Time:</span>
                <div className="font-semibold">{archetype.best_time_of_day}</div>
              </div>
              <div>
                <span className="opacity-80">Session Length:</span>
                <div className="font-semibold">{archetype.optimal_session_length} min</div>
              </div>
              <div>
                <span className="opacity-80">Motivation:</span>
                <div className="font-semibold">{archetype.motivation_style}</div>
              </div>
              <div>
                <span className="opacity-80">Reminder Style:</span>
                <div className="font-semibold">{archetype.preferred_reminder_style}</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {(userArchetype.engagement_score > 0 || userArchetype.completion_rate > 0) && (
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Your Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{Math.round(userArchetype.engagement_score * 100)}%</div>
                  <div className="text-xs opacity-80">Engagement</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(userArchetype.completion_rate * 100)}%</div>
                  <div className="text-xs opacity-80">Completion</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(userArchetype.satisfaction_score * 100)}%</div>
                  <div className="text-xs opacity-80">Satisfaction</div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => setUserArchetype(null)}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Change Archetype
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show archetype selection
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="text-2xl">🧬</div>
            Discover Your Animal Archetype
          </CardTitle>
          <CardDescription>
            Based on psychology and neuroscience, we'll personalize your experience to match your natural patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={autoAssign}
              disabled={assigning}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {assigning ? 'Analyzing...' : 'Auto-Detect My Archetype'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {/* Show manual selection */}}
            >
              <Users className="w-4 h-4 mr-2" />
              Choose Manually
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Archetypes */}
      {availableArchetypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableArchetypes.map((archetype) => {
            const Icon = iconMap[archetype.animal_icon] || Target;
            const isSelected = selectedArchetype === archetype.id;

            return (
              <Card 
                key={archetype.id} 
                className={`border-0 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedArchetype(isSelected ? null : archetype.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{archetype.animal_emoji}</div>
                      <div>
                        <CardTitle className="text-lg">{archetype.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {archetype.motivation_style} motivated
                        </CardDescription>
                      </div>
                    </div>
                    <Icon className="w-6 h-6" style={{ color: archetype.primary_color }} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Personality</h4>
                    <div className="flex flex-wrap gap-1">
                      {archetype.personality_traits.slice(0, 3).map((trait, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {trait.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Best For</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• {archetype.best_time_of_day} person</div>
                      <div>• {archetype.optimal_session_length} min sessions</div>
                      <div>• {archetype.preferred_reminder_style} reminders</div>
                    </div>
                  </div>

                  {isSelected && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        assignArchetype(archetype.id);
                      }}
                      disabled={assigning}
                      className="w-full"
                      style={{ 
                        background: `linear-gradient(to right, ${archetype.primary_color}, ${archetype.secondary_color})` 
                      }}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      {assigning ? 'Assigning...' : 'Choose This Archetype'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
