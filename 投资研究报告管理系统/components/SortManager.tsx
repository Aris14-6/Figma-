import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, GripVertical, Building2, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getTypeColor, getCategoryColor } from '../utils/constants';
import { motion, AnimatePresence } from 'motion/react';
import type { Company, Report } from '../App';

interface SortItem {
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
  iconUrl?: string;
  type: 'company' | 'report';
  originalIndex: number;
}

interface SortManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: Company[] | Report[];
  type: 'company' | 'report';
  onReorder: (items: Company[] | Report[]) => void;
}

export function SortManager({
  isOpen,
  onOpenChange,
  title,
  description,
  items,
  type,
  onReorder
}: SortManagerProps) {
  const [sortedItems, setSortedItems] = useState<SortItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 初始化排序项目
  useEffect(() => {
    if (items.length > 0) {
      const sorted = [...items].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });

      const sortItems = sorted.map((item, index) => {
        if (type === 'company') {
          const company = item as Company;
          return {
            id: company.id,
            name: company.name,
            subtitle: company.code,
            badge: company.type,
            iconUrl: company.iconUrl,
            type: 'company' as const,
            originalIndex: index
          };
        } else {
          const report = item as Report;
          return {
            id: report.id,
            name: report.title,
            subtitle: report.analyst,
            badge: report.category,
            type: 'report' as const,
            originalIndex: index
          };
        }
      });

      setSortedItems(sortItems);
      setHasChanges(false);
    }
  }, [items, type]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sortedItems.length) return;
    
    const newItems = [...sortedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    setSortedItems(newItems);
    setHasChanges(true);
  };

  const moveUp = (index: number) => {
    moveItem(index, index - 1);
  };

  const moveDown = (index: number) => {
    moveItem(index, index + 1);
  };

  const handleSave = () => {
    // 重建原始项目数组，按新顺序排列
    const reorderedOriginalItems = sortedItems.map((sortItem, index) => {
      const originalItem = items.find(item => item.id === sortItem.id);
      return { ...originalItem!, order: index };
    });

    onReorder(reorderedOriginalItems as Company[] | Report[]);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 重置为原始顺序
    if (items.length > 0) {
      const sorted = [...items].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });

      const sortItems = sorted.map((item, index) => {
        if (type === 'company') {
          const company = item as Company;
          return {
            id: company.id,
            name: company.name,
            subtitle: company.code,
            badge: company.type,
            iconUrl: company.iconUrl,
            type: 'company' as const,
            originalIndex: index
          };
        } else {
          const report = item as Report;
          return {
            id: report.id,
            name: report.title,
            subtitle: report.analyst,
            badge: report.category,
            type: 'report' as const,
            originalIndex: index
          };
        }
      });

      setSortedItems(sortItems);
      setHasChanges(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 180, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <GripVertical className="h-5 w-5 text-primary" />
            </motion.div>
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              <AnimatePresence mode="popLayout">
                {sortedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.2,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="group"
                  >
                    <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200">
                      {/* 序号 */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* 图标 */}
                      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.type === 'company' && item.iconUrl ? (
                          <ImageWithFallback
                            src={item.iconUrl}
                            alt={`${item.name} 图标`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            {item.type === 'company' ? (
                              <Building2 className="h-5 w-5 text-secondary-foreground" />
                            ) : (
                              <FileText className="h-5 w-5 text-secondary-foreground" />
                            )}
                          </>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {item.name}
                          </h4>
                          <Badge className={`text-xs shadow-sm ${
                            item.type === 'company' 
                              ? getTypeColor(item.badge!) 
                              : getCategoryColor(item.badge!)
                          } hover:shadow-md transition-all duration-200`}>
                            {item.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveDown(index)}
                            disabled={index === sortedItems.length - 1}
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* 底部按钮 */}
        <motion.div 
          className="flex justify-between items-center pt-4 border-t"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-primary font-medium"
              >
                ✨ 检测到顺序变更
              </motion.span>
            ) : (
              <span>共 {sortedItems.length} 个项目</span>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="transition-all duration-300 hover:scale-105"
            >
              取消
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleSave}
                disabled={!hasChanges}
                className={`relative overflow-hidden transition-all duration-300 ${
                  hasChanges 
                    ? 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30' 
                    : ''
                }`}
              >
                {hasChanges && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
                保存排序
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}