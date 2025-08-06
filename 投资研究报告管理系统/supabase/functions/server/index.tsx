import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { companyRoutes } from './company-handlers.tsx'
import { reportRoutes } from './report-handlers.tsx' 
import { commentRoutes } from './comment-handlers.tsx'
import * as kv from './kv_store.tsx'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Logger middleware
app.use('*', logger(console.log))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Initialize storage buckets on startup
const initStorage = async () => {
  const buckets = [
    { name: 'make-78971119-reports', mimeTypes: ['application/pdf'] },
    { name: 'make-78971119-icons', mimeTypes: ['image/*'] }
  ]
  
  for (const bucket of buckets) {
    try {
      const { data: existingBuckets } = await supabase.storage.listBuckets()
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name)
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: false,
          allowedMimeTypes: bucket.mimeTypes,
          fileSizeLimit: bucket.name.includes('reports') ? 50 * 1024 * 1024 : 2 * 1024 * 1024 // 50MB for reports, 2MB for icons
        })
        if (error && error.statusCode !== '409') {
          console.error(`Error creating bucket ${bucket.name}:`, error)
        } else {
          console.log(`Successfully created storage bucket: ${bucket.name}`)
        }
      } else {
        console.log(`Storage bucket already exists: ${bucket.name}`)
      }
    } catch (error) {
      console.error(`Error initializing storage bucket ${bucket.name}:`, error)
    }
  }
}

// Initialize storage on startup
initStorage()

// Health check
app.get('/make-server-78971119/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount route handlers
app.route('/make-server-78971119', companyRoutes)
app.route('/make-server-78971119', reportRoutes)
app.route('/make-server-78971119', commentRoutes)

// Initialize sample data
app.post('/make-server-78971119/init-sample-data', async (c) => {
  try {
    const sampleCompanies = [
      {
        id: '1',
        name: '海外TMT追踪',
        code: 'TMT',
        type: '行业',
        description: 'TMT赛道，海外科技投资track【股票类型：行业报告】',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Figma',
        code: 'FIG.N',
        type: '美股',
        description: '协作设计软件龙头【股票类型：美股】',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'DraftKings',
        code: 'DKNG',
        type: '美股',
        description: '美国领先的体育博彩和幻想体育平台【股票类型：美股】',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: '腾讯控股',
        code: '0700.HK',
        type: '港股',
        description: '中国互联网巨头，游戏和社交平台领导者',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: '阿里巴巴',
        code: '9988.HK',
        type: '港股',
        description: '中国电商和云计算领军企业',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        name: '台积电',
        code: 'TSM',
        type: '美股',
        description: '全球最大的半导体代工制造商',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Store sample companies
    for (const company of sampleCompanies) {
      await kv.set(`company:${company.id}`, company)
    }
    
    return c.json({ success: true, message: 'Sample data initialized' })
  } catch (error) {
    console.error('Error initializing sample data:', error)
    return c.json({ success: false, error: 'Failed to initialize sample data' }, 500)
  }
})

Deno.serve(app.fetch)