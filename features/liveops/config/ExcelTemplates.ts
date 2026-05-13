import type { 
  ExcelTemplateConfig, 
  ExcelColumnDefinition, 
  ExcelValidationRule 
} from '../services/ExcelTemplateBuilder'

// Common validation rules for reuse
const EVENT_TYPES = '"Seasonal,IAP,Retention,Progression,System,A/B Test,Unknown"'
const COHORTS = '"All,New Users,Veteran Players,Premium Users,Free Users,High Spenders,Churned Users"'
const DURATIONS = '"1h,6h,12h,1d,3d,1w,2w,1m"'
const PLACEMENTS = '"Home screen,Game board,Outro,Game modes"'
const STATUSES = '"Draft,Scheduled,Active,Paused,Completed,Cancelled"'
const PRIORITIES = '"Low,Medium,High,Critical"'

// Validation rules
const eventTypeValidation: ExcelValidationRule = {
  type: 'list',
  formula1: EVENT_TYPES,
  allowBlank: false,
  showErrorMessage: true,
  error: 'Please select a valid event type from the dropdown',
}

const cohortValidation: ExcelValidationRule = {
  type: 'list',
  formula1: COHORTS,
  allowBlank: false,
  showErrorMessage: true,
  error: 'Please select a valid cohort from the dropdown',
}

const durationValidation: ExcelValidationRule = {
  type: 'list',
  formula1: DURATIONS,
  allowBlank: false,
  showErrorMessage: true,
  error: 'Please select a valid duration from the dropdown',
}

const placementValidation: ExcelValidationRule = {
  type: 'list',
  formula1: PLACEMENTS,
  allowBlank: true,
  showErrorMessage: true,
  error: 'Please select a valid placement from the dropdown',
}

const statusValidation: ExcelValidationRule = {
  type: 'list',
  formula1: STATUSES,
  allowBlank: false,
  showErrorMessage: true,
  error: 'Please select a valid status from the dropdown',
}

const priorityValidation: ExcelValidationRule = {
  type: 'list',
  formula1: PRIORITIES,
  allowBlank: true,
  showErrorMessage: true,
  error: 'Please select a valid priority from the dropdown',
}

const dateValidation: ExcelValidationRule = {
  type: 'date',
  operator: 'greaterThanOrEqual',
  formula1: 'TODAY()',
  allowBlank: false,
  showErrorMessage: true,
  error: 'Please enter a date that is today or in the future',
  promptTitle: 'Date Entry',
  prompt: 'Enter date in YYYY-MM-DD format',
}

const positiveNumberValidation: ExcelValidationRule = {
  type: 'whole',
  operator: 'greaterThan',
  formula1: '0',
  allowBlank: true,
  showErrorMessage: true,
  error: 'Please enter a positive number',
}

const percentageValidation: ExcelValidationRule = {
  type: 'decimal',
  operator: 'between',
  formula1: '0',
  formula2: '100',
  allowBlank: true,
  showErrorMessage: true,
  error: 'Please enter a percentage between 0 and 100',
}

// Base columns that are common across most templates
const baseColumns: ExcelColumnDefinition[] = [
  {
    key: 'title',
    header: 'Event Title',
    width: 25,
    type: 'text',
    required: true,
    description: 'Descriptive name for the event (e.g., "Spring Festival 2024")',
  },
  {
    key: 'eventType',
    header: 'Event Type',
    width: 15,
    type: 'dropdown',
    validation: eventTypeValidation,
    required: true,
    description: 'Category of event for filtering and analytics',
  },
  {
    key: 'startDate',
    header: 'Start Date',
    width: 12,
    type: 'date',
    format: 'yyyy-mm-dd',
    validation: dateValidation,
    required: true,
    description: 'When the event becomes active',
  },
  {
    key: 'duration',
    header: 'Duration',
    width: 10,
    type: 'dropdown',
    validation: durationValidation,
    required: true,
    description: 'How long the event will run',
  },
  {
    key: 'cohort',
    header: 'Target Cohort',
    width: 15,
    type: 'dropdown',
    validation: cohortValidation,
    required: true,
    description: 'Which player segment this event targets',
  },
  {
    key: 'placement',
    header: 'Placement',
    width: 15,
    type: 'dropdown',
    validation: placementValidation,
    required: false,
    description: 'Where in the game this event appears',
  },
  {
    key: 'description',
    header: 'Description',
    width: 40,
    type: 'text',
    required: false,
    description: 'Detailed description of the event content and mechanics',
  },
  {
    key: 'status',
    header: 'Status',
    width: 12,
    type: 'dropdown',
    validation: statusValidation,
    required: true,
    defaultValue: 'Draft',
    description: 'Current state of the event',
  },
]

