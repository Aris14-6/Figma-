import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { motion } from 'motion/react';

interface SwapConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  sourceItem: { name: string; type: 'company' | 'report' };
  targetItem: { name: string; type: 'company' | 'report' };
}

export function SwapConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  sourceItem,
  targetItem
}: SwapConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const getItemLabel = (type: 'company' | 'report') => {
    return type === 'company' ? '公司' : '报告';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 180, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </motion.div>
            确认交换排序
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>您确定要交换以下两个{getItemLabel(sourceItem.type)}的显示顺序吗？</p>
            
            <motion.div 
              className="bg-secondary/50 rounded-lg p-4 space-y-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{sourceItem.name}</p>
                  <p className="text-xs text-muted-foreground">当前拖拽的{getItemLabel(sourceItem.type)}</p>
                </div>
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                </motion.div>
                <div className="space-y-1 text-right">
                  <p className="font-medium text-foreground">{targetItem.name}</p>
                  <p className="text-xs text-muted-foreground">目标位置的{getItemLabel(targetItem.type)}</p>
                </div>
              </div>
            </motion.div>
            
            <p className="text-sm text-muted-foreground">
              交换后，两个{getItemLabel(sourceItem.type)}的显示顺序将会互换。
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="flex justify-end gap-3 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="transition-all duration-300 hover:scale-105"
          >
            取消
          </Button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleConfirm}
              className="relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ 
                  x: '100%',
                  transition: { duration: 0.6 }
                }}
              />
              确认交换
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}