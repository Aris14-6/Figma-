import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { reportApi } from '../utils/api';
import type { Comment } from '../App';

interface ReportCommentsProps {
  companyId: string;
  reportId: string;
  comments: Comment[];
  onCommentsUpdated: (comments: Comment[]) => void;
}

export function ReportComments({ companyId, reportId, comments, onCommentsUpdated }: ReportCommentsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedComments = await reportApi.addComment(companyId, reportId, {
        content: newComment.trim()
      });
      onCommentsUpdated(updatedComments);
      setNewComment('');
      toast.success('评论添加成功');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('添加评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedComments = await reportApi.updateComment(companyId, reportId, commentId, {
        content: editContent.trim()
      });
      onCommentsUpdated(updatedComments);
      setEditingComment(null);
      setEditContent('');
      toast.success('评论更新成功');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('更新评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const updatedComments = await reportApi.deleteComment(companyId, reportId, commentId);
      onCommentsUpdated(updatedComments);
      toast.success('评论删除成功');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('删除评论失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="hover:shadow-md transition-all duration-200"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            评论 {comments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {comments.length}
              </Badge>
            )}
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>报告评论</DialogTitle>
          <DialogDescription>
            添加您对此报告的评论和备注，所有评论将自动同步到所有设备。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 space-y-4">
          {/* 添加新评论 */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Textarea
              placeholder="添加您的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none focus:scale-[1.02] transition-all duration-300"
            />
            <div className="flex justify-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleAddComment}
                  disabled={isSubmitting || !newComment.trim()}
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
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? '发送中...' : '发送评论'}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* 评论列表 */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-96">
            <AnimatePresence>
              {comments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-dashed border-2 hover:border-primary/20 transition-colors duration-300">
                    <CardContent className="p-8 text-center">
                      <motion.div 
                        className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-3 flex items-center justify-center"
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
                        <MessageSquare className="h-6 w-6 text-secondary-foreground" />
                      </motion.div>
                      <h4 className="font-medium text-foreground mb-1">暂无评论</h4>
                      <p className="text-muted-foreground text-sm">
                        成为第一个评论此报告的人
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Card className="relative overflow-hidden hover:shadow-md hover:shadow-black/5 transition-all duration-300 group">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <CardContent className="p-4 relative z-10">
                        {editingComment?.id === comment.id ? (
                          <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="resize-none focus:scale-[1.02] transition-all duration-300"
                            />
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditContent('');
                                }}
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
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id)}
                                  disabled={isSubmitting || !editContent.trim()}
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
                                  保存
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="text-foreground leading-relaxed flex-1">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setEditingComment(comment);
                                      setEditContent(comment.content);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                  <span className="ml-2">(已编辑)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}