@@ .. @@
// Remove company icon
companyRoutes.delete('/companies/:id/icon', async (c) => {
  try {
    const id = c.req.param('id')
    
    const existingCompany = await kv.get(`company:${id}`)
    if (!existingCompany) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    // Delete icon from storage if exists
    if (existingCompany.iconUrl) {
      try {
        const filePath = existingCompany.iconUrl.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('make-78971119-company-icons')
            .remove([`company-icons/${filePath}`])
        }
      } catch (iconError) {
        console.warn('Failed to delete company icon:', iconError)
      }
    }
    
    // Update company to remove icon URL
    const updatedCompany = {
      ...existingCompany,
      iconUrl: undefined,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`company:${id}`, updatedCompany)
    
    return c.json({ success: true, data: updatedCompany })
  } catch (error) {
    console.error('Error removing company icon:', error)
    return c.json({ success: false, error: 'Failed to remove company icon' }, 500)
  }
})

// Delete company