/**
 * Comprehensive Live Ops Event Template
 * Best for: General event planning and management
 */
export const COMPREHENSIVE_TEMPLATE: ExcelTemplateConfig = {
  name: 'Comprehensive Live Ops Events',
  description: 'Complete template for planning and managing all types of live operations events with advanced tracking and analytics.',
  worksheets: [
    {
      name: 'Events',
      description: 'Main event planning worksheet with comprehensive fields',
      columns: [
        ...baseColumns,
        {
          key: 'priority',
          header: 'Priority',
          width: 10,
          type: 'dropdown',
          validation: priorityValidation,
          required: false,
          description: 'Development and marketing priority level',
        },
        {
          key: 'estimatedParticipants',
          header: 'Est. Participants',
          width: 15,
          type: 'number',
          validation: positiveNumberValidation,
          required: false,
          description: 'Expected number of players who will engage',
        },
        {
          key: 'budget',
          header: 'Budget ($)',
          width: 12,
          type: 'number',
          format: '$#,##0.00',
          validation: positiveNumberValidation,
          required: false,
          description: 'Allocated budget for event development and promotion',
        },
        {
          key: 'owner',
          header: 'Owner',
          width: 15,
          type: 'text',
          required: false,
          description: 'Team member responsible for this event',
        },
        {
          key: 'dependencies',
          header: 'Dependencies',
          width: 25,
          type: 'text',
          required: false,
          description: 'Other events or features this depends on',
        },
      ],
      sampleRows: 5,
      freezePanes: { row: 1, column: 3 },
      formulas: [
        {
          cell: 'L1',
          formula: '=COUNTA(A2:A1000)',
          description: 'Total number of events',
        },
        {
          cell: 'M1', 
          formula: '=COUNTIF(H2:H1000,"Active")',
          description: 'Number of active events',
        },
        {
          cell: 'N1',
          formula: '=SUMIF(H2:H1000,"Active",J2:J1000)',
          description: 'Total estimated participants for active events',
        },
      ],
    },
  ],
}

/**
 * Seasonal Events Template
 * Best for: Holiday campaigns, seasonal content, themed events
 */
export const SEASONAL_TEMPLATE: ExcelTemplateConfig = {
  name: 'Seasonal Events Calendar',
  description: 'Specialized template for planning seasonal and holiday-themed events with cultural considerations and timing optimization.',
  worksheets: [
    {
      name: 'Seasonal Events',
      description: 'Seasonal event planning with holiday and cultural event tracking',
      columns: [
        ...baseColumns,
        {
          key: 'holiday',
          header: 'Holiday/Season',
          width: 20,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"New Year,Valentine\'s Day,Easter,Summer Solstice,Halloween,Thanksgiving,Christmas,Lunar New Year,Diwali,Ramadan,Black Friday,Mother\'s Day,Father\'s Day"',
            allowBlank: true,
          },
          required: false,
          description: 'Associated holiday or seasonal theme',
        },
        {
          key: 'region',
          header: 'Target Region',
          width: 15,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Global,North America,Europe,Asia Pacific,Latin America,Middle East,Specific Markets"',
            allowBlank: true,
          },
          required: false,
          description: 'Geographic focus for cultural relevance',
        },
        {
          key: 'theme',
          header: 'Visual Theme',
          width: 20,
          type: 'text',
          required: false,
          description: 'Art style, colors, and visual elements for the event',
        },
        {
          key: 'contentType',
          header: 'Content Type',
          width: 15,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Cosmetics,Characters,Levels,Items,Currency,Discounts,Bundles"',
            allowBlank: true,
          },
          required: false,
          description: 'Type of seasonal content being offered',
        },
      ],
      sampleRows: 8,
      freezePanes: { row: 1, column: 2 },
    },
  ],
}

/**
 * Monetization & IAP Events Template
 * Best for: Sales campaigns, IAP promotions, pricing experiments
 */
