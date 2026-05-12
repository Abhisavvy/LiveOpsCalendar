'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Settings,
  CheckCircle,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExcelTemplates } from '../hooks/useExcelTemplates'
import { useCsvTemplates } from '../hooks/useCsvTemplates'
import { TEMPLATE_METADATA, type TemplateType } from '../config/ExcelTemplates'

interface TemplateSelectorProps {
  className?: string
}

type TemplateFormat = 'csv' | 'excel'
type TemplateStep = 'select' | 'preview' | 'download'

const TEMPLATE_OPTIONS = Object.keys(TEMPLATE_METADATA) as TemplateType[]
const STEP_SEQUENCE: TemplateStep[] = ['select', 'preview', 'download']
const STEP_COPY: Record<TemplateStep, { title: string; description: string }> = {
  select: {
    title: 'Select a template',
    description: 'Pick the Live Ops scenario that matches your planning needs.',
  },
  preview: {
    title: 'Preview template',
    description: 'Review structure, columns, and sample data before download.',
  },
  download: {
    title: 'Download template',
    description: 'Grab the file and start filling in your event data.',
  },
}

/**
 * Resolve the icon component for a template type.
 */
function getTemplateIcon(templateType: TemplateType) {
  const icons: Record<TemplateType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    comprehensive: BarChart3,
    seasonal: Calendar,
    monetization: Target,
    retention: Zap,
    abTesting: Settings,
    progression: CheckCircle,
  }
  return icons[templateType] || FileText
}

/**
 * Return a Tailwind class name for template complexity badges.
 */
