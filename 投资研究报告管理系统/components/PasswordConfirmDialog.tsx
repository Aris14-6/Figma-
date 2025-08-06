import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
}

export function PasswordConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmButtonText = "确认删除"
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const correctPassword = '1111';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('请输入删除密码');
      return;
    }

    setIsVerifying(true);
    setError('');

    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === correctPassword) {
      onConfirm();
      handleClose();
    } else {
      setError('密码错误，请重试');
      setPassword('');
    }

    setIsVerifying(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    setIsVerifying(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ 
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="space-y-6"
        >
          <DialogHeader className="space-y-4">
            <motion.div 
              className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
            >
              <Lock className="h-8 w-8 text-destructive" />
            </motion.div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                删除密码
              </Label>
              <div className="relative">
                <Input
                  id="delete-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入删除密码"
                  className={`pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary/10 ${
                    error ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isVerifying}
                  autoFocus
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isVerifying}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </motion.button>
              </div>
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      ⚠️
                    </motion.span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
                className="transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                取消
              </Button>
              <motion.div
                whileHover={!isVerifying ? { scale: 1.05 } : {}}
                whileTap={!isVerifying ? { scale: 0.95 } : {}}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isVerifying || !password}
                  className="relative overflow-hidden bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25 transition-all duration-300"
                >
                  {isVerifying && (
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
                  <motion.div
                    className="flex items-center gap-2"
                    animate={isVerifying ? { 
                      scale: [1, 0.98, 1],
                      transition: { duration: 0.5, repeat: Infinity }
                    } : {}}
                  >
                    <Lock className="h-4 w-4" />
                    {isVerifying ? '验证中...' : confirmButtonText}
                  </motion.div>
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.form>

          <motion.div 
            className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="text-xs text-muted-foreground text-center leading-relaxed">
              🔒 此操作需要管理员权限验证
              <br />
              请输入正确的删除密码以继续操作
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}