export const MONETIZATION_TEMPLATE: ExcelTemplateConfig = {
  name: 'Monetization & IAP Events',
  description: 'Revenue-focused template for In-App Purchase promotions, pricing strategies, and conversion optimization campaigns.',
  worksheets: [
    {
      name: 'IAP Events',
      description: 'Monetization events with pricing and revenue tracking',
      columns: [
        ...baseColumns,
        {
          key: 'revenueGoal',
          header: 'Revenue Goal ($)',
          width: 15,
          type: 'number',
          format: '$#,##0.00',
          validation: positiveNumberValidation,
          required: false,
          description: 'Target revenue for this promotion',
        },
        {
          key: 'discountPercent',
          header: 'Discount %',
          width: 12,
          type: 'number',
          format: '0%',
          validation: percentageValidation,
          required: false,
          description: 'Percentage discount offered (0-100)',
        },
        {
          key: 'bundleContents',
          header: 'Bundle Contents',
          width: 30,
          type: 'text',
          required: false,
          description: 'Detailed list of items included in promotional bundles',
        },
        {
          key: 'pricePoint',
          header: 'Price Point ($)',
          width: 12,
          type: 'number',
          format: '$#,##0.00',
          validation: positiveNumberValidation,
          required: false,
          description: 'Final price after discounts',
        },
        {
          key: 'conversionGoal',
          header: 'Conversion Goal %',
          width: 15,
          type: 'number',
          format: '0.00%',
          validation: percentageValidation,
          required: false,
          description: 'Target conversion rate for this offer',
        },
      ],
      sampleRows: 6,
      formulas: [
        {
          cell: 'N1',
          formula: '=SUM(I2:I1000)',
          description: 'Total revenue goals',
        },
        {
          cell: 'O1',
          formula: '=AVERAGE(J2:J1000)',
          description: 'Average discount percentage',
        },
      ],
    },
  ],
}

/**
 * Retention & Engagement Template
 * Best for: Player return campaigns, engagement boosters, loyalty programs
 */
export const RETENTION_TEMPLATE: ExcelTemplateConfig = {
  name: 'Retention & Engagement Events',
  description: 'Player retention focused template for comeback campaigns, daily rewards, and engagement mechanics.',
  worksheets: [
    {
      name: 'Retention Events',
      description: 'Events designed to improve player retention and re-engagement',
      columns: [
        ...baseColumns,
        {
          key: 'targetBehavior',
          header: 'Target Behavior',
          width: 20,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Daily Login,Session Extension,Social Sharing,Tutorial Completion,Level Progression,First Purchase,Return After 7 Days"',
            allowBlank: false,
          },
          required: true,
          description: 'Specific player action this event encourages',
        },
        {
          key: 'rewardType',
          header: 'Reward Type',
          width: 15,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Currency,Items,Characters,Cosmetics,Premium Currency,XP Boost,Time Skip"',
            allowBlank: true,
          },
          required: false,
          description: 'Type of reward offered for engagement',
        },
        {
          key: 'frequency',
          header: 'Frequency',
          width: 12,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"One-time,Daily,Weekly,Per Session,On Achievement"',
            allowBlank: true,
          },
          required: false,
          description: 'How often players can claim rewards',
        },
        {
          key: 'retentionMetric',
          header: 'Key Metric',
          width: 15,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Day 1 Retention,Day 7 Retention,Day 30 Retention,Session Length,Sessions per Day,ARPDAU"',
            allowBlank: true,
          },
          required: false,
          description: 'Primary retention metric this event aims to improve',
        },
      ],
      sampleRows: 6,
    },
  ],
}

/**
 * A/B Testing Events Template
 * Best for: Experimental campaigns, feature tests, optimization studies
 */
export const AB_TESTING_TEMPLATE: ExcelTemplateConfig = {
  name: 'A/B Testing Events',
  description: 'Experimental template for running controlled tests and measuring the impact of different event configurations.',
  worksheets: [
    {
      name: 'A/B Tests',
      description: 'A/B testing configurations with hypothesis and measurement tracking',
      columns: [
        ...baseColumns.slice(0, 4), // Only keep first 4 base columns for simplicity
        {
          key: 'hypothesis',
          header: 'Hypothesis',
          width: 35,
          type: 'text',
          required: true,
          description: 'What you expect to happen and why (testable prediction)',
        },
        {
          key: 'variants',
          header: 'Variants',
          width: 20,
          type: 'text',
          required: true,
          description: 'Description of A and B variants being tested',
        },
        {
          key: 'sampleSize',
          header: 'Sample Size',
          width: 12,
          type: 'number',
          validation: positiveNumberValidation,
          required: false,
          description: 'Number of users per variant',
        },
        {
          key: 'primaryMetric',
          header: 'Primary Metric',
          width: 15,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Conversion Rate,Revenue per User,Retention Rate,Engagement Time,Click-through Rate,Completion Rate"',
            allowBlank: false,
          },
          required: true,
          description: 'Main success metric for the test',
        },
        {
          key: 'significance',
          header: 'Significance %',
          width: 12,
          type: 'number',
          format: '0%',
          validation: {
            type: 'list',
            formula1: '"90,95,99"',
            allowBlank: true,
          },
          required: false,
          description: 'Statistical significance threshold (typically 95%)',
        },
        {
          key: 'results',
          header: 'Results',
          width: 25,
          type: 'text',
          required: false,
          description: 'Outcome summary and decision made',
        },
      ],
      sampleRows: 4,
    },
  ],
}

