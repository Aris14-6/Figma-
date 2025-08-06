import React, { useState, useCallback } from 'react';
import { Search, Plus, Building2, TrendingUp, Users, Edit, Trash2, MoreHorizontal, Image, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CompanyIconUpload } from './CompanyIconUpload';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { SortManager } from './SortManager';
import { SkeletonLoader } from './SkeletonLoader';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { companyApi } from '../utils/api';
import { getTypeColor, STOCK_TYPES } from '../utils/constants';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import type { Company } from '../App';

interface CompanyListProps {
  companies: Company[];
  onCompanySelect: (company: Company) => void;
  onCompanyCreated: (company: Company) => void;
  onCompanyUpdated: (company: Company) => void;
  onCompanyDeleted: (id: string) => void;
  onCompaniesReorder: (companies: Company[]) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

interface CompanyFormData {
  name: string;
  code: string;
  type: string;
  description: string;
}

export function CompanyList({ 
  companies, 
  onCompanySelect, 
  onCompanyCreated, 
  onCompanyUpdated, 
  onCompanyDeleted,
  onCompaniesReorder,
  onRefresh,
  isLoading = false,
  isRefreshing = false
}: CompanyListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('全部类型');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSortManagerOpen, setIsSortManagerOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    code: '',
    type: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '全部类型' || company.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 按顺序排序公司
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const orderA = a.order ?? 999999;
    const orderB = b.order ?? 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 如果order相同，按创建时间排序
    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  // 修复表单重置函数，确保不会触发不必要的渲染
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      code: '',
      type: '',
      description: ''
    });
    setEditingCompany(null);
  }, []);

  const handleCreateCompany = useCallback(() => {
    resetForm();
    setIsCreateDialogOpen(true);
  }, [resetForm]);

  const handleEditCompany = useCallback((company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      type: company.type,
      description: company.description
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteCompany = useCallback((company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCompanyToDelete(company);
    setIsPasswordDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!companyToDelete) return;
    
    try {
      await companyApi.delete(companyToDelete.id);
      onCompanyDeleted(companyToDelete.id);
      toast.success('公司删除成功');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('删除公司失败，请重试');
    } finally {
      setCompanyToDelete(null);
    }
  }, [companyToDelete, onCompanyDeleted]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.type) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingCompany) {
        const updatedCompany = await companyApi.update(editingCompany.id, formData);
        onCompanyUpdated(updatedCompany);
        setIsEditDialogOpen(false);
      } else {
        const newCompany = await companyApi.create(formData);
        onCompanyCreated(newCompany);
        setIsCreateDialogOpen(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(editingCompany ? '更新公司失败，请重试' : '创建公司失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingCompany, onCompanyUpdated, onCompanyCreated, resetForm]);

  const handleSortCompanies = useCallback((reorderedCompanies: Company[]) => {
    onCompaniesReorder(reorderedCompanies);
    toast.success('公司排序已更新');
  }, [onCompaniesReorder]);

  // 优化表单组件，使用React.memo避免不必要的重渲染
  const CompanyForm = React.memo(() => (
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
          <Label htmlFor="name" className="block mb-2">公司名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入公司名称"
            required
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Label htmlFor="code" className="block mb-2">股票代码 *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="如 000001、0700.HK、AAPL"
            required
            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
          />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Label htmlFor="type" className="block mb-2">股票类型 *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md focus:shadow-lg focus:shadow-primary/10">
            <SelectValue placeholder="选择股票类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A股">A股</SelectItem>
            <SelectItem value="港股">港股</SelectItem>
            <SelectItem value="美股">美股</SelectItem>
            <SelectItem value="行业">行业</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Label htmlFor="description" className="block mb-2">公司描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="请输入公司描述"
          rows={3}
          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
        />
      </motion.div>
      
      <motion.div 
        className="flex justify-end gap-3 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (editingCompany) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
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
            {isSubmitting ? '提交中...' : (editingCompany ? '更新' : '创建')}
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  ));

  // 如果没有数据且不在加载中，显示骨架屏
  if (companies.length === 0 && !isLoading) {
    return <SkeletonLoader type="companyList" count={6} />;
  }

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
      {/* Header Section */}
      <div className="space-y-6">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div>
            <h2 className="text-xl font-medium text-foreground">投资研究管理</h2>
            <p className="text-muted-foreground mt-1">管理各公司的研究报告和投资信息</p>
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <motion.div
                whileHover={{ scale: isRefreshing ? 1 : 1.05 }}
                whileTap={{ scale: isRefreshing ? 1 : 0.95 }}
              >
                <Button
                  variant={isRefreshing ? "default" : "outline"}
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading || isRefreshing}
                  className={`relative overflow-hidden border-0 transition-all duration-500 ${
                    isRefreshing 
                      ? 'refresh-button-active text-white shadow-lg shadow-purple-500/25' 
                      : 'hover:shadow-md hover:bg-secondary/50 hover:scale-105'
                  }`}
                >
                  {/* 刷新时的流光动画 */}
                  {isRefreshing && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* 刷新时的脉冲背景 */}
                  {isRefreshing && (
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      animate={{
                        opacity: [0, 0.3, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <motion.div
                    className="flex items-center relative z-10"
                    animate={isRefreshing ? { 
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{
                      duration: 0.8,
                      repeat: isRefreshing ? Infinity : 0,
                      ease: "easeInOut"
                    }}
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
                  </motion.div>
                </Button>
              </motion.div>
            )}

            {/* 排序管理按钮 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSortManagerOpen(true)}
                disabled={companies.length === 0}
                className="hover:shadow-md transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                排序管理
              </Button>
            </motion.div>
            
            <motion.span 
              className={`text-sm transition-all duration-300 ${
                isRefreshing ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                scale: isRefreshing ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                delay: 0.3, 
                duration: 0.4,
                scale: {
                  duration: 1,
                  repeat: isRefreshing ? Infinity : 0,
                  ease: "easeInOut"
                }
              }}
            >
              {isRefreshing ? '正在刷新数据...' : `最后刷新：${new Date().toLocaleTimeString('zh-CN')}`}
            </motion.span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                >
                  <Button 
                    onClick={handleCreateCompany}
                    className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ 
                        x: '100%',
                        transition: { duration: 0.6 }
                      }}
                    />
                    <Plus className="h-4 w-4 mr-2" />
                    添加公司
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>添加新公司</DialogTitle>
                  <DialogDescription>
                    创建一个新的投资研究标的，填写基本信息后即可开始上传相关研究报告。
                  </DialogDescription>
                </DialogHeader>
                <CompanyForm />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          className="flex items-center gap-4 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative flex-1 min-w-80 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
            <Input
              placeholder="搜索公司名称或股票代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10"
            />
          </div>
          <div className="flex gap-2">
            {STOCK_TYPES.map((type, index) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.3 + index * 0.05, 
                  duration: 0.4 
                }}
              >
                <Button
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={`transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    selectedType === type 
                      ? 'shadow-lg shadow-primary/20' 
                      : 'hover:shadow-primary/10'
                  }`}
                >
                  {type}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Statistics Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {[
          { icon: Building2, label: '跟踪公司', value: companies.length, delay: 0.1 },
          { icon: TrendingUp, label: '股票类型', value: new Set(companies.map(c => c.type)).size, delay: 0.15 },
          { icon: Users, label: '搜索结果', value: filteredCompanies.length, delay: 0.2 }
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
                      className="text-xl font-medium text-foreground"
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
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Company Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <AnimatePresence mode="popLayout">
          {sortedCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{ 
                scale: 1.02,
                y: -4,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer group relative overflow-hidden transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/10"
                onClick={() => onCompanySelect(company)}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <CardContent className="p-4 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <motion.div 
                          className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden"
                          whileHover={{ rotate: 5 }}
                        >
                          {company.iconUrl ? (
                            <ImageWithFallback
                              src={company.iconUrl}
                              alt={`${company.name} 图标`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-secondary-foreground" />
                          )}
                        </motion.div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-300">
                            {company.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">{company.code}</p>
                        </div>
                      </div>
                      <motion.div 
                        className="transition-all duration-300 flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-secondary/50 transition-colors duration-200 text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-200">
                            <DropdownMenuItem 
                              onClick={(e) => handleEditCompany(company, e)}
                              className="hover:bg-secondary/50 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              编辑信息
                            </DropdownMenuItem>
                            <CompanyIconUpload 
                              company={company}
                              onIconUpdated={onCompanyUpdated}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="hover:bg-secondary/50 transition-colors duration-200"
                                >
                                  <Image className="h-4 w-4 mr-2" />
                                  上传Logo
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteCompany(company, e)}
                              className="text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge className={`text-xs w-fit shadow-sm ${getTypeColor(company.type)} hover:shadow-md transition-all duration-200`}>
                          {company.type}
                        </Badge>
                      </motion.div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                        {company.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      <AnimatePresence>
        {filteredCompanies.length === 0 && companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
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
                  <Building2 className="h-8 w-8 text-secondary-foreground" />
                </motion.div>
                <h3 className="font-medium text-foreground mb-2">没有找到匹配的公司</h3>
                <p className="text-muted-foreground mb-4">尝试调整搜索条件或筛选器</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑公司信息</DialogTitle>
            <DialogDescription>
              修改公司的基本信息，包括名称、代码、类型和描述。
            </DialogDescription>
          </DialogHeader>
          <CompanyForm />
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        isOpen={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) setCompanyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="确认删除公司"
        description={`您确定要删除公司 "${companyToDelete?.name}" 吗？此操作将同时删除该公司的所有研究报告，且无法撤销。请输入删除密码以继续操作。`}
        confirmButtonText="确认删除"
      />

      {/* Sort Manager Dialog */}
      <SortManager
        isOpen={isSortManagerOpen}
        onOpenChange={setIsSortManagerOpen}
        title="公司排序管理"
        description="调整公司在列表中的显示顺序。使用上下箭头按钮移动公司位置，完成后点击保存排序。"
        items={companies}
        type="company"
        onReorder={handleSortCompanies}
      />
    </motion.div>
  );
}