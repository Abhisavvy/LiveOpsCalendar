'use client'

import Papa from 'papaparse'
import { addDays, format } from 'date-fns'
import type { TemplateType } from '../config/ExcelTemplates'

// CSV Template Configuration
export interface CsvTemplateConfig {
  name: string
  description: string
  filename: string
  columns: CsvColumnDefinition[]
  sampleRows: number
  includeValidationExamples?: boolean
  mixedDateStrategy?: 'current' | 'future' | 'mixed' | 'placeholder'
}

export interface CsvColumnDefinition {
  header: string
  key: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'enum'
  required: boolean
  description?: string
  examples?: string[]
  validValues?: string[]
  format?: string
  placeholder?: string
}

// Sample data pools for realistic examples
const SAMPLE_DATA = {
  // Event titles by category
  titles: {
    seasonal: [
      'Spring Blossom Festival 2024',
      'Summer Beach Party',
      'Halloween Horror Nights',
      'Winter Wonderland Event',
      'Valentine\'s Love Quest',
      'New Year Celebration',
      'Easter Egg Hunt',
      'Autumn Harvest Festival'
    ],
    retention: [
      'Welcome Back Warrior',
      'Comeback Champion Challenge',
      '7-Day Return Bonus',
      'Veteran Player Appreciation',
      'Daily Login Streaks',
      'Missing You Rewards',
      'Long Time No See',
      'Player Reunion Event'
    ],
    monetization: [
      'First Purchase Bonus',
      'Premium Upgrade Sale',
      'VIP Weekend Special',
      'Spending Milestone Rewards',
      'Flash Sale Extravaganza',
      'Bundle Builder Event',
      'Luxury Item Preview',
      'High Roller Tournament'
    ],
    progression: [
      'Level Up Celebration',
      'Achievement Hunter',
      'Skill Mastery Challenge',
      'Milestone Madness',
      'Progress Accelerator',
      'Elite Player Trials',
      'Advancement Rewards',
      'Champion\'s Journey'
    ],
    abTesting: [
      'UI Variant A Test',
      'Pricing Model B',
      'Feature Toggle C',
      'Onboarding Flow D',
      'Reward System E',
      'Tutorial Path F',
      'Engagement Test G',
      'Conversion Study H'
    ],
    comprehensive: [
      'Grand Opening Celebration',
      'Community Challenge',
      'Global Tournament',
      'Special Operations',
      'Limited Time Offer',
      'Exclusive Content Drop',
      'Player Appreciation Day',
      'Anniversary Spectacular'
    ]
  },

  // Event types
  eventTypes: [
    'Seasonal', 'IAP', 'Retention', 'Progression', 'System', 'A/B Test', 'Unknown'
  ],

  // Cohorts/Audiences
  cohorts: [
    'All', 'New Users', 'Veteran Players', 'Premium Users', 'Free Users', 
    'High Spenders', 'Churned Users', 'Active Players', 'Weekly Actives'
  ],

  // Durations
  durations: ['1h', '6h', '12h', '1d', '3d', '1w', '2w', '1m'],

  // Placements
  placements: [
    'Main Menu', 'Store', 'Post-Battle', 'Login Screen', 'Notification', 
    'Email', 'Push', 'In-Game Banner', 'Lobby', 'Settings'
  ],

  // Statuses
  statuses: ['Draft', 'Scheduled', 'Active', 'Paused', 'Completed', 'Cancelled'],

  // Priorities
  priorities: ['Low', 'Medium', 'High', 'Critical'],

  // Regions
  regions: ['Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],

  // Holidays
  holidays: [
    'New Year', 'Valentine\'s Day', 'Easter', 'Summer Solstice', 'Halloween', 
    'Thanksgiving', 'Christmas', 'Lunar New Year', 'Diwali', 'Ramadan'
  ],

  // Content types
  contentTypes: ['Cosmetics', 'Characters', 'Levels', 'Items', 'Currency', 'Discounts', 'Bundles'],

  // Target behaviors
  targetBehaviors: [
    'Daily Login', 'Session Extension', 'Social Sharing', 'Tutorial Completion', 
    'Level Progression', 'First Purchase', 'Return After 7 Days'
  ],

  // Reward types
  rewardTypes: [
    'Currency', 'Items', 'Characters', 'Cosmetics', 'Premium Currency', 'XP Boost', 'Time Skip'
  ],

  // Frequencies
  frequencies: ['One-time', 'Daily', 'Weekly', 'Per Session', 'On Achievement'],

  // Metrics
  metrics: [
    'Day 1 Retention', 'Day 7 Retention', 'Day 30 Retention', 'Session Length', 
    'Sessions per Day', 'ARPDAU', 'Conversion Rate', 'Revenue per User'
  ],

  // Progression types
  progressionTypes: [
    'Player Level', 'Skill Tree', 'Battle Pass', 'Collection', 'Achievement', 
    'Story Progress', 'Leaderboard'
  ]
}

// Utility functions for generating realistic data
class CsvDataGenerator {
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)] as T
  }

  private static getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, array.length))
  }

  static generateDate(strategy: string, baseDate = new Date(), offset = 0): string {
    switch (strategy) {
      case 'current':
        return format(addDays(baseDate, offset), 'yyyy-MM-dd')
      case 'future':
        return format(addDays(baseDate, 30 + offset * 7), 'yyyy-MM-dd')
      case 'mixed':
        const variation = Math.random() < 0.5 ? -7 : 30
        return format(addDays(baseDate, variation + offset * 7), 'yyyy-MM-dd')
      case 'placeholder':
        return '2024-MM-DD'
      default:
        return format(addDays(baseDate, offset), 'yyyy-MM-dd')
    }
  }

  static generateTitle(category: keyof typeof SAMPLE_DATA.titles, index: number): string {
    const titles = SAMPLE_DATA.titles[category] || SAMPLE_DATA.titles.comprehensive
    return titles[index % titles.length] || titles[0] || 'Default Event Title'
  }

  static generateDescription(category: string, title: string): string {
    const descriptions: Record<string, string> = {
      seasonal: `Join us for ${title}! Experience themed content, exclusive rewards, and limited-time activities celebrating the season.`,
      retention: `Welcome back! ${title} offers special rewards for returning players with escalating bonuses for continued engagement.`,
      monetization: `Don't miss ${title}! Special pricing, exclusive bundles, and premium rewards available for a limited time.`,
      progression: `Level up with ${title}! Accelerated progression, milestone rewards, and exclusive content for advancing players.`,
      abTesting: `Experimental feature: ${title}. This test compares different approaches to optimize player experience.`,
      comprehensive: `Experience ${title}! A comprehensive event featuring diverse activities, rewards, and engagement opportunities.`
    }
    return descriptions[category] || descriptions.comprehensive || `Description for ${title}`
  }

  static generateNumericRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  static generatePrice(): string {
    const prices = ['0.99', '2.99', '4.99', '9.99', '19.99', '49.99', '99.99']
    return this.getRandomItem(prices)
  }

  static generatePercentage(): string {
    return `${this.generateNumericRange(10, 50)}`
  }
}

