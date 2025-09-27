"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Heart } from "lucide-react";
import { type Project } from "@/types/project";

interface ModeSelectorProps {
  onModeChange?: (mode: 'founder' | 'personal', project: Project | null) => void;
  className?: string;
}

export function ModeSelector({ onModeChange, className }: ModeSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<'founder' | 'personal'>('founder');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      
      const projectList = data.projects || [];
      setProjects(projectList);
      
      // Auto-select Personal project if it exists, otherwise first project
      const personalProject = projectList.find((p: Project) => p.name === "Personal");
      const defaultProject = personalProject || projectList[0];
      
      if (defaultProject) {
        setSelectedProject(defaultProject.id);
        const mode = defaultProject.name === "Personal" ? 'personal' : 'founder';
        setCurrentMode(mode);
        onModeChange?.(mode, defaultProject);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      const mode = project.name === "Personal" ? 'personal' : 'founder';
      setCurrentMode(mode);
      onModeChange?.(mode, project);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mode Indicator */}
      <div className="flex items-center gap-2">
        {currentMode === 'personal' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg">
            <Heart className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-medium text-pink-700">Personal</span>
            {currentProject?.private_vault && (
              <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                🔒 Private
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Founder</span>
          </div>
        )}
      </div>

      {/* Project Selector */}
      <Select value={selectedProject} onValueChange={handleProjectChange}>
        <SelectTrigger className="w-48 bg-white/80 border-gray-200">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                {project.name === "Personal" ? (
                  <Heart className="w-4 h-4 text-pink-500" />
                ) : (
                  <Briefcase className="w-4 h-4 text-blue-500" />
                )}
                <span>{project.name}</span>
                {project.private_vault && (
                  <span className="text-xs">🔒</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
