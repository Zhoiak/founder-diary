// Templates for quick content creation

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'log' | 'decision' | 'assumption' | 'risk' | 'goal';
  icon: string;
  content: {
    title?: string;
    content_md?: string;
    context_md?: string;
    options_md?: string;
    decision_md?: string;
    consequences_md?: string;
    hypothesis?: string;
    test_plan_md?: string;
    objective?: string;
    key_results?: Array<{ name: string; target: number; unit: string }>;
    tags?: string[];
    mood?: number;
  };
}

export const templates: Template[] = [
  // Daily Log Templates
  {
    id: 'daily-progress',
    name: 'Daily Progress',
    description: 'Track your daily achievements and blockers',
    category: 'log',
    icon: '📝',
    content: {
      title: 'Daily Progress - {date}',
      content_md: `## What I accomplished today
- 

## Challenges I faced
- 

## Tomorrow's priorities
- 

## Key insights
- `,
      tags: ['daily', 'progress'],
      mood: 4,
    }
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Document customer conversations and insights',
    category: 'log',
    icon: '💬',
    content: {
      title: 'Customer Feedback - {customer}',
      content_md: `## Customer: {customer}
**Company:** 
**Role:** 

## Key feedback
- 

## Pain points mentioned
- 

## Feature requests
- 

## Next steps
- `,
      tags: ['customer', 'feedback'],
      mood: 4,
    }
  },
  {
    id: 'investor-meeting',
    name: 'Investor Meeting',
    description: 'Capture investor conversations and follow-ups',
    category: 'log',
    icon: '💼',
    content: {
      title: 'Investor Meeting - {investor}',
      content_md: `## Investor: {investor}
**Fund:** 
**Stage Focus:** 

## Key discussion points
- 

## Questions they asked
- 

## Concerns raised
- 

## Next steps
- 

## Follow-up required
- `,
      tags: ['investor', 'meeting'],
      mood: 4,
    }
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Document product launches and results',
    category: 'log',
    icon: '🚀',
    content: {
      title: 'Product Launch - {feature}',
      content_md: `## Feature: {feature}
**Launch Date:** {date}

## What we launched
- 

## Initial metrics
- Users: 
- Engagement: 
- Feedback: 

## What went well
- 

## What could be improved
- 

## Next iterations
- `,
      tags: ['product', 'launch'],
      mood: 5,
    }
  },

  // Decision Templates (ADR)
  {
    id: 'tech-decision',
    name: 'Technical Decision',
    description: 'Document important technical architecture choices',
    category: 'decision',
    icon: '⚙️',
    content: {
      title: 'Use {technology} for {use_case}',
      context_md: `## Problem
We need to choose a technology for {use_case}.

## Requirements
- 
- 
- 

## Constraints
- Budget: 
- Timeline: 
- Team expertise: `,
      options_md: `## Option 1: {option1}
**Pros:**
- 
- 

**Cons:**
- 
- 

## Option 2: {option2}
**Pros:**
- 
- 

**Cons:**
- 
- `,
      decision_md: `We will use **{technology}** because:
- 
- 
- `,
      consequences_md: `## Positive consequences
- 
- 

## Negative consequences
- 
- 

## Mitigation strategies
- 
- `
    }
  },
  {
    id: 'business-decision',
    name: 'Business Decision',
    description: 'Document strategic business choices',
    category: 'decision',
    icon: '📊',
    content: {
      title: 'Decision to {decision}',
      context_md: `## Business context
Current situation and why this decision is needed.

## Market conditions
- 
- 

## Financial implications
- Revenue impact: 
- Cost impact: 
- Timeline: `,
      options_md: `## Option A: {optionA}
- Impact: 
- Risk: 
- Resources needed: 

## Option B: {optionB}
- Impact: 
- Risk: 
- Resources needed: `,
      decision_md: `We decided to **{decision}** based on:
- 
- 
- `,
      consequences_md: `## Expected outcomes
- 
- 

## Risks to monitor
- 
- 

## Success metrics
- 
- `
    }
  },

  // Assumption Templates
  {
    id: 'customer-assumption',
    name: 'Customer Assumption',
    description: 'Test assumptions about your customers',
    category: 'assumption',
    icon: '👥',
    content: {
      hypothesis: 'Our target customers {customer_segment} have problem {problem} and are willing to pay {price} for solution {solution}',
      test_plan_md: `## How to test this assumption

### Method 1: Customer interviews
- Target: 10 interviews with {customer_segment}
- Questions to ask:
  - 
  - 
  - 

### Method 2: Landing page test
- Create landing page describing {solution}
- Track conversion rate from visitor to email signup
- Target: >5% conversion rate

### Success criteria
- 
- 
- 

### Timeline
- Week 1: 
- Week 2: 
- Week 3: `
    }
  },
  {
    id: 'market-assumption',
    name: 'Market Assumption',
    description: 'Validate market size and opportunity assumptions',
    category: 'assumption',
    icon: '📈',
    content: {
      hypothesis: 'The market for {product_category} is {market_size} and growing at {growth_rate}% annually',
      test_plan_md: `## Research plan

### Primary research
- Survey {target_number} potential customers
- Interview {target_number} industry experts
- Analyze competitor pricing and positioning

### Secondary research
- Industry reports from {sources}
- Government data on {relevant_metrics}
- Academic studies on {relevant_topics}

### Success criteria
- Market size confirmed within 20% of estimate
- Growth rate confirmed within 5% of estimate
- At least 3 credible sources support our hypothesis

### Timeline
- Week 1: Secondary research
- Week 2: Primary research design
- Week 3: Data collection
- Week 4: Analysis and conclusion`
    }
  },

  // Risk Templates
  {
    id: 'technical-risk',
    name: 'Technical Risk',
    description: 'Identify and mitigate technical risks',
    category: 'risk',
    icon: '⚠️',
    content: {
      title: 'Risk: {technical_risk}',
      // probability and impact will be set in UI
    }
  },
  {
    id: 'market-risk',
    name: 'Market Risk',
    description: 'Track competitive and market risks',
    category: 'risk',
    icon: '🎯',
    content: {
      title: 'Risk: {market_risk}',
    }
  },

  // Goal Templates
  {
    id: 'growth-goal',
    name: 'Growth Goal',
    description: 'Set measurable growth objectives',
    category: 'goal',
    icon: '📈',
    content: {
      objective: 'Achieve {metric} growth in Q{quarter}',
      key_results: [
        { name: 'Increase monthly active users', target: 1000, unit: 'users' },
        { name: 'Improve retention rate', target: 80, unit: '%' },
        { name: 'Reduce churn rate', target: 5, unit: '%' }
      ]
    }
  },
  {
    id: 'revenue-goal',
    name: 'Revenue Goal',
    description: 'Set financial targets and milestones',
    category: 'goal',
    icon: '💰',
    content: {
      objective: 'Reach ${amount} in {timeframe}',
      key_results: [
        { name: 'Monthly Recurring Revenue', target: 10000, unit: 'USD' },
        { name: 'Customer Acquisition Cost', target: 100, unit: 'USD' },
        { name: 'Customer Lifetime Value', target: 1000, unit: 'USD' }
      ]
    }
  },
  {
    id: 'product-goal',
    name: 'Product Goal',
    description: 'Define product development objectives',
    category: 'goal',
    icon: '🛠️',
    content: {
      objective: 'Launch {feature} and achieve {success_metric}',
      key_results: [
        { name: 'Feature adoption rate', target: 60, unit: '%' },
        { name: 'User satisfaction score', target: 4.5, unit: '/5' },
        { name: 'Feature usage frequency', target: 3, unit: 'times/week' }
      ]
    }
  }
];

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(t => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function fillTemplate(template: Template, variables: Record<string, string>): Template {
  const filled = { ...template };
  
  // Replace variables in all string fields
  const replaceVariables = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  };

  if (filled.content.title) {
    filled.content.title = replaceVariables(filled.content.title);
  }
  if (filled.content.content_md) {
    filled.content.content_md = replaceVariables(filled.content.content_md);
  }
  if (filled.content.context_md) {
    filled.content.context_md = replaceVariables(filled.content.context_md);
  }
  if (filled.content.options_md) {
    filled.content.options_md = replaceVariables(filled.content.options_md);
  }
  if (filled.content.decision_md) {
    filled.content.decision_md = replaceVariables(filled.content.decision_md);
  }
  if (filled.content.consequences_md) {
    filled.content.consequences_md = replaceVariables(filled.content.consequences_md);
  }
  if (filled.content.hypothesis) {
    filled.content.hypothesis = replaceVariables(filled.content.hypothesis);
  }
  if (filled.content.test_plan_md) {
    filled.content.test_plan_md = replaceVariables(filled.content.test_plan_md);
  }
  if (filled.content.objective) {
    filled.content.objective = replaceVariables(filled.content.objective);
  }

  return filled;
}