// CSV Template definitions for each scenario
export const CSV_TEMPLATES: Record<TemplateType, CsvTemplateConfig> = {
  comprehensive: {
    name: 'Comprehensive Live Ops Events',
    description: 'Complete template with all available fields for maximum flexibility',
    filename: 'comprehensive_liveops_template',
    sampleRows: 12,
    mixedDateStrategy: 'mixed',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true, 
        description: 'Descriptive name for the event', placeholder: 'Spring Festival 2024' },
      { header: 'Event Type', key: 'eventType', type: 'enum', required: true,
        validValues: SAMPLE_DATA.eventTypes, description: 'Category for filtering and analytics' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD',
        description: 'When the event becomes active' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations, description: 'How long the event runs' },
      { header: 'Target Cohort', key: 'cohort', type: 'enum', required: true,
        validValues: SAMPLE_DATA.cohorts, description: 'Player segment for this event' },
      { header: 'Placement', key: 'placement', type: 'enum', required: false,
        validValues: SAMPLE_DATA.placements, description: 'Where in game this appears' },
      { header: 'Description', key: 'description', type: 'text', required: false,
        description: 'Detailed event information and mechanics' },
      { header: 'Status', key: 'status', type: 'enum', required: true,
        validValues: SAMPLE_DATA.statuses, description: 'Current event state' },
      { header: 'Priority', key: 'priority', type: 'enum', required: false,
        validValues: SAMPLE_DATA.priorities, description: 'Development priority level' },
      { header: 'Estimated Participants', key: 'estimatedParticipants', type: 'number', required: false,
        description: 'Expected player engagement count' },
      { header: 'Budget ($)', key: 'budget', type: 'number', required: false,
        description: 'Allocated development and marketing budget' },
      { header: 'Owner', key: 'owner', type: 'text', required: false,
        description: 'Team member responsible for execution' },
      { header: 'Dependencies', key: 'dependencies', type: 'text', required: false,
        description: 'Other events or features this depends on' }
    ]
  },

  seasonal: {
    name: 'Seasonal Events Calendar',
    description: 'Holiday and seasonal campaign planning template',
    filename: 'seasonal_events_template',
    sampleRows: 8,
    mixedDateStrategy: 'future',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true,
        placeholder: 'Halloween Horror Nights 2024' },
      { header: 'Event Type', key: 'eventType', type: 'enum', required: true,
        validValues: ['Seasonal'], description: 'Set to Seasonal for this template' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations },
      { header: 'Target Cohort', key: 'cohort', type: 'enum', required: true,
        validValues: SAMPLE_DATA.cohorts },
      { header: 'Holiday/Season', key: 'holiday', type: 'enum', required: false,
        validValues: SAMPLE_DATA.holidays, description: 'Associated holiday or seasonal theme' },
      { header: 'Target Region', key: 'region', type: 'enum', required: false,
        validValues: SAMPLE_DATA.regions, description: 'Geographic focus for cultural relevance' },
      { header: 'Visual Theme', key: 'theme', type: 'text', required: false,
        description: 'Art style, colors, and visual elements' },
      { header: 'Content Type', key: 'contentType', type: 'enum', required: false,
        validValues: SAMPLE_DATA.contentTypes, description: 'Type of seasonal content offered' },
      { header: 'Description', key: 'description', type: 'text', required: false,
        description: 'Seasonal event details and special mechanics' }
    ]
  },

  monetization: {
    name: 'Monetization & IAP Events',
    description: 'Revenue-focused template for purchase promotions and pricing strategies',
    filename: 'monetization_iap_template', 
    sampleRows: 10,
    mixedDateStrategy: 'mixed',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true,
        placeholder: 'First Purchase Bonus Weekend' },
      { header: 'Event Type', key: 'eventType', type: 'enum', required: true,
        validValues: ['IAP'], description: 'Set to IAP for monetization events' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations },
      { header: 'Target Cohort', key: 'cohort', type: 'enum', required: true,
        validValues: SAMPLE_DATA.cohorts },
      { header: 'Revenue Goal ($)', key: 'revenueGoal', type: 'number', required: false,
        description: 'Target revenue for this promotion' },
      { header: 'Discount %', key: 'discountPercent', type: 'number', required: false,
        description: 'Percentage discount (0-100)' },
      { header: 'Bundle Contents', key: 'bundleContents', type: 'text', required: false,
        description: 'Items included in promotional bundles' },
      { header: 'Price Point ($)', key: 'pricePoint', type: 'number', required: false,
        description: 'Final price after discounts' },
      { header: 'Conversion Goal %', key: 'conversionGoal', type: 'number', required: false,
        description: 'Target conversion rate percentage' },
      { header: 'Description', key: 'description', type: 'text', required: false,
        description: 'Monetization strategy and offer details' }
    ]
  },

  retention: {
    name: 'Retention & Engagement Events',
    description: 'Player comeback and engagement campaign template',
    filename: 'retention_engagement_template',
    sampleRows: 8,
    mixedDateStrategy: 'current',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true,
        placeholder: 'Welcome Back Champion' },
      { header: 'Event Type', key: 'eventType', type: 'enum', required: true,
        validValues: ['Retention'], description: 'Set to Retention for comeback events' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations },
      { header: 'Target Cohort', key: 'cohort', type: 'enum', required: true,
        validValues: SAMPLE_DATA.cohorts },
      { header: 'Target Behavior', key: 'targetBehavior', type: 'enum', required: true,
        validValues: SAMPLE_DATA.targetBehaviors, description: 'Player action this event encourages' },
      { header: 'Reward Type', key: 'rewardType', type: 'enum', required: false,
        validValues: SAMPLE_DATA.rewardTypes, description: 'Type of reward for engagement' },
      { header: 'Frequency', key: 'frequency', type: 'enum', required: false,
        validValues: SAMPLE_DATA.frequencies, description: 'How often players can claim rewards' },
      { header: 'Key Metric', key: 'retentionMetric', type: 'enum', required: false,
        validValues: SAMPLE_DATA.metrics, description: 'Primary retention metric to improve' },
      { header: 'Description', key: 'description', type: 'text', required: false,
        description: 'Retention strategy and reward mechanics' }
    ]
  },

  abTesting: {
    name: 'A/B Testing Events',
    description: 'Experimental template for controlled tests and optimization studies',
    filename: 'ab_testing_template',
    sampleRows: 6,
    mixedDateStrategy: 'future',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true,
        placeholder: 'UI Layout Test A vs B' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations },
      { header: 'Hypothesis', key: 'hypothesis', type: 'text', required: true,
        description: 'Testable prediction of expected outcome' },
      { header: 'Variants', key: 'variants', type: 'text', required: true,
        description: 'Description of A and B variants being tested' },
      { header: 'Sample Size', key: 'sampleSize', type: 'number', required: false,
        description: 'Number of users per variant' },
      { header: 'Primary Metric', key: 'primaryMetric', type: 'enum', required: true,
        validValues: SAMPLE_DATA.metrics, description: 'Main success metric for the test' },
      { header: 'Significance %', key: 'significance', type: 'enum', required: false,
        validValues: ['90', '95', '99'], description: 'Statistical significance threshold' },
      { header: 'Results', key: 'results', type: 'text', required: false,
        description: 'Test outcome and decisions made' }
    ]
  },

  progression: {
    name: 'Progression Events',
    description: 'Player advancement template for level-up campaigns and milestone rewards',
    filename: 'progression_events_template',
    sampleRows: 8,
    mixedDateStrategy: 'mixed',
    includeValidationExamples: true,
    columns: [
      { header: 'Event Title', key: 'title', type: 'text', required: true,
        placeholder: 'Level Up Celebration Week' },
      { header: 'Event Type', key: 'eventType', type: 'enum', required: true,
        validValues: ['Progression'], description: 'Set to Progression for advancement events' },
      { header: 'Start Date', key: 'startDate', type: 'date', required: true, format: 'YYYY-MM-DD' },
      { header: 'Duration', key: 'duration', type: 'enum', required: true,
        validValues: SAMPLE_DATA.durations },
      { header: 'Target Cohort', key: 'cohort', type: 'enum', required: true,
        validValues: SAMPLE_DATA.cohorts },
      { header: 'Progression Type', key: 'progressionType', type: 'enum', required: true,
        validValues: SAMPLE_DATA.progressionTypes, description: 'Type of progression this affects' },
      { header: 'Milestones', key: 'milestones', type: 'text', required: false,
        description: 'Key progression thresholds with rewards' },
      { header: 'XP Boost (x)', key: 'boostMultiplier', type: 'number', required: false,
        description: 'Experience multiplier during event' },
      { header: 'Requirements', key: 'requirements', type: 'text', required: false,
        description: 'Prerequisites to participate' },
      { header: 'Description', key: 'description', type: 'text', required: false,
        description: 'Progression mechanics and reward structure' }
    ]
  }
}

