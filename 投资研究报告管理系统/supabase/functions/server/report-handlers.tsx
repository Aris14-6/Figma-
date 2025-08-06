import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export const reportRoutes = new Hono()

// Get reports for a company - OPTIMIZED to reduce N+1 queries
reportRoutes.get('/companies/:companyId/reports', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    
    // Get all reports for this company
    const reports = await kv.getByPrefix(`report:${companyId}:`)
    
    // Batch load all comments for all reports in one operation
    const commentPromises = reports.map(report => 
      kv.getByPrefix(`comment:${companyId}:${report.id}:`)
    )
    
    const commentsResults = await Promise.all(commentPromises)
    
    // Attach comments to reports
    reports.forEach((report, index) => {
      const comments = commentsResults[index]
      report.comments = comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    })
    
    // Sort reports by order, then by creation date (newest first)
    reports.sort((a, b) => {
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
    
    return c.json({ success: true, data: reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json({ success: false, error: 'Failed to fetch reports' }, 500)
  }
})

// Upload report
reportRoutes.post('/companies/:companyId/reports', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const formData = await c.req.formData()
    
    const title = formData.get('title') as string
    const analyst = formData.get('analyst') as string
    const category = formData.get('category') as string
    const file = formData.get('file') as File
    
    if (!title || !analyst || !category || !file) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }
    
    if (!file.type.includes('pdf')) {
      return c.json({ success: false, error: 'Only PDF files are allowed' }, 400)
    }
    
    // Generate unique file path
    const reportId = crypto.randomUUID()
    const fileExtension = file.name.split('.').pop()
    const filePath = `${companyId}/${reportId}.${fileExtension}`
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('make-78971119-reports')
      .upload(filePath, file)
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return c.json({ success: false, error: 'Failed to upload file' }, 500)
    }
    
    // Get current max order for this company
    const existingReports = await kv.getByPrefix(`report:${companyId}:`)
    const maxOrder = existingReports.reduce((max, report) => {
      const order = report.order ?? 0;
      return Math.max(max, order);
    }, -1);
    
    // Create report metadata
    const report = {
      id: reportId,
      companyId,
      title,
      analyst,
      category,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      filePath,
      order: maxOrder + 1,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`report:${companyId}:${reportId}`, report)
    
    return c.json({ success: true, data: report })
  } catch (error) {
    console.error('Error uploading report:', error)
    return c.json({ success: false, error: 'Failed to upload report' }, 500)
  }
})

// Update report metadata
reportRoutes.put('/reports/:companyId/:reportId', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json()
    
    // Get existing report
    const existingReport = await kv.get(`report:${companyId}:${reportId}`)
    if (!existingReport) {
      return c.json({ success: false, error: 'Report not found' }, 404)
    }
    
    // Extract updatable fields
    const { title, analyst, category, createdAt } = body
    
    // Validate required fields
    if (!title || !analyst || !category) {
      return c.json({ success: false, error: 'Missing required fields: title, analyst, category' }, 400)
    }
    
    // Create updated report (preserving file-related fields and comments)
    const updatedReport = {
      ...existingReport,
      title,
      analyst,
      category,
      createdAt: createdAt || existingReport.createdAt, // Allow updating creation date
      updatedAt: new Date().toISOString()
    }
    
    // Save updated report
    await kv.set(`report:${companyId}:${reportId}`, updatedReport)
    
    return c.json({ success: true, data: updatedReport })
  } catch (error) {
    console.error('Error updating report:', error)
    return c.json({ success: false, error: 'Failed to update report' }, 500)
  }
})

// Reorder reports
reportRoutes.post('/companies/:companyId/reports/reorder', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const body = await c.req.json()
    const { orderUpdates } = body
    
    if (!Array.isArray(orderUpdates)) {
      return c.json({ success: false, error: 'orderUpdates must be an array' }, 400)
    }
    
    // Update order for each report
    const updatePromises = orderUpdates.map(async ({ id, order }) => {
      const existingReport = await kv.get(`report:${companyId}:${id}`)
      if (existingReport) {
        const updatedReport = {
          ...existingReport,
          order,
          updatedAt: new Date().toISOString()
        }
        await kv.set(`report:${companyId}:${id}`, updatedReport)
      }
    })
    
    await Promise.all(updatePromises)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error reordering reports:', error)
    return c.json({ success: false, error: 'Failed to reorder reports' }, 500)
  }
})

// Download report
reportRoutes.get('/reports/:companyId/:reportId/download', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    
    const report = await kv.get(`report:${companyId}:${reportId}`)
    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404)
    }
    
    // Generate signed URL for download
    const { data, error } = await supabase.storage
      .from('make-78971119-reports')
      .createSignedUrl(report.filePath, 3600) // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return c.json({ success: false, error: 'Failed to generate download link' }, 500)
    }
    
    return c.json({ success: true, downloadUrl: data.signedUrl })
  } catch (error) {
    console.error('Error generating download link:', error)
    return c.json({ success: false, error: 'Failed to generate download link' }, 500)
  }
})

// Delete report
reportRoutes.delete('/reports/:companyId/:reportId', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    
    const report = await kv.get(`report:${companyId}:${reportId}`)
    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404)
    }
    
    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('make-78971119-reports')
      .remove([report.filePath])
    
    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError)
    }
    
    // Delete all comments for this report
    const comments = await kv.getByPrefix(`comment:${companyId}:${reportId}:`)
    const deleteCommentPromises = comments.map(comment => 
      kv.del(`comment:${companyId}:${reportId}:${comment.id}`)
    )
    await Promise.all(deleteCommentPromises)
    
    // Delete report metadata
    await kv.del(`report:${companyId}:${reportId}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting report:', error)
    return c.json({ success: false, error: 'Failed to delete report' }, 500)
  }
})