function getComplexityColor(complexity: string) {
  switch (complexity) {
    case 'Advanced':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Beginner':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Convert a step name into a 1-based index for display.
 */
function getStepIndex(step: TemplateStep) {
  return STEP_SEQUENCE.indexOf(step) + 1
}

/**
 * Render preview content for a selected template and format.
 */
function TemplatePreview({ templateType, format }: { templateType: TemplateType; format: TemplateFormat }) {
  const { getCsvTemplateInfo } = useCsvTemplates()
  const { getTemplatePreview } = useExcelTemplates()

  const csvInfo = useMemo(() => getCsvTemplateInfo(templateType), [getCsvTemplateInfo, templateType])
  const excelPreview = useMemo(
    () => (format === 'excel' ? getTemplatePreview(templateType) : null),
    [format, getTemplatePreview, templateType]
  )
  const templateMeta = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {format === 'csv' ? csvInfo?.columnCount ?? '—' : excelPreview?.metadata.columns ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground">Columns</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {format === 'csv' ? csvInfo?.sampleRowCount ?? '—' : '1000+'}
          </div>
          <div className="text-xs text-muted-foreground">Sample Rows</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {format === 'csv' ? csvInfo?.requiredFields ?? '—' : excelPreview?.metadata.validationRules ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground">Required Fields</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {format === 'csv'
              ? csvInfo?.hasValidationExamples
                ? '✓'
                : '—'
              : excelPreview?.metadata.formulas ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground">{format === 'csv' ? 'Examples' : 'Formulas'}</div>
        </div>
      </div>

      {format === 'csv' && csvInfo && (
        <div className="space-y-3">
          <h4 className="font-medium">CSV Template Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {csvInfo.columnCount} columns with realistic sample data</li>
            <li>• {csvInfo.sampleRowCount} example rows demonstrating proper formatting</li>
            <li>• {csvInfo.requiredFields} required fields with validation examples</li>
            <li>• {csvInfo.optionalFields} optional fields for advanced use cases</li>
            {csvInfo.hasValidationExamples && <li>• Includes examples of correct and incorrect data formats</li>}
            <li>• Date strategy: {csvInfo.dateStrategy} (realistic timing)</li>
          </ul>
        </div>
      )}

      {format === 'excel' && excelPreview && (
        <div className="space-y-3">
          <h4 className="font-medium">Excel Template Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Interactive dropdown lists for consistent data entry</li>
            <li>• {excelPreview.metadata.validationRules} data validation rules</li>
            <li>• {excelPreview.metadata.formulas} built-in formulas for calculations</li>
            <li>• Conditional formatting for visual feedback</li>
            <li>• Professional styling with branded colors</li>
            <li>• Works with Excel 365, 2019, and Mac versions</li>
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-2">Key Features for {templateMeta.title}</h4>
        <div className="flex flex-wrap gap-2">
          {templateMeta.features.map((feature: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TemplateOptionButtonProps {
  templateType: TemplateType
  selected: boolean
  onSelect: (templateType: TemplateType) => void
}

/**
 * Render a selectable template option for the guided modal.
 */
function TemplateOptionButton({ templateType, selected, onSelect }: TemplateOptionButtonProps) {
  const metadata = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]
  const IconComponent = getTemplateIcon(templateType)

  return (
    <button
      type="button"
      onClick={() => onSelect(templateType)}
      className={cn(
        'rounded-lg border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-muted/40 hover:border-muted-foreground/40'
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{metadata.title}</span>
            <Badge variant="outline" className={cn('text-xs', getComplexityColor(metadata.complexity))}>
              {metadata.complexity}
            </Badge>
            <span className="text-base">{metadata.icon}</span>
          </div>
          <p className="text-sm text-muted-foreground">{metadata.description}</p>
          <p className="text-xs text-muted-foreground">Best for: {metadata.useCase}</p>
        </div>
      </div>
    </button>
  )
}

/**
 * Compact launcher that opens the guided templates modal flow.
 */
export function TemplateSelector({ className }: TemplateSelectorProps) {
  const { state: excelState, downloadTemplate: downloadExcel, isLibraryReady } = useExcelTemplates()
  const { state: csvState, downloadCsvTemplate } = useCsvTemplates()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<TemplateStep>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<TemplateFormat>('csv')

  const selectedMetadata = selectedTemplate
    ? TEMPLATE_METADATA[selectedTemplate as keyof typeof TEMPLATE_METADATA]
    : null

  const isDownloading =
    (selectedFormat === 'excel' && excelState.isGenerating) ||
    (selectedFormat === 'csv' && csvState.isGenerating)

  const activeError =
    selectedFormat === 'excel' ? excelState.error : csvState.error

  const resetFlow = useCallback(() => {
    setStep('select')
    setSelectedTemplate(null)
    setSelectedFormat('csv')
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        resetFlow()
      }
    },
    [resetFlow]
  )

  const handleNext = useCallback(() => {
    setStep(prevStep => (prevStep === 'select' ? 'preview' : 'download'))
  }, [])

  const handleBack = useCallback(() => {
    setStep(prevStep => (prevStep === 'download' ? 'preview' : 'select'))
  }, [])

  const handleDownload = useCallback(async () => {
    if (!selectedTemplate) return
    try {
      if (selectedFormat === 'excel') {
        await downloadExcel(selectedTemplate)
      } else {
        downloadCsvTemplate(selectedTemplate)
      }
    } catch {
      // Errors are handled in hooks
    }
  }, [downloadCsvTemplate, downloadExcel, selectedFormat, selectedTemplate])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('w-full justify-between text-sm', className)}
        >
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Browse example templates
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Example templates</DialogTitle>
          <DialogDescription>
            Choose a Live Ops scenario, preview the structure, and download the format you need.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
          <Badge variant="outline" className="text-xs">
            Step {getStepIndex(step)} of {STEP_SEQUENCE.length}
          </Badge>
          <div className="font-medium">{STEP_COPY[step].title}</div>
          <div className="text-muted-foreground">{STEP_COPY[step].description}</div>
        </div>

        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATE_OPTIONS.map(templateType => (
              <TemplateOptionButton
                key={templateType}
                templateType={templateType}
                selected={selectedTemplate === templateType}
                onSelect={setSelectedTemplate}
              />
            ))}
          </div>
        )}

        {step === 'preview' && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Preview template</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMetadata?.description}
                </p>
              </div>
              <Tabs value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as TemplateFormat)}>
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="csv" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="excel" className="flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {selectedFormat === 'excel' && !isLibraryReady && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                <Info className="inline h-3 w-3 mr-1" />
                Excel features load automatically the first time you download an Excel template.
              </div>
            )}

            <TemplatePreview templateType={selectedTemplate} format={selectedFormat} />
          </div>
        )}

        {step === 'download' && selectedTemplate && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">{selectedMetadata?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMetadata?.useCase}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedFormat.toUpperCase()} template
                </Badge>
              </div>
            </div>

            {activeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {activeError}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              After download, fill in your event data and import it using the upload panel above.
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <div className="flex flex-wrap gap-2 justify-end">
              {step !== 'select' && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step !== 'download' && (
                <Button
                  onClick={handleNext}
                  disabled={!selectedTemplate}
                >
                  Continue to {step === 'select' ? 'preview' : 'download'}
                </Button>
              )}
              {step === 'download' && (
                <Button onClick={handleDownload} disabled={!selectedTemplate || isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Download {selectedFormat.toUpperCase()}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}