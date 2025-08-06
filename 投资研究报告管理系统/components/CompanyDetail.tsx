import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, FileText, Download, Edit, Trash2, MoreHorizontal, RefreshCw, Calendar as CalendarIcon, MessageSquare, Building2, Eye, Image, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ReportComments } from './ReportComments';
import { CompanyIconUpload } from './CompanyIconUpload';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { SortManager } from './SortManager';
import { SkeletonLoader } from './SkeletonLoader';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { companyApi, reportApi } from '../utils/api';
import { getTypeColor, getCategoryColor, REPORT_CATEGORIES } from '../utils/constants';
import { formatDate, getLatestReportDate, getAnalystCount } from '../utils/helpers';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import type { Company, Report } from '../App';

interface CompanyDetailProps {
  company: Company;
  onBack: () => void;
  onCompanyUpdated: (company: Company) => void;
  onCompanyDeleted: (id: string) => void;
}

export function CompanyDetail({ company, onBack, onCompanyUpdated, onCompanyDeleted }: CompanyDetailProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportEditOpen, setIsReportEditOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isCompanyDeletePasswordOpen, setIsCompanyDeletePasswordOpen] = useState(false);
  const [isReportDeletePasswordOpen, setIsReportDeletePasswordOpen] = useState(false);
  const [isReportSortManagerOpen, setIsReportSortManagerOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    analyst: '',
    category: '会议纪要',
    file: null as File | null
  });
  const [editForm, setEditForm] = useState({
    name: company.name,
    code: company.code,
    type: company.type,
    description: company.description
  });
  const [reportEditForm, setReportEditForm] = useState({
    title: '',
    analyst: '',
    category: '',
    createdAt: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredReports = selectedCategory === '全部' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  // 按顺序排序报告
  const sortedReports = [...filteredReports].sort((a, b) => {
    const orderA = a.order ?? 999999;
    const orderB = b.order ?? 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 如果order相同，按创建时间排序
    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  const loadReports = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const data = await reportApi.getByCompany(company.id);
      setReports(data);
      
      if (forceRefresh) {
        toast.success('报告数据已刷新');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('加载报告列表失败');
    } finally {
      if (forceRefresh) {
        // 给用户足够时间看到刷新动画，最少显示800ms
        setTimeout(() => {
          setIsRefreshing(false);
        }, Math.max(800, 0));
      } else {
        setIsLoading(false);
      }
    }
  }, [company.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    setEditForm({
      name: company.name,
      code: company.code,
      type: company.type,
      description: company.description
    });
  }, [company]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        toast.error('请选择PDF文件');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('文件大小不能超过50MB');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.analyst || !uploadForm.file) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReport = await reportApi.upload(company.id, {
        title: uploadForm.title,
        analyst: uploadForm.analyst,
        category: uploadForm.category,
        file: uploadForm.file
      });
      
      // 强制更新报告列表
      setReports(prev => {
        const updated = [newReport, ...prev];
        return [...updated]; // 创建新数组确保重新渲染
      });
      setUploadForm({ title: '', analyst: '', category: '会议纪要', file: null });
      setIsUploadOpen(false);
      toast.success('报告上传成功');
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error('报告上传失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.code || !editForm.type) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedCompany = await companyApi.update(company.id, editForm);
      onCompanyUpdated(updatedCompany);
      setIsEditOpen(false);
      toast.success('公司信息更新成功');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('更新公司信息失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportEditForm.title || !reportEditForm.analyst || !editingReport) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedReport = await reportApi.update(company.id, editingReport.id, {
        title: reportEditForm.title,
        analyst: reportEditForm.analyst,
        category: reportEditForm.category,
        createdAt: reportEditForm.createdAt
      });
      
      // 强制更新报告列表
      setReports(prev => {
        const updated = prev.map(r => r.id === editingReport.id ? updatedReport : r);
        return [...updated]; // 创建新数组确保重新渲染
      });
      setIsReportEditOpen(false);
      setEditingReport(null);
      toast.success('报告信息更新成功');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('更新报告信息失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = () => {
    setIsCompanyDeletePasswordOpen(true);
  };

  const handleConfirmDeleteCompany = async () => {
    try {
      await companyApi.delete(company.id);
      onCompanyDeleted(company.id);
      toast.success('公司删除成功');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('删除公司失败，请重试');
    }
  };

  const handleDeleteReport = (report: Report) => {
    setReportToDelete(report);
    setIsReportDeletePasswordOpen(true);
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      await reportApi.delete(company.id, reportToDelete.id);
      // 强制更新报告列表
      setReports(prev => {
        const updated = prev.filter(r => r.id !== reportToDelete.id);
        return [...updated]; // 创建新数组确保重新渲染
      });
      // 如果当前筛选的分类没有报告了，切换到全部
      const remainingReports = reports.filter(r => r.id !== reportToDelete.id);
      const remainingInCategory = remainingReports.filter(r => r.category === selectedCategory);
      if (selectedCategory !== '全部' && remainingInCategory.length === 0) {
        setSelectedCategory('全部');
      }
      toast.success('报告删除成功');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('删除报告失败，请重试');
    } finally {
      setReportToDelete(null);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      const downloadUrl = await reportApi.getDownloadUrl(company.id, report.id);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('下载报告失败，请重试');
    }
  };

  const handlePreviewReport = async (report: Report) => {
    try {
      const downloadUrl = await reportApi.getDownloadUrl(company.id, report.id);
      window.open(downloadUrl + '#view=FitH', '_blank');
    } catch (error) {
      console.error('Error previewing report:', error);
      toast.error('预览报告失败，请重试');
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    // 修复日期处理，避免时区问题
    const reportDate = report.createdAt ? new Date(report.createdAt) : new Date();
    const localDate = new Date(reportDate.getTime() - reportDate.getTimezoneOffset() * 60000);
    setReportEditForm({
      title: report.title,
      analyst: report.analyst,
      category: report.category,
      createdAt: localDate.toISOString().split('T')[0]
    });
    setIsReportEditOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // 确保日期不受时区影响
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setReportEditForm(prev => ({ 
        ...prev, 
        createdAt: localDate.toISOString().split('T')[0]
      }));
      setIsDatePickerOpen(false);
    }
  };

  const handleCommentsUpdated = useCallback((reportId: string, comments: any[]) => {
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, comments } : r
    ));
  }, []);

  const handleSortReports = (reorderedReports: Report[]) => {
    setReports([...reorderedReports]);
    toast.success('报告排序已更新');
  };

  // 手动刷新函数
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return; // 防止重复点击
    loadReports(true);
  }, [loadReports, isRefreshing]);

  // 获取当前选择的日期对象，用于日历显示
  const getSelectedDate = () => {
    if (!reportEditForm.createdAt) return undefined;
    // 创建本地日期对象，避免时区偏移
    const dateParts = reportEditForm.createdAt.split('-');
    return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  };

  return (
    <>
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {/* Header Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                variant="outline" 
                onClick={onBack}
                className="w-fit hover:shadow-md transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </motion.div>
          </motion.div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <motion.div 
                className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20 overflow-hidden"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
              >
                {company.iconUrl ? (
                  <ImageWithFallback
                    src={company.iconUrl}
                    alt={`${company.name} 图标`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-secondary-foreground" />
                )}
              </motion.div>
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-medium text-foreground">{company.name}</h1>
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
                <p className="text-muted-foreground leading-relaxed max-w-2xl">{company.description}</p>
              </motion.div>
            </div>
            
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline"
                      className="hover:shadow-md transition-all duration-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      编辑信息
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>编辑公司信息</DialogTitle>
                    <DialogDescription>
                      修改公司的基本信息，包括名称、代码、类型和描述。
                    </DialogDescription>
                  </DialogHeader>
                  <motion.form 
                    onSubmit={handleEditSubmit} 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="edit-name">公司名称 *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-code">股票代码 *</Label>
                        <Input
                          id="edit-code"
                          value={editForm.code}
                          onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                          className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-type">股票类型 *</Label>
                      <Select value={editForm.type} onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="mt-1.5 hover:scale-[1.02] transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A股">A股</SelectItem>
                          <SelectItem value="港股">港股</SelectItem>
                          <SelectItem value="美股">美股</SelectItem>
                          <SelectItem value="行业">行业</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-description">公司描述</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditOpen(false)} 
                        disabled={isSubmitting}
                        className="hover:scale-105 transition-transform duration-200"
                      >
                        取消
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
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
                          {isSubmitting ? '更新中...' : '更新'}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.form>
                </DialogContent>
              </Dialog>

              <CompanyIconUpload 
                company={company}
                onIconUpdated={onCompanyUpdated}
                trigger={
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline"
                      className="hover:shadow-md transition-all duration-300"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      上传Logo
                    </Button>
                  </motion.div>
                }
              />
              
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ 
                          x: '100%',
                          transition: { duration: 0.6 }
                        }}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      上传报告
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>上传研究报告</DialogTitle>
                    <DialogDescription>
                      上传PDF格式的研究报告，文件大小不能超过50MB。
                    </DialogDescription>
                  </DialogHeader>
                  <motion.form 
                    onSubmit={handleUploadSubmit} 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <Label htmlFor="title">报告标题 *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="请输入报告标题"
                        className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="analyst">分析师 *</Label>
                      <Input
                        id="analyst"
                        value={uploadForm.analyst}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, analyst: e.target.value }))}
                        placeholder="请输入分析师姓名"
                        className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">报告类别</Label>
                      <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="mt-1.5 hover:scale-[1.02] transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="会议纪要">会议纪要</SelectItem>
                          <SelectItem value="首次覆盖">首次覆盖</SelectItem>
                          <SelectItem value="跟踪">跟踪</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="file">PDF文件 * (最大50MB)</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="mt-1.5 hover:scale-[1.02] transition-all duration-300"
                        required
                      />
                      {uploadForm.file && (
                        <motion.p 
                          className="text-sm text-muted-foreground mt-2 p-2 bg-secondary/50 rounded-md"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          已选择: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(1)}MB)
                        </motion.p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsUploadOpen(false)} 
                        disabled={isSubmitting}
                        className="hover:scale-105 transition-transform duration-200"
                      >
                        取消
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
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
                          {isSubmitting ? '上传中...' : '上传'}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.form>
                </DialogContent>
              </Dialog>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  onClick={handleDeleteCompany}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:shadow-md hover:shadow-destructive/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除公司
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Statistics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[
            { icon: FileText, label: '研究报告总数', value: reports.length || 0, delay: 0.1 },
            { icon: CalendarIcon, label: '最新报告', value: getLatestReportDate(reports), delay: 0.15, isDate: true },
            { icon: MessageSquare, label: '分析师数量', value: getAnalystCount(reports), delay: 0.2 }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 0.6 + stat.delay, 
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
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <stat.icon className="h-5 w-5 text-secondary-foreground" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className={`${stat.isDate ? 'text-base' : 'text-xl'} font-medium text-foreground`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.7 + stat.delay, 
                          duration: 0.3,
                          type: "spring",
                          stiffness: 200
                        }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
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
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="relative overflow-hidden shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <CardHeader className="border-b relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileText className="h-5 w-5" />
                  </motion.div>
                  研究报告
                </CardTitle>
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={isRefreshing ? "default" : "ghost"}
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading || isRefreshing}
                      className={`border-0 transition-all duration-500 ${
                        isRefreshing 
                          ? 'refresh-button-active text-white shadow-lg shadow-purple-500/25' 
                          : 'hover:bg-secondary/50 hover:scale-105'
                      }`}
                    >
                      <RefreshCw 
                        className={`h-4 w-4 mr-2 transition-all duration-300 ${
                          isRefreshing 
                            ? 'animate-spin text-white drop-shadow-sm' 
                            : isLoading 
                              ? 'animate-spin' 
                              : ''
                        }`} 
                      />
                      <span className={`transition-all duration-300 ${
                        isRefreshing ? 'text-white font-medium drop-shadow-sm' : ''
                      }`}>
                        {isRefreshing ? '刷新中...' : '刷新'}
                      </span>
                    </Button>
                  </motion.div>

                  {/* 排序管理按钮 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReportSortManagerOpen(true)}
                      disabled={reports.length === 0}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      排序管理
                    </Button>
                  </motion.div>

                  <span className="text-sm text-muted-foreground">
                    最后刷新：{new Date().toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              </div>
              
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="bg-secondary/50">
                  {REPORT_CATEGORIES.map((category, index) => {
                    const count = category === '全部' 
                      ? reports.length || 0 
                      : reports.filter(r => r.category === category).length || 0;
                    
                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                      >
                        <TabsTrigger 
                          value={category}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                        >
                          {category} ({count})
                        </TabsTrigger>
                      </motion.div>
                    );
                  })}
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="p-6 relative z-10">
              {isLoading ? (
                <SkeletonLoader type="reports" count={3} />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {sortedReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ 
                          delay: index * 0.03,
                          duration: 0.3,
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
                  
                  <AnimatePresence>
                    {sortedReports.length === 0 && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
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
                            <h3 className="font-medium text-foreground mb-2">
                              {reports.length === 0 ? '暂无研究报告' : '该分类下暂无报告'}
                            </h3>
                            <p className="text-muted-foreground">
                              {reports.length === 0 ? '点击"上传报告"按钮添加第一份报告' : '切换分类查看其他报告'}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Edit Dialog */}
        <Dialog open={isReportEditOpen} onOpenChange={setIsReportEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>编辑报告信息</DialogTitle>
              <DialogDescription>
                修改报告的标题、分析师、分类信息和上传日期。注意：无法修改已上传的PDF文件。
              </DialogDescription>
            </DialogHeader>
            <motion.form 
              onSubmit={handleReportEditSubmit} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <Label htmlFor="report-title">报告标题 *</Label>
                <Input
                  id="report-title"
                  value={reportEditForm.title}
                  onChange={(e) => setReportEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                  required
                />
              </div>
              <div>
                <Label htmlFor="report-analyst">分析师 *</Label>
                <Input
                  id="report-analyst"
                  value={reportEditForm.analyst}
                  onChange={(e) => setReportEditForm(prev => ({ ...prev, analyst: e.target.value }))}
                  className="mt-1.5 focus:scale-[1.02] transition-all duration-300"
                  required
                />
              </div>
              <div>
                <Label htmlFor="report-category">报告类别</Label>
                <Select value={reportEditForm.category} onValueChange={(value) => setReportEditForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1.5 hover:scale-[1.02] transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="会议纪要">会议纪要</SelectItem>
                    <SelectItem value="首次覆盖">首次覆盖</SelectItem>
                    <SelectItem value="跟踪">跟踪</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-date">上传日期</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1.5 hover:scale-[1.02] transition-all duration-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportEditForm.createdAt ? formatDate(reportEditForm.createdAt) : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={getSelectedDate()}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsReportEditOpen(false)} 
                  disabled={isSubmitting}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  取消
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
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
                    {isSubmitting ? '更新中...' : '更新'}
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Password Confirmation Dialogs */}
      <PasswordConfirmDialog
        isOpen={isCompanyDeletePasswordOpen}
        onOpenChange={setIsCompanyDeletePasswordOpen}
        onConfirm={handleConfirmDeleteCompany}
        title="确认删除公司"
        description={`您确定要删除公司 "${company.name}" 吗？此操作将同时删除该公司的所有研究报告，且无法撤销。请输入删除密码以继续操作。`}
        confirmButtonText="确认删除"
      />

      <PasswordConfirmDialog
        isOpen={isReportDeletePasswordOpen}
        onOpenChange={(open) => {
          setIsReportDeletePasswordOpen(open);
          if (!open) setReportToDelete(null);
        }}
        onConfirm={handleConfirmDeleteReport}
        title="确认删除报告"
        description={`您确定要删除报告 "${reportToDelete?.title}" 吗？此操作无法撤销。请输入删除密码以继续操作。`}
        confirmButtonText="确认删除"
      />

      {/* Report Sort Manager Dialog */}
      <SortManager
        isOpen={isReportSortManagerOpen}
        onOpenChange={setIsReportSortManagerOpen}
        title="报告排序管理"
        description="调整报告在列表中的显示顺序。使用上下箭头按钮移动报告位置，完成后点击保存排序。"
        items={reports}
        type="report"
        onReorder={handleSortReports}
      />
    </>
  );
}