"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Template, getTemplatesByCategory, fillTemplate } from "@/lib/templates";
import { Sparkles, X } from "lucide-react";

interface TemplateSelectorProps {
  category: Template['category'];
  onSelectTemplate: (template: Template) => void;
  trigger?: React.ReactNode;
}

export function TemplateSelector({ category, onSelectTemplate, trigger }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  
  const templates = getTemplatesByCategory(category);

  const extractVariables = (template: Template): string[] => {
    const variables = new Set<string>();
    const regex = /\{(\w+)\}/g;
    
    const checkString = (str: string) => {
      let match;
      while ((match = regex.exec(str)) !== null) {
        variables.add(match[1]);
      }
    };

    if (template.content.title) checkString(template.content.title);
    if (template.content.content_md) checkString(template.content.content_md);
    if (template.content.context_md) checkString(template.content.context_md);
    if (template.content.options_md) checkString(template.content.options_md);
    if (template.content.decision_md) checkString(template.content.decision_md);
    if (template.content.consequences_md) checkString(template.content.consequences_md);
    if (template.content.hypothesis) checkString(template.content.hypothesis);
    if (template.content.test_plan_md) checkString(template.content.test_plan_md);
    if (template.content.objective) checkString(template.content.objective);

    return Array.from(variables);
  };

  const handleTemplateSelect = (template: Template) => {
    const templateVariables = extractVariables(template);
    
    if (templateVariables.length === 0) {
      // No variables to fill, use template directly
      onSelectTemplate(template);
      setOpen(false);
      setSelectedTemplate(null);
    } else {
      // Show variable filling form
      setSelectedTemplate(template);
      const initialVariables: Record<string, string> = {};
      templateVariables.forEach(variable => {
        // Set some smart defaults
        if (variable === 'date') {
          initialVariables[variable] = new Date().toLocaleDateString();
        } else {
          initialVariables[variable] = '';
        }
      });
      setVariables(initialVariables);
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    const filledTemplate = fillTemplate(selectedTemplate, variables);
    onSelectTemplate(filledTemplate);
    setOpen(false);
    setSelectedTemplate(null);
    setVariables({});
  };

  const handleCancel = () => {
    setSelectedTemplate(null);
    setVariables({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Use Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? 'Customize Template' : 'Choose a Template'}
          </DialogTitle>
        </DialogHeader>
        
        {!selectedTemplate ? (
          // Template selection view
          <div className="space-y-4">
            <p className="text-gray-600">
              Get started quickly with a pre-built template for your {category}.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-2xl">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No templates available for {category} yet.
              </div>
            )}
          </div>
        ) : (
          // Variable filling view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <h3 className="font-medium">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Fill in the variables to customize your template:
              </p>
              
              {Object.keys(variables).map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable} className="capitalize">
                    {variable.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={variable}
                    value={variables[variable]}
                    onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Back to Templates
              </Button>
              <Button onClick={handleUseTemplate}>
                Use This Template
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
