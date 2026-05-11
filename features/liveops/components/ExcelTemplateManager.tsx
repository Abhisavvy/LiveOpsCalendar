'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  CheckCircle, 
  AlertCircle,
  Loader2,
  Zap,
  Calendar,
  BarChart3,
  Target,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExcelTemplates } from '../hooks/useExcelTemplates'
import { useExcelLibrary } from '../hooks/useExcelLibrary'
import { LibraryLoader } from './LibraryLoader'
import { TEMPLATE_METADATA, type TemplateType } from '../config/ExcelTemplates'

interface ExcelTemplateManagerProps {
  className?: string
}

function getTemplateIcon(templateType: TemplateType) {
  const icons: Record<TemplateType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    comprehensive: BarChart3,
    seasonal: Calendar,
    monetization: Target,
    retention: Zap,
    abTesting: Settings,
    progression: CheckCircle,
  }
  return icons[templateType] || FileSpreadsheet
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case 'Advanced': return 'bg-red-100 text-red-800 border-red-200'
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function TemplatePreviewDialog({ 
  templateType, 
  children 
}: { 
  templateType: TemplateType
  children: React.ReactNode 
}) {
  const { getTemplatePreview } = useExcelTemplates()
  const [isOpen, setIsOpen] = useState(false)
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const preview = getTemplatePreview(templateType)
  const metadata = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {preview.config.name} - Template Preview
          </DialogTitle>
          <DialogDescription>
            {preview.config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{preview.metadata.columns}</div>
              <div className="text-xs text-muted-foreground">Columns</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{preview.metadata.validationRules}</div>
              <div className="text-xs text-muted-foreground">Validations</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{preview.metadata.formulas}</div>
              <div className="text-xs text-muted-foreground">Formulas</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{preview.config.worksheets.length}</div>
              <div className="text-xs text-muted-foreground">Worksheets</div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium mb-2">Key Features</h4>
          <div className="flex flex-wrap gap-2">
            {metadata.features.map((feature: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Worksheets */}
          {preview.config.worksheets.map((worksheet, index) => (
            <div key={index}>
              <h4 className="font-medium mb-3">
                Worksheet: {worksheet.name}
                {worksheet.description && (
                  <span className="text-sm text-muted-foreground ml-2">
                    — {worksheet.description}
                  </span>
                )}
              </h4>

              {/* Column Structure */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 border-b">
                  <div className="text-sm font-medium">Column Structure</div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="text-left p-2 font-medium">Column</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Required</th>
                        <th className="text-left p-2 font-medium">Validation</th>
                        <th className="text-left p-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worksheet.columns.map((column, colIndex) => (
                        <tr key={colIndex} className="border-b border-muted/20">
                          <td className="p-2 font-medium">{column.header}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {column.type || 'text'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {column.required ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </td>
                          <td className="p-2">
                            {column.validation ? (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                {column.validation.type}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground max-w-xs truncate">
                            {column.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formulas */}
              {worksheet.formulas && worksheet.formulas.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Formulas & Calculations</div>
                  <div className="space-y-2">
                    {worksheet.formulas.map((formula, formulaIndex) => (
                      <div key={formulaIndex} className="bg-muted/30 rounded p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {formula.cell}
                          </Badge>
                          <code className="text-xs bg-muted px-1 rounded">
                            {formula.formula}
                          </code>
                        </div>
                        {formula.description && (
                          <div className="text-xs text-muted-foreground">
                            {formula.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TemplateCard({ templateType }: { templateType: TemplateType }) {
  const metadata = TEMPLATE_METADATA[templateType as keyof typeof TEMPLATE_METADATA]
  const { state, downloadTemplate, isLibraryReady } = useExcelTemplates()
  const IconComponent = getTemplateIcon(templateType)

  const handleDownload = async () => {
    try {
      await downloadTemplate(templateType)
    } catch {
      // Error handling is done in the hook
    }
  }

  const isGenerating = state.isGenerating

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
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
        {/* Use Case */}
        <div>
          <div className="text-sm font-medium mb-1">Best for:</div>
          <div className="text-sm text-muted-foreground">{metadata.useCase}</div>
        </div>

        {/* Key Features */}
        <div>
          <div className="text-sm font-medium mb-2">Key Features:</div>
          <div className="flex flex-wrap gap-1">
            {metadata.features.slice(0, 3).map((feature: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {metadata.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{metadata.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {state.currentStep}
            </div>
            <Progress value={state.progress} className="h-2" />
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {state.error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <TemplatePreviewDialog templateType={templateType}>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </TemplatePreviewDialog>
          
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleDownload}
            disabled={!isLibraryReady || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExcelTemplateManager({ className }: ExcelTemplateManagerProps) {
  const { state: libraryState } = useExcelLibrary()

  // Show library loader if Excel library is not ready
  if (libraryState.status !== 'loaded') {
    return (
      <div className={cn("space-y-6", className)}>
        <div>
          <h2 className="text-2xl font-bold mb-2">Excel Template Generator</h2>
          <p className="text-muted-foreground">
            Download professionally designed Excel templates for your Live Ops events.
          </p>
        </div>

        <LibraryLoader
          libraryName="ExcelJS"
          state={libraryState}
          variant="card"
          size="lg"
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Excel Template Generator</h2>
        <p className="text-muted-foreground">
          Choose from professionally designed Excel templates with advanced features like data validation, 
          formulas, and conditional formatting. Perfect for planning and tracking Live Ops events.
        </p>
      </div>

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
            <FileSpreadsheet className="h-5 w-5" />
            How to Use Excel Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-primary">1.</span>
            <span>Choose the template that best fits your event type</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-primary">2.</span>
            <span>Download the Excel file to your computer</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-primary">3.</span>
            <span>Fill in your event data using the provided dropdowns and validation</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-primary">4.</span>
            <span>Save as CSV and import back to the calendar using the CSV upload feature</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}