/**
 * Advanced CSV Generator for Live Ops Templates
 */
export class AdvancedCsvGenerator {
  /**
   * Generate CSV template with sample data
   */
  static generateTemplate(templateType: TemplateType): string {
    const config = CSV_TEMPLATES[templateType]
    if (!config) {
      throw new Error(`Template type "${templateType}" not found`)
    }

    // Generate header row
    const headers = config.columns.map(col => col.header)

    // Generate sample rows
    const rows: string[][] = []
    
    for (let i = 0; i < config.sampleRows; i++) {
      const row = config.columns.map(col => 
        this.generateCellValue(col, templateType, i, config.mixedDateStrategy || 'mixed')
      )
      rows.push(row)
    }

    // Add validation examples if requested
    if (config.includeValidationExamples && config.sampleRows < 15) {
      const validationRows = this.generateValidationExamples(config, templateType)
      rows.push(...validationRows)
    }

    // Convert to CSV
    const allRows = [headers, ...rows]
    return Papa.unparse(allRows, {
      quotes: true,
      quoteChar: '"',
      delimiter: ',',
      header: false
    })
  }

  /**
   * Generate cell value based on column definition
   */
  private static generateCellValue(
    column: CsvColumnDefinition, 
    templateType: TemplateType, 
    rowIndex: number,
    dateStrategy: string
  ): string {
    switch (column.key) {
      // Special handling for common fields
      case 'title':
        return CsvDataGenerator.generateTitle(templateType as keyof typeof SAMPLE_DATA.titles, rowIndex)
      
      case 'description':
        const title = CsvDataGenerator.generateTitle(templateType as keyof typeof SAMPLE_DATA.titles, rowIndex)
        return CsvDataGenerator.generateDescription(templateType, title) || `Description for ${title}`
      
      case 'startDate':
        return CsvDataGenerator.generateDate(dateStrategy, new Date(), rowIndex)
      
      case 'budget':
      case 'revenueGoal':
      case 'pricePoint':
        return CsvDataGenerator.generatePrice()
      
      case 'discountPercent':
      case 'conversionGoal':
      case 'significance':
        return CsvDataGenerator.generatePercentage()
      
      case 'estimatedParticipants':
        return CsvDataGenerator.generateNumericRange(1000, 50000).toString()
      
      case 'sampleSize':
        return CsvDataGenerator.generateNumericRange(500, 5000).toString()
      
      case 'boostMultiplier':
        return `${1.5 + (rowIndex * 0.5)}`

      // Generic field handling
      default:
        return this.generateGenericValue(column, rowIndex)
    }
  }

