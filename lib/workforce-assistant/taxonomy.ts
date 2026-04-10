const capabilityTaxonomy = {
  'software programming': {
    aliases: [
      'software programming',
      'programming',
      'software development',
      'coding',
      'developer',
      'engineering',
    ],
    skills: [
      'Python',
      'TypeScript',
      'JavaScript',
      'React',
      'Node.js',
      'GraphQL',
      'Go',
      'Java',
      'SQL',
      'System Design',
      'PostgreSQL',
      'Docker',
      'Kubernetes',
      'Terraform',
      'AWS',
    ],
  },
  leadership: {
    aliases: ['leadership', 'leadership capability', 'leadership domain'],
    skills: [
      'Leadership',
      'Decision Making',
      'Mentorship',
      'Coaching',
      'Executive Presence',
      'Business Strategy',
      'Stakeholder Management',
      'Cross-Functional Collaboration',
    ],
  },
  'data analysis': {
    aliases: ['data analysis', 'analytics', 'data science', 'analysis'],
    skills: [
      'Data Analysis',
      'Python',
      'SQL',
      'Statistics',
      'Machine Learning',
      'Experimentation',
      'Forecasting',
      'MLOps',
    ],
  },
  'customer operations': {
    aliases: ['customer operations', 'customer success', 'customer support', 'customer domain'],
    skills: [
      'Customer Onboarding',
      'Renewals',
      'Account Management',
      'Relationship Building',
      'Escalation Management',
      'Communication',
      'Business Operations',
      'Program Management',
    ],
  },
  communication: {
    aliases: ['communication', 'stakeholder management', 'communication domain'],
    skills: [
      'Communication',
      'Stakeholder Management',
      'Cross-Functional Collaboration',
      'Negotiation',
      'Customer Discovery',
      'Relationship Building',
    ],
  },
} as const

export const capabilityDomains = Object.entries(capabilityTaxonomy).map(([domain, config]) => ({
  domain,
  aliases: [...config.aliases],
  skills: [...config.skills],
}))

export function resolveCapabilityDomain(message: string) {
  const normalized = message.trim().toLowerCase()

  for (const entry of capabilityDomains) {
    if (entry.aliases.some((alias) => normalized.includes(alias))) {
      return entry
    }
  }

  return null
}
