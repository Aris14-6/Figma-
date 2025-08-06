import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import type { Company } from '../App';

interface HeaderProps {
  companies: Company[];
  onCompanySelect: (company: Company) => void;
}

export function Header({ companies, onCompanySelect }: HeaderProps) {
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);

  // 公司轮播功能 - 每10秒切换一次
  useEffect(() => {
    if (companies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentCompanyIndex(prev => (prev + 1) % companies.length);
    }, 10000); // 10秒切换一次

    return () => clearInterval(interval);
  }, [companies.length]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'A股':
        return 'bg-red-50 text-red-700 border-red-200';
      case '港股':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '美股':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '行业':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleCompanyClick = (company: Company) => {
    onCompanySelect(company);
  };

  const currentCompany = companies[currentCompanyIndex];

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧品牌署名区域 */}
          <motion.div 
            className="brand-signature"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="brand-decoration">
              <div className="brand-name">
                Kevin
              </div>
              <div className="brand-subtitle">
                Investment Research Platform
              </div>
            </div>
          </motion.div>

          {/* 右侧公司轮播展示 */}
          {companies.length > 0 && (
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {currentCompany && (
                  <motion.div
                    key={currentCompany.id}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="cursor-pointer group"
                    onClick={() => handleCompanyClick(currentCompany)}
                  >
                    <motion.div 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-sm"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        {/* 公司图标 */}
                        <motion.div 
                          className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300"
                          whileHover={{ rotate: 2 }}
                        >
                          {currentCompany.iconUrl ? (
                            <ImageWithFallback
                              src={currentCompany.iconUrl}
                              alt={`${currentCompany.name} 图标`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-secondary-foreground" />
                          )}
                        </motion.div>
                        
                        {/* 公司信息 */}
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                              {currentCompany.name}
                            </h3>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getTypeColor(currentCompany.type)} hover:shadow-sm transition-all duration-200`}
                              >
                                {currentCompany.type}
                              </Badge>
                            </motion.div>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {currentCompany.code}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 轮播指示器 */}
              {companies.length > 1 && (
                <motion.div 
                  className="flex gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {companies.slice(0, Math.min(5, companies.length)).map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentCompanyIndex 
                          ? 'bg-primary w-4' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      onClick={() => setCurrentCompanyIndex(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                  {companies.length > 5 && (
                    <div className="flex items-center ml-1">
                      <span className="text-xs text-muted-foreground">
                        +{companies.length - 5}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}