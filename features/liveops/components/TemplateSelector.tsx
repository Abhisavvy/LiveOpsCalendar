'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Download, 
  Eye, 
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
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExcelTemplates } from '../hooks/useExcelTemplates'
import { useCsvTemplates } from '../hooks/useCsvTemplates'
import { TEMPLATE_METADATA, type TemplateType } from '../config/ExcelTemplates'

interface TemplateSelectorProps {
  className?: string
}

type TemplateFormat = 'csv' | 'excel'

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

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case 'Advanced': return 'bg-red-100 text-red-800 border-red-200'
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function TemplatePreview({ templateType, format }: { templateType: TemplateType, format: TemplateFormat }) {
  const { getCsvTemplateInfo } = useCsvTemplates()
  const { getTemplatePreview } = useExcelTemplates()
  
  const csvInfo = getCsvTemplateInfo(templateType)
  const excelPreview = format === 'excel' ? getTemplatePreview(templateType) : null
  const templateMeta = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]

  return (
    <div className="space-y-4">
      {/* Template Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {format === 'csv' ? csvInfo?.columnCount : excelPreview?.metadata.columns}
          </div>
          <div className="text-xs text-muted-foreground">Columns</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {format === 'csv' ? csvInfo?.sampleRowCount : '1000+'}
          </div>
          <div className="text-xs text-muted-foreground">Sample Rows</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {format === 'csv' ? csvInfo?.requiredFields : excelPreview?.metadata.validationRules}
          </div>
          <div className="text-xs text-muted-foreground">Required Fields</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {format === 'csv' ? (csvInfo?.hasValidationExamples ? '✓' : '—') : excelPreview?.metadata.formulas}
          </div>
          <div className="text-xs text-muted-foreground">
            {format === 'csv' ? 'Examples' : 'Formulas'}
          </div>
        </div>
      </div>

      {/* Format-specific details */}
      {format === 'csv' && csvInfo && (
        <div className="space-y-3">
          <h4 className="font-medium">CSV Template Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {csvInfo.columnCount} columns with realistic sample data</li>
            <li>• {csvInfo.sampleRowCount} example rows demonstrating proper formatting</li>
            <li>• {csvInfo.requiredFields} required fields with validation examples</li>
            <li>• {csvInfo.optionalFields} optional fields for advanced use cases</li>
            {csvInfo.hasValidationExamples && (
              <li>• Includes examples of correct and incorrect data formats</li>
            )}
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

      {/* Key Features */}
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

function TemplateCard({ 
  templateType, 
  className 
}: { 
  templateType: TemplateType
  className?: string 
}) {
  const [selectedFormat, setSelectedFormat] = useState<TemplateFormat>('csv')
  const metadata = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]
  const IconComponent = getTemplateIcon(templateType)
  
  const { state: excelState, downloadTemplate: downloadExcel, isLibraryReady } = useExcelTemplates()
  const { state: csvState, downloadCsvTemplate } = useCsvTemplates()
  
  const isDownloading = (selectedFormat === 'excel' && excelState.isGenerating) || 
                       (selectedFormat === 'csv' && csvState.isGenerating)

  const handleDownload = async () => {
    try {
      if (selectedFormat === 'excel') {
        await downloadExcel(templateType)
      } else {
        downloadCsvTemplate(templateType)
      }
    } catch {
      // Error handling is done in the hooks
    }
  }

  const canDownloadExcel = isLibraryReady && selectedFormat === 'excel'
  const canDownloadCsv = selectedFormat === 'csv'
  const canDownload = canDownloadExcel || canDownloadCsv

  return (
    <Card className={cn("h-full hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{metadata.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getComplexityColor(metadata.complexity))}
                >
                  {metadata.complexity}
                </Badge>
                <span className="text-lg">{metadata.icon}</span>
              </div>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">
          {metadata.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Format:</div>
          <Tabs value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as TemplateFormat)}>
            <TabsList className="grid w-full grid-cols-2">
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

        {/* Format-specific info */}
        {selectedFormat === 'excel' && !isLibraryReady && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <Info className="inline h-3 w-3 mr-1" />
            Excel library will be loaded on download
          </div>
        )}

        {/* Use Case */}
        <div>
          <div className="text-sm font-medium mb-1">Best for:</div>
          <div className="text-sm text-muted-foreground">{metadata.useCase}</div>
        </div>

        {/* Error Display */}
        {((selectedFormat === 'excel' && excelState.error) || 
          (selectedFormat === 'csv' && csvState.error)) && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {selectedFormat === 'excel' ? excelState.error : csvState.error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedFormat === 'excel' ? (
                    <FileSpreadsheet className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  {metadata.title} - {selectedFormat.toUpperCase()} Preview
                </DialogTitle>
                <DialogDescription>
                  {selectedFormat === 'csv' 
                    ? 'Simple CSV format for quick import and editing'
                    : 'Advanced Excel format with validation and formulas'
                  }
                </DialogDescription>
              </DialogHeader>
              <TemplatePreview templateType={templateType} format={selectedFormat} />
            </DialogContent>
          </Dialog>
          
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleDownload}
            disabled={!canDownload || isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download {selectedFormat.toUpperCase()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function TemplateSelector({ className }: TemplateSelectorProps) {
  const { isLibraryReady } = useExcelTemplates()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Live Ops Template Library</h2>
        <p className="text-muted-foreground">
          Choose from professionally designed templates for your Live Ops events. 
          Available in both CSV and Excel formats with advanced features.
        </p>
      </div>

      {/* Excel Library Status */}
      {!isLibraryReady && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Excel Features Available</h3>
              <p className="text-sm text-blue-700 mt-1">
                Advanced Excel templates with data validation, formulas, and conditional formatting 
                will be available once the Excel library loads (happens automatically on first Excel download).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(TEMPLATE_METADATA).map((templateType) => (
          <TemplateCard 
            key={templateType} 
            templateType={templateType as TemplateType} 
          />
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            How to Use Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">CSV Templates</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Quick and simple to use</div>
                <div>• Works with any spreadsheet app</div>
                <div>• Includes realistic sample data</div>
                <div>• Ready for immediate import</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Excel Templates</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Advanced data validation</div>
                <div>• Interactive dropdown lists</div>
                <div>• Built-in formulas and calculations</div>
                <div>• Professional formatting</div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-2">Usage Steps</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><span className="font-medium text-primary">1.</span> Choose template that matches your event type</div>
              <div><span className="font-medium text-primary">2.</span> Select CSV (simple) or Excel (advanced) format</div>
              <div><span className="font-medium text-primary">3.</span> Download and fill in your event data</div>
              <div><span className="font-medium text-primary">4.</span> Save as CSV and import using the upload feature above</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}