  /**
   * Generate value based on column type and configuration
   */
  private static generateGenericValue(column: CsvColumnDefinition, rowIndex: number): string {
    if (column.validValues && column.validValues.length > 0) {
      return column.validValues[rowIndex % column.validValues.length] || ''
    }

    if (column.examples && column.examples.length > 0) {
      return column.examples[rowIndex % column.examples.length] || ''
    }

    switch (column.type) {
      case 'date':
        return CsvDataGenerator.generateDate('mixed', new Date(), rowIndex)
      
      case 'number':
        return CsvDataGenerator.generateNumericRange(1, 100).toString()
      
      case 'boolean':
        return rowIndex % 2 === 0 ? 'true' : 'false'
      
      case 'text':
        return column.placeholder || `Sample ${column.header} ${rowIndex + 1}`
      
      default:
        return column.placeholder || `Default ${column.header} ${rowIndex + 1}`
    }
  }

  /**
   * Generate validation examples showing correct and incorrect formats
   */
  private static generateValidationExamples(
    config: CsvTemplateConfig, 
    templateType: TemplateType
  ): string[][] {
    const examples: string[][] = []
    
    // Add one row showing common mistakes
    const errorRow = config.columns.map(col => {
      switch (col.key) {
        case 'startDate':
          return 'Invalid Date' // Common error: wrong format
        case 'eventType':
          return 'InvalidType' // Common error: not in valid values
        case 'duration':
          return '5 days' // Common error: not using standard format
        case 'title':
          return '' // Common error: empty required field
        default:
          return this.generateGenericValue(col, 0)
      }
    })
    
    examples.push(errorRow)
    
    // Add one row showing perfect formatting
    const perfectRow = config.columns.map(col => 
      this.generateCellValue(col, templateType, 0, 'future')
    )
    
    examples.push(perfectRow)
    
    return examples
  }

