import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, FileText, Download, Eye, Edit, Trash2, MoreHorizontal, Calendar as CalendarIcon, MessageSquare, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CompanyIconUpload } from './CompanyIconUpload';
import { ReportComments } from './ReportComments';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { SortManager } from './SortManager';
import { SkeletonLoader } from './SkeletonLoader';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { reportApi } from '../utils/api';
import { getTypeColor, getCategoryColor, REPORT_CATEGORIES } from '../utils/constants';
import { formatDate, getLatestReportDate, getAnalystCount, getTotalComments } from '../utils/helpers';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import type { Company, Report } from '../App';

interface CompanyDetailProps {
  company: Company;
  onBack: () => void;
  onCompanyUpdated: (company: Company) => void;
  onCompanyDeleted: (id: string) => void;
}

interface ReportFormData {
  title: string;
  analyst: string;
  category: string;
  file: File | null;
  createdAt: string;
}

export function CompanyDetail({ company, onBack, onCompanyUpdated, onCompanyDeleted }: CompanyDetailProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSortManagerOpen, setIsSortManagerOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    analyst: '',
    category: '',
    file: null,
    createdAt: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportApi.getByCompany(company.id);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('加载报告失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = reports.filter(report => 
    selectedCategory === '全部' || report.category === selectedCategory
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      analyst: '',
      category: '',
      file: null,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setEditingReport(null);
  }, []);

  const handleUploadReport = useCallback(() => {
    resetForm();
    setIsUploadDialogOpen(true);
  }, [resetForm]);

  const handleEditReport = useCallback((report: Report) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      analyst: report.analyst,
      category: report.category,
      file: null,
      createdAt: report.createdAt ? report.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteReport = useCallback((report: Report) => {
    setReportToDelete(report);
    setIsPasswordDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!reportToDelete) return;
    
    try {
      await reportApi.delete(company.id, reportToDelete.id);
      setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
      toast.success('报告删除成功');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('删除报告失败，请重试');
    } finally {
      setReportToDelete(null);
    }
  }, [reportToDelete, company.id]);

  const handlePreviewReport = useCallback(async (report: Report) => {
    try {
      const downloadUrl = await reportApi.getDownloadUrl(company.id, report.id);
      
      // 创建一个新的窗口来预览PDF
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>预览: ${report.title}</title>
              <meta charset="utf-8">
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: system-ui, -apple-system, sans-serif;
                  background: #f5f5f5;
                }
                .header {
                  background: white;
                  padding: 16px;
                  border-bottom: 1px solid #e5e5e5;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .title {
                  margin: 0;
                  font-size: 18px;
                  font-weight: 600;
                  color: #333;
                }
                .meta {
                  margin: 8px 0 0 0;
                  font-size: 14px;
                  color: #666;
                }
                .pdf-container {
                  width: 100%;
                  height: calc(100vh - 80px);
                  border: none;
                }
                .fallback {
                  padding: 40px;
                  text-align: center;
                  background: white;
                  margin: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .download-btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background: #007bff;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                  margin-top: 16px;
                  transition: background-color 0.2s;
                }
                .download-btn:hover {
                  background: #0056b3;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">${report.title}</h1>
                <p class="meta">分析师: ${report.analyst} | 类别: ${report.category} | 日期: ${formatDate(report.createdAt || '')}</p>
              </div>
              <iframe 
                src="${downloadUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH" 
                class="pdf-container"
                onload="this.style.display='block'"
                onerror="showFallback()"
              ></iframe>
              <div id="fallback" class="fallback" style="display: none;">
                <h2>无法预览PDF文件</h2>
                <p>您的浏览器可能不支持PDF预览，请点击下方按钮下载文件。</p>
                <a href="${downloadUrl}" class="download-btn" download="${report.fileName}">下载文件</a>
              </div>
              <script>
                function showFallback() {
                  document.querySelector('iframe').style.display = 'none';
                  document.getElementById('fallback').style.display = 'block';
                }
                
                // 检测PDF加载失败
                setTimeout(() => {
                  const iframe = document.querySelector('iframe');
                  try {
                    if (!iframe.contentDocument && !iframe.contentWindow) {
                      showFallback();
                    }
                  } catch (e) {
                    // 跨域错误，PDF可能正常加载
                  }
                }, 3000);
              </script>
            </body>
          </html>
        `);
        previewWindow.document.close();
      } else {
        // 如果弹窗被阻止，直接下载
        handleDownloadReport(report);
      }
    } catch (error) {
      console.error('Error previewing report:', error);
      toast.error('预览失败，请重试');
    }
  }, [company.id]);

  const handleDownloadReport = useCallback(async (report: Report) => {
    try {
      const downloadUrl = await reportApi.getDownloadUrl(company.id, report.id);
      
      // 创建一个临时的a标签来触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = report.fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('文件下载已开始');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('下载失败，请重试');
    }
  }, [company.id]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.analyst || !formData.category) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (!editingReport && !formData.file) {
      toast.error('请选择要上传的文件');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingReport) {
        const updatedReport = await reportApi.update(company.id, editingReport.id, {
          title: formData.title,
          analyst: formData.analyst,
          category: formData.category,
          createdAt: formData.createdAt + 'T00:00:00.000Z'
        });
        setReports(prev => prev.map(r => r.id === editingReport.id ? updatedReport : r));
        setIsEditDialogOpen(false);
        toast.success('报告更新成功');
      } else {
        const newReport = await reportApi.upload(company.id, {
          title: formData.title,
          analyst: formData.analyst,
          category: formData.category,
          file: formData.file!
        });
        setReports(prev => [newReport, ...prev]);
        setIsUploadDialogOpen(false);
        toast.success('报告上传成功');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error(editingReport ? '更新报告失败，请重试' : '上传报告失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingReport, company.id, resetForm]);

  const handleCommentsUpdated = useCallback((reportId: string, comments: any[]) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, comments } : report
    ));
  }, []);

  const handleSortReports = useCallback(async (reorderedReports: Report[]) => {
    try {
      setReports(reorderedReports);
      await reportApi.updateOrder(company.id, reorderedReports.map((report, index) => ({
        id: report.id,
        order: index
      })));
      toast.success('报告排序已更新');
    } catch (error) {
      console.error('Error updating report order:', error);
      toast.error('保存排序失败，请重试');
      loadReports();
    }
  }, [company.id, loadReports]);

  const ReportForm = React.memo(() => (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Label htmlFor="title" className="block mb-2">报告标题 *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入报告标题"
            required
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Label htmlFor="analyst" className="block mb-2">分析师 *</Label>
          <Input
            id="analyst"
            value={formData.analyst}
            onChange={(e) => setFormData(prev => ({ ...prev, analyst: e.target.value }))}
            placeholder="请输入分析师姓名"
            required
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Label htmlFor="category" className="block mb-2">报告类别 *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md focus:shadow-lg focus:shadow-primary/10">
              <SelectValue placeholder="选择报告类别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="会议纪要">会议纪要</SelectItem>
              <SelectItem value="首次覆盖">首次覆盖</SelectItem>
              <SelectItem value="跟踪">跟踪</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Label htmlFor="createdAt" className="block mb-2">报告日期</Label>
          <Input
            id="createdAt"
            type="date"
            value={formData.createdAt}
            onChange={(e) => setFormData(prev => ({ ...prev, createdAt: e.target.value }))}
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
        </motion.div>
      </div>
      
      {!editingReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Label htmlFor="file" className="block mb-2">上传文件 *</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf"
            onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
            required
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
          <p className="text-xs text-muted-foreground mt-1">仅支持PDF格式文件</p>
        </motion.div>
      )}
      
      <motion.div 
        className="flex justify-end gap-3 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (editingReport) {
              setIsEditDialogOpen(false);
            } else {
              setIsUploadDialogOpen(false);
            }
            resetForm();
          }}
          disabled={isSubmitting}
          className="transition-all duration-300 hover:scale-105 hover:shadow-md"
        >
          取消
        </Button>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
          >
            {isSubmitting && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            {isSubmitting ? '提交中...' : (editingReport ? '更新' : '上传')}
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  ));

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>
      </motion.div>

      {/* Company Header */}
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <motion.div 
              className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-secondary/20"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ duration: 0.3 }}
            >
              {company.iconUrl ? (
                <ImageWithFallback
                  src={company.iconUrl}
                  alt={`${company.name} 图标`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="h-7 w-7 text-secondary-foreground" />
              )}
            </motion.div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className={`shadow-sm ${getTypeColor(company.type)} hover:shadow-md transition-all duration-200`}>
                    {company.type}
                  </Badge>
                </motion.div>
              </div>
              <p className="text-lg text-muted-foreground font-mono">{company.code}</p>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">{company.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CompanyIconUpload 
              company={company}
              onIconUpdated={onCompanyUpdated}
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSortManagerOpen(true)}
                disabled={reports.length === 0}
                className="hover:shadow-md transition-all duration-300"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                排序
              </Button>
            </motion.div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleUploadReport}
                    className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    上传报告
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>上传研究报告</DialogTitle>
                  <DialogDescription>
                    为 {company.name} 上传新的研究报告，支持PDF格式文件。
                  </DialogDescription>
                </DialogHeader>
                <ReportForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {[
          { label: '报告总数', value: reports.length, delay: 0.1 },
          { label: '分析师数量', value: getAnalystCount(reports), delay: 0.15 },
          { label: '评论总数', value: getTotalComments(reports), delay: 0.2 }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.5 + stat.delay, 
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.3 }
            }}
          >
            <Card className="relative overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <CardContent className="p-4 relative z-10">
                <div className="text-center">
                  <motion.p 
                    className="text-2xl font-semibold text-foreground"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.6 + stat.delay, 
                      duration: 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Reports Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">研究报告</h3>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {filteredReports.length} 份报告
                </Badge>
                <span className="text-sm text-muted-foreground">
                  最新更新：{getLatestReportDate(reports)}
                </span>
              </div>
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {REPORT_CATEGORIES.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="transition-all duration-200"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <SkeletonLoader type="reports" count={3} />
            ) : filteredReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-dashed border-2 hover:border-primary/20 transition-colors duration-300">
                  <CardContent className="p-12 text-center">
                    <motion.div 
                      className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <FileText className="h-8 w-8 text-secondary-foreground" />
                    </motion.div>
                    <h4 className="font-medium text-foreground mb-2">暂无报告</h4>
                    <p className="text-muted-foreground mb-4">
                      {selectedCategory === '全部' ? '还没有上传任何报告' : `暂无${selectedCategory}类型的报告`}
                    </p>
                    <Button onClick={handleUploadReport} className="shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4 mr-2" />
                      上传第一份报告
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        y: -2,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <Card className="relative overflow-hidden hover:shadow-md hover:shadow-black/5 transition-all duration-300 group border-0 bg-card/50 backdrop-blur-sm">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <motion.div 
                                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                                whileHover={{ rotate: 5 }}
                              >
                                <FileText className="h-5 w-5 text-secondary-foreground" />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate mb-1 group-hover:text-primary transition-colors duration-300">
                                  {report.title}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {formatDate(report.createdAt || '')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {report.analyst}
                                  </span>
                                  <span className="font-mono">{report.fileSize}</span>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge className={`text-xs shadow-sm ${getCategoryColor(report.category)} hover:shadow-md transition-all duration-200`}>
                                      {report.category}
                                    </Badge>
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <ReportComments
                                companyId={company.id}
                                reportId={report.id}
                                comments={report.comments || []}
                                onCommentsUpdated={(comments) => handleCommentsUpdated(report.id, comments)}
                              />
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handlePreviewReport(report)}
                                  className="hover:shadow-md transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  预览
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDownloadReport(report)}
                                  className="hover:shadow-md transition-all duration-200"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  下载
                                </Button>
                              </motion.div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 transition-all duration-200 hover:bg-secondary/50 text-foreground"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-200">
                                  <DropdownMenuItem 
                                    onClick={() => handleEditReport(report)}
                                    className="hover:bg-secondary/50 transition-colors duration-200"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑信息
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteReport(report)}
                                    className="text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑报告信息</DialogTitle>
            <DialogDescription>
              修改报告的基本信息，文件内容无法修改。
            </DialogDescription>
          </DialogHeader>
          <ReportForm />
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        isOpen={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) setReportToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="确认删除报告"
        description={`您确定要删除报告 "${reportToDelete?.title}" 吗？此操作将同时删除该报告的所有评论，且无法撤销。请输入删除密码以继续操作。`}
        confirmButtonText="确认删除"
      />

      {/* Sort Manager Dialog */}
      <SortManager
        isOpen={isSortManagerOpen}
        onOpenChange={setIsSortManagerOpen}
        title="报告排序管理"
        description="调整报告在列表中的显示顺序。使用上下箭头按钮移动报告位置，完成后点击保存排序。"
        items={reports}
        type="report"
        onReorder={handleSortReports}
      />
    </motion.div>
  );
}