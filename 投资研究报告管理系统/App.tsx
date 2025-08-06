import React, { useState, useEffect, useCallback } from 'react';
import { CompanyList } from './components/CompanyList';
import { CompanyDetail } from './components/CompanyDetail';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toaster } from './components/ui/sonner';
import { companyApi, initSampleData } from './utils/api';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

export type Company = {
  id: string;
  name: string;
  code: string;
  type: string; // A股、港股、美股、行业
  description: string;
  iconUrl?: string; // 公司图标URL
  order?: number; // 显示顺序
  createdAt?: string;
  updatedAt?: string;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

export type Report = {
  id: string;
  companyId: string;
  title: string;
  analyst: string;
  fileName: string;
  fileSize: string;
  category: string; // 会议纪要、首次覆盖、跟踪
  comments?: Comment[]; // 报告评论
  filePath?: string;
  order?: number; // 显示顺序
  createdAt?: string;
  updatedAt?: string;
};

export default function App() {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 新增：手动刷新状态

  // 修复loadCompanies函数的依赖项问题
  const loadCompanies = useCallback(async (forceRefresh = false) => {
    try {
      // 如果不是强制刷新且已有数据且不是初始加载，跳过加载
      if (!forceRefresh && companies.length > 0 && !isInitialLoad) {
        return;
      }

      // 区分初始加载和手动刷新
      if (isInitialLoad) {
        setLoading(true);
      } else if (forceRefresh) {
        setIsRefreshing(true);
      }

      const data = await companyApi.getAll();
      
      // 只在没有数据时初始化示例数据
      if (data.length === 0) {
        await initSampleData();
        const sampleData = await companyApi.getAll();
        setCompanies(sampleData);
      } else {
        setCompanies(data);
      }

      // 手动刷新成功提示
      if (forceRefresh && !isInitialLoad) {
        toast.success('数据已刷新');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('加载公司列表失败，请刷新页面重试');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      } else if (forceRefresh) {
        // 给用户足够时间看到刷新动画，最少显示800ms
        setTimeout(() => {
          setIsRefreshing(false);
        }, Math.max(800, 0));
      }
    }
  }, [isInitialLoad]);

  // 初始加载
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleCompanySelect = useCallback((company: Company) => {
    setSelectedCompany(company);
    setCurrentView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedCompany(null);
  }, []);

  const handleCompanyCreated = useCallback((newCompany: Company) => {
    setCompanies(prev => [newCompany, ...prev]);
    toast.success('公司创建成功');
  }, []);

  const handleCompanyUpdated = useCallback((updatedCompany: Company) => {
    setCompanies(prev => 
      prev.map(company => 
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
    if (selectedCompany?.id === updatedCompany.id) {
      setSelectedCompany(updatedCompany);
    }
    toast.success('公司信息更新成功');
  }, [selectedCompany?.id]);

  const handleCompanyDeleted = useCallback((deletedId: string) => {
    setCompanies(prev => prev.filter(company => company.id !== deletedId));
    if (selectedCompany?.id === deletedId) {
      setCurrentView('list');
      setSelectedCompany(null);
    }
    toast.success('公司删除成功');
  }, [selectedCompany?.id]);

  // 处理公司排序
  const handleCompaniesReorder = useCallback(async (reorderedCompanies: Company[]) => {
    try {
      setCompanies(reorderedCompanies);
      // 批量更新排序
      await companyApi.updateOrder(reorderedCompanies.map((company, index) => ({
        id: company.id,
        order: index
      })));
    } catch (error) {
      console.error('Error updating company order:', error);
      toast.error('保存排序失败，请重试');
      // 重新加载以恢复原始顺序 - 使用forceRefresh避免依赖检查
      const data = await companyApi.getAll();
      setCompanies(data);
    }
  }, []);

  // 手动刷新函数
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return; // 防止重复点击
    loadCompanies(true);
  }, [loadCompanies, isRefreshing]);

  // 只在初始加载时显示全屏loading
  if (loading && isInitialLoad) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        companies={companies} 
        onCompanySelect={handleCompanySelect}
      />
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <CompanyList 
                companies={companies}
                onCompanySelect={handleCompanySelect}
                onCompanyCreated={handleCompanyCreated}
                onCompanyUpdated={handleCompanyUpdated}
                onCompanyDeleted={handleCompanyDeleted}
                onCompaniesReorder={handleCompaniesReorder}
                onRefresh={handleRefresh}
                isLoading={loading && !isInitialLoad}
                isRefreshing={isRefreshing} // 新增：传递刷新状态
              />
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <CompanyDetail 
                company={selectedCompany!} 
                onBack={handleBackToList}
                onCompanyUpdated={handleCompanyUpdated}
                onCompanyDeleted={handleCompanyDeleted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          className: 'shadow-xl backdrop-blur-sm',
        }}
      />
    </div>
  );
}