  /**
   * Generate downloadable CSV file blob
   */
  static generateBlob(templateType: TemplateType): Blob {
    const csv = this.generateTemplate(templateType)
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  }

  /**
   * Trigger download of CSV template
   */
  static downloadTemplate(templateType: TemplateType): void {
    const config = CSV_TEMPLATES[templateType]
    if (!config) {
      throw new Error(`Template type "${templateType}" not found`)
    }
    
    const blob = this.generateBlob(templateType)
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${config.filename}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Get template metadata for UI display
   */
  static getTemplateInfo(templateType: TemplateType) {
    const config = CSV_TEMPLATES[templateType]
    if (!config) return null

    return {
      name: config.name,
      description: config.description,
      filename: config.filename,
      columnCount: config.columns.length,
      sampleRowCount: config.sampleRows,
      requiredFields: config.columns.filter(col => col.required).length,
      optionalFields: config.columns.filter(col => !col.required).length,
      dateStrategy: config.mixedDateStrategy,
      hasValidationExamples: config.includeValidationExamples
    }
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): Record<TemplateType, ReturnType<typeof AdvancedCsvGenerator.getTemplateInfo>> {
    const templates = {} as Record<TemplateType, ReturnType<typeof AdvancedCsvGenerator.getTemplateInfo>>
    
    ;(Object.keys(CSV_TEMPLATES) as TemplateType[]).forEach(templateType => {
      templates[templateType] = this.getTemplateInfo(templateType)
    })
    
    return templates
  }
}