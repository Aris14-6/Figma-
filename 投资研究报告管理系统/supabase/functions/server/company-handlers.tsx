import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export const companyRoutes = new Hono()

// Get all companies
companyRoutes.get('/companies', async (c) => {
  try {
    const companies = await kv.getByPrefix('company:')
    
    // Sort by order, then by creation date
    companies.sort((a, b) => {
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
    
    return c.json({ success: true, data: companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return c.json({ success: false, error: 'Failed to fetch companies' }, 500)
  }
})

// Get company by ID
companyRoutes.get('/companies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const company = await kv.get(`company:${id}`)
    
    if (!company) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    return c.json({ success: true, data: company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return c.json({ success: false, error: 'Failed to fetch company' }, 500)
  }
})

// Create company
companyRoutes.post('/companies', async (c) => {
  try {
    const body = await c.req.json()
    const { name, code, type, description } = body
    
    if (!name || !code || !type) {
      return c.json({ success: false, error: 'Missing required fields: name, code, type' }, 400)
    }
    
    const id = crypto.randomUUID()
    
    // Get current max order
    const companies = await kv.getByPrefix('company:')
    const maxOrder = companies.reduce((max, company) => {
      const order = company.order ?? 0;
      return Math.max(max, order);
    }, -1);
    
    const company = {
      id,
      name,
      code,
      type,
      description: description || '',
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`company:${id}`, company)
    
    return c.json({ success: true, data: company })
  } catch (error) {
    console.error('Error creating company:', error)
    return c.json({ success: false, error: 'Failed to create company' }, 500)
  }
})

// Update company
companyRoutes.put('/companies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const existingCompany = await kv.get(`company:${id}`)
    if (!existingCompany) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    const { name, code, type, description } = body
    
    if (!name || !code || !type) {
      return c.json({ success: false, error: 'Missing required fields: name, code, type' }, 400)
    }
    
    const updatedCompany = {
      ...existingCompany,
      name,
      code,
      type,
      description: description || '',
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`company:${id}`, updatedCompany)
    
    return c.json({ success: true, data: updatedCompany })
  } catch (error) {
    console.error('Error updating company:', error)
    return c.json({ success: false, error: 'Failed to update company' }, 500)
  }
})

// Reorder companies
companyRoutes.post('/companies/reorder', async (c) => {
  try {
    const body = await c.req.json()
    const { orderUpdates } = body
    
    if (!Array.isArray(orderUpdates)) {
      return c.json({ success: false, error: 'orderUpdates must be an array' }, 400)
    }
    
    // Update order for each company
    const updatePromises = orderUpdates.map(async ({ id, order }) => {
      const existingCompany = await kv.get(`company:${id}`)
      if (existingCompany) {
        const updatedCompany = {
          ...existingCompany,
          order,
          updatedAt: new Date().toISOString()
        }
        await kv.set(`company:${id}`, updatedCompany)
      }
    })
    
    await Promise.all(updatePromises)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error reordering companies:', error)
    return c.json({ success: false, error: 'Failed to reorder companies' }, 500)
  }
})

// Upload company icon
companyRoutes.post('/companies/:id/icon', async (c) => {
  try {
    const id = c.req.param('id')
    const formData = await c.req.formData()
    
    const existingCompany = await kv.get(`company:${id}`)
    if (!existingCompany) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    const iconFile = formData.get('icon') as File
    if (!iconFile) {
      return c.json({ success: false, error: 'No icon file provided' }, 400)
    }
    
    // Validate file type
    if (!iconFile.type.startsWith('image/')) {
      return c.json({ success: false, error: 'File must be an image' }, 400)
    }
    
    // Validate file size (max 5MB)
    if (iconFile.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 5MB' }, 400)
    }
    
    // Generate unique file path
    const fileExtension = iconFile.name.split('.').pop()
    const filePath = `company-icons/${id}.${fileExtension}`
    
    // Delete existing icon if it exists
    if (existingCompany.iconUrl) {
      try {
        const oldPath = existingCompany.iconUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('make-78971119-company-icons')
            .remove([`company-icons/${oldPath}`])
        }
      } catch (deleteError) {
        console.warn('Failed to delete old icon:', deleteError)
      }
    }
    
    // Upload new icon to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('make-78971119-company-icons')
      .upload(filePath, iconFile, { upsert: true })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return c.json({ success: false, error: 'Failed to upload icon' }, 500)
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('make-78971119-company-icons')
      .getPublicUrl(filePath)
    
    // Update company with icon URL
    const updatedCompany = {
      ...existingCompany,
      iconUrl: urlData.publicUrl,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`company:${id}`, updatedCompany)
    
    return c.json({ success: true, data: updatedCompany })
  } catch (error) {
    console.error('Error uploading company icon:', error)
    return c.json({ success: false, error: 'Failed to upload company icon' }, 500)
  }
})

// Delete company
companyRoutes.delete('/companies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const company = await kv.get(`company:${id}`)
    if (!company) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    // Delete company icon from storage if exists
    if (company.iconUrl) {
      try {
        const filePath = company.iconUrl.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('make-78971119-company-icons')
            .remove([`company-icons/${filePath}`])
        }
      } catch (iconError) {
        console.warn('Failed to delete company icon:', iconError)
      }
    }
    
    // Delete all reports for this company
    const reports = await kv.getByPrefix(`report:${id}:`)
    
    for (const report of reports) {
      // Delete report file from storage
      if (report.filePath) {
        try {
          await supabase.storage
            .from('make-78971119-reports')
            .remove([report.filePath])
        } catch (fileError) {
          console.warn('Failed to delete report file:', fileError)
        }
      }
      
      // Delete all comments for this report
      const comments = await kv.getByPrefix(`comment:${id}:${report.id}:`)
      const deleteCommentPromises = comments.map(comment => 
        kv.del(`comment:${id}:${report.id}:${comment.id}`)
      )
      await Promise.all(deleteCommentPromises)
      
      // Delete report metadata
      await kv.del(`report:${id}:${report.id}`)
    }
    
    // Delete company
    await kv.del(`company:${id}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return c.json({ success: false, error: 'Failed to delete company' }, 500)
  }
})