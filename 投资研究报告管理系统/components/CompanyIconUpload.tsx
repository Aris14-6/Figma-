import React, { useState } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { companyApi } from '../utils/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Company } from '../App';

interface CompanyIconUploadProps {
  company: Company;
  onIconUpdated: (company: Company) => void;
  trigger?: React.ReactNode;
}

export function CompanyIconUpload({ company, onIconUpdated, trigger }: CompanyIconUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      
      // 验证文件大小 (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片大小不能超过2MB');
        return;
      }
      
      setSelectedFile(file);
      
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择图片文件');
      return;
    }

    setIsUploading(true);
    try {
      const updatedCompany = await companyApi.uploadIcon(company.id, selectedFile);
      onIconUpdated(updatedCompany);
      setIsDialogOpen(false);
      resetForm();
      toast.success('公司图标更新成功');
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error('上传图标失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveIcon = async () => {
    try {
      setIsUploading(true);
      const updatedCompany = await companyApi.removeIcon(company.id);
      onIconUpdated(updatedCompany);
      setIsDialogOpen(false);
      toast.success('公司图标已删除');
    } catch (error) {
      console.error('Error removing icon:', error);
      toast.error('删除图标失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {trigger || (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-secondary/50 transition-colors duration-200"
            >
              <Upload className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更换公司图标</DialogTitle>
          <DialogDescription>
            上传自定义图标来个性化您的公司展示。支持 JPG、PNG 格式，最大 2MB。
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 当前图标显示 */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20 overflow-hidden">
                {company.iconUrl ? (
                  <ImageWithFallback
                    src={company.iconUrl}
                    alt={`${company.name} 图标`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="h-8 w-8 text-secondary-foreground" />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">当前图标</p>
          </div>

          {/* 文件选择 */}
          <div className="space-y-3">
            <Label htmlFor="icon-file">选择新图标</Label>
            <Input
              id="icon-file"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hover:scale-[1.02] transition-all duration-300"
            />
          </div>

          {/* 预览 */}
          {previewUrl && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Label>预览</Label>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20 overflow-hidden relative group">
                  <img 
                    src={previewUrl} 
                    alt="预览" 
                    className="w-full h-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => {
                        setSelectedFile(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                        }
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground text-center">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
                </p>
              )}
            </motion.div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between gap-3">
            {company.iconUrl && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline"
                  onClick={handleRemoveIcon}
                  disabled={isUploading}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                >
                  删除当前图标
                </Button>
              </motion.div>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
                className="hover:scale-105 transition-transform duration-200"
              >
                取消
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  {isUploading && (
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
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? '上传中...' : '上传图标'}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}