/**
 * Progression Events Template
 * Best for: Level-based campaigns, achievement events, skill progression
 */
export const PROGRESSION_TEMPLATE: ExcelTemplateConfig = {
  name: 'Progression Events',
  description: 'Player advancement focused template for level-up campaigns, milestone rewards, and progression acceleration events.',
  worksheets: [
    {
      name: 'Progression Events',
      description: 'Events that enhance or reward player progression',
      columns: [
        ...baseColumns,
        {
          key: 'progressionType',
          header: 'Progression Type',
          width: 18,
          type: 'dropdown',
          validation: {
            type: 'list',
            formula1: '"Player Level,Skill Tree,Battle Pass,Collection,Achievement,Story Progress,Leaderboard"',
            allowBlank: false,
          },
          required: true,
          description: 'What type of player progress this event affects',
        },
        {
          key: 'milestones',
          header: 'Milestones',
          width: 25,
          type: 'text',
          required: false,
          description: 'Key progression thresholds with rewards (e.g., Level 10, 25, 50)',
        },
        {
          key: 'boostMultiplier',
          header: 'XP Boost (x)',
          width: 12,
          type: 'number',
          format: '0.0x',
          validation: {
            type: 'decimal',
            operator: 'greaterThan',
            formula1: '0',
            allowBlank: true,
          },
          required: false,
          description: 'Experience point multiplier during event (e.g., 2.0x)',
        },
        {
          key: 'requirements',
          header: 'Requirements',
          width: 25,
          type: 'text',
          required: false,
          description: 'What players need to do to participate (minimum level, etc.)',
        },
      ],
      sampleRows: 5,
    },
  ],
}

// Template registry for easy access
export const EXCEL_TEMPLATES: Record<string, ExcelTemplateConfig> = {
  comprehensive: COMPREHENSIVE_TEMPLATE,
  seasonal: SEASONAL_TEMPLATE,
  monetization: MONETIZATION_TEMPLATE,
  retention: RETENTION_TEMPLATE,
  abTesting: AB_TESTING_TEMPLATE,
  progression: PROGRESSION_TEMPLATE,
} as const

export type TemplateType = keyof typeof EXCEL_TEMPLATES

// Template metadata for selection UI
export const TEMPLATE_METADATA = {
  comprehensive: {
    title: 'Comprehensive Events',
    description: 'Complete template for all event types with advanced tracking',
    icon: '📊',
    complexity: 'Advanced',
    useCase: 'General purpose event planning and management',
    features: ['All event types', 'Budget tracking', 'Priority management', 'Dependencies'],
  },
  seasonal: {
    title: 'Seasonal & Holiday',
    description: 'Holiday campaigns and seasonal content planning',
    icon: '🎄',
    complexity: 'Intermediate',
    useCase: 'Holiday and seasonal events with cultural considerations',
    features: ['Holiday tracking', 'Regional targeting', 'Visual themes', 'Content types'],
  },
  monetization: {
    title: 'Monetization & IAP',
    description: 'Revenue-focused events and pricing strategies',
    icon: '💰',
    complexity: 'Advanced',
    useCase: 'Sales campaigns and IAP promotions',
    features: ['Revenue goals', 'Discount tracking', 'Bundle management', 'Conversion goals'],
  },
  retention: {
    title: 'Retention & Engagement',
    description: 'Player comeback and engagement campaigns',
    icon: '🔄',
    complexity: 'Intermediate',
    useCase: 'Player retention and re-engagement events',
    features: ['Behavior targeting', 'Reward systems', 'Frequency control', 'Retention metrics'],
  },
  abTesting: {
    title: 'A/B Testing',
    description: 'Experimental campaigns and feature tests',
    icon: '🧪',
    complexity: 'Advanced',
    useCase: 'Controlled experiments and optimization studies',
    features: ['Hypothesis tracking', 'Variant management', 'Statistical significance', 'Results logging'],
  },
  progression: {
    title: 'Progression Events',
    description: 'Level-up campaigns and milestone rewards',
    icon: '🎯',
    complexity: 'Intermediate',
    useCase: 'Player advancement and achievement events',
    features: ['XP boosts', 'Milestone tracking', 'Requirement management', 'Progress types'],
  },
} as const