import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export const commentRoutes = new Hono()

// Add comment to report
commentRoutes.post('/reports/:companyId/:reportId/comments', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json()
    
    const { content } = body
    if (!content || !content.trim()) {
      return c.json({ success: false, error: 'Comment content is required' }, 400)
    }
    
    // Check if report exists
    const report = await kv.get(`report:${companyId}:${reportId}`)
    if (!report) {
      return c.json({ success: false, error: 'Report not found' }, 404)
    }
    
    // Create new comment
    const commentId = crypto.randomUUID()
    const comment = {
      id: commentId,
      content: content.trim(),
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`comment:${companyId}:${reportId}:${commentId}`, comment)
    
    // Return all comments for this report
    const allComments = await kv.getByPrefix(`comment:${companyId}:${reportId}:`)
    const sortedComments = allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return c.json({ success: true, data: sortedComments })
  } catch (error) {
    console.error('Error adding comment:', error)
    return c.json({ success: false, error: 'Failed to add comment' }, 500)
  }
})

// Update comment
commentRoutes.put('/reports/:companyId/:reportId/comments/:commentId', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    const commentId = c.req.param('commentId')
    const body = await c.req.json()
    
    const { content } = body
    if (!content || !content.trim()) {
      return c.json({ success: false, error: 'Comment content is required' }, 400)
    }
    
    // Get existing comment
    const existingComment = await kv.get(`comment:${companyId}:${reportId}:${commentId}`)
    if (!existingComment) {
      return c.json({ success: false, error: 'Comment not found' }, 404)
    }
    
    // Update comment
    const updatedComment = {
      ...existingComment,
      content: content.trim(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`comment:${companyId}:${reportId}:${commentId}`, updatedComment)
    
    // Return all comments for this report
    const allComments = await kv.getByPrefix(`comment:${companyId}:${reportId}:`)
    const sortedComments = allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return c.json({ success: true, data: sortedComments })
  } catch (error) {
    console.error('Error updating comment:', error)
    return c.json({ success: false, error: 'Failed to update comment' }, 500)
  }
})

// Delete comment
commentRoutes.delete('/reports/:companyId/:reportId/comments/:commentId', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const reportId = c.req.param('reportId')
    const commentId = c.req.param('commentId')
    
    // Check if comment exists
    const existingComment = await kv.get(`comment:${companyId}:${reportId}:${commentId}`)
    if (!existingComment) {
      return c.json({ success: false, error: 'Comment not found' }, 404)
    }
    
    // Delete comment
    await kv.del(`comment:${companyId}:${reportId}:${commentId}`)
    
    // Return all remaining comments for this report
    const allComments = await kv.getByPrefix(`comment:${companyId}:${reportId}:`)
    const sortedComments = allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return c.json({ success: true, data: sortedComments })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ success: false, error: 'Failed to delete comment' }, 500)
  }
})