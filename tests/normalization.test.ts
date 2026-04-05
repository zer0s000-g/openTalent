import { describe, it, expect } from 'vitest'

// Test normalization logic
function normalizeSkillName(name: string): string {
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function parseSkills(skillsStr?: string): string[] {
  if (!skillsStr || skillsStr.trim() === '') return []
  return skillsStr
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

describe('Normalization', () => {
  describe('normalizeSkillName', () => {
    it('should capitalize first letter of each word', () => {
      expect(normalizeSkillName('javascript')).toBe('Javascript')
      expect(normalizeSkillName('machine learning')).toBe('Machine Learning')
    })

    it('should trim whitespace', () => {
      expect(normalizeSkillName('  python  ')).toBe('Python')
    })

    it('should handle empty strings', () => {
      expect(normalizeSkillName('')).toBe('')
      expect(normalizeSkillName('   ')).toBe('')
    })
  })

  describe('parseSkills', () => {
    it('should parse semicolon-separated skills', () => {
      const result = parseSkills('Python;JavaScript;AWS')
      expect(result).toEqual(['Python', 'JavaScript', 'AWS'])
    })

    it('should trim whitespace from each skill', () => {
      const result = parseSkills('Python ; JavaScript ; AWS')
      expect(result).toEqual(['Python', 'JavaScript', 'AWS'])
    })

    it('should filter empty values', () => {
      const result = parseSkills('Python;;JavaScript;')
      expect(result).toEqual(['Python', 'JavaScript'])
    })

    it('should return empty array for undefined', () => {
      expect(parseSkills()).toEqual([])
    })

    it('should return empty array for empty string', () => {
      expect(parseSkills('')).toEqual([])
    })

    it('should handle multiple semicolons', () => {
      const result = parseSkills('Python;;;JavaScript;;;AWS')
      expect(result).toEqual(['Python', 'JavaScript', 'AWS'])
    })
  })
})
