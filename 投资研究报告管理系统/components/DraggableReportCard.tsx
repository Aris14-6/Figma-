import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FileText, Download, Edit, Trash2, MoreHorizontal, Eye, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ReportComments } from './ReportComments';
import { getCategoryColor } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import { motion } from 'motion/react';
import type { Report } from '../App';

interface DraggableReportCardProps {
  report: Report;
  index: number;
  companyId: string;
  onPreviewReport: (report: Report) => void;
  onDownloadReport: (report: Report) => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (report: Report) => void;
  onCommentsUpdated: (reportId: string, comments: any[]) => void;
  onMoveReport: (dragIndex: number, hoverIndex: number) => void;
  isDragDisabled?: boolean;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function DraggableReportCard({
  report,
  index,
  companyId,
  onPreviewReport,
  onDownloadReport,
  onEditReport,
  onDeleteReport,
  onCommentsUpdated,
  onMoveReport,
  isDragDisabled = false
}: DraggableReportCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'report',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // 不要替换自己
      if (dragIndex === hoverIndex) {
        return;
      }

      // 确定矩形边界
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // 获取垂直中点
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // 确定鼠标位置
      const clientOffset = monitor.getClientOffset();

      // 获取相对于悬停目标顶部的鼠标位置
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      // 只在鼠标越过一半高度时执行移动
      // 向下拖拽时，只有当光标低于50%时才移动
      // 向上拖拽时，只有当光标高于50%时才移动

      // 向下拖拽
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // 向上拖拽
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // 执行移动
      onMoveReport(dragIndex, hoverIndex);

      // 注意：我们正在改变监视器中的项目！
      // 通常最好避免突变，但这里出于性能考虑是可以的
      // 因为我们重新渲染所有内容
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'report',
    item: () => {
      return { id: report.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isDragDisabled,
  });

  const opacity = isDragging ? 0.4 : 1;

  // 拖拽句柄
  const dragHandle = drag(drop(ref));

  return (
    <motion.div
      ref={dragPreview}
      style={{ opacity }}
      className={`transition-all duration-200 ${isDragging ? 'rotate-1 scale-105' : ''}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        scale: isDragging ? 1.05 : 1.01,
        y: isDragging ? 0 : -2,
        transition: { duration: 0.2 }
      }}
      data-handler-id={handlerId}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 group border-0 bg-card/50 backdrop-blur-sm ${
        isDragging 
          ? 'shadow-2xl shadow-primary/20 bg-primary/5' 
          : 'hover:shadow-md hover:shadow-black/5'
      }`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* 拖拽指示器 */}
        <div 
          ref={dragHandle}
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-200 cursor-grab active:cursor-grabbing ${
            isDragging ? 'bg-primary' : 'bg-muted-foreground/20 group-hover:bg-primary/50'
          }`}
        />
        
        <CardContent className="p-4 relative z-10 ml-4">
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
                companyId={companyId}
                reportId={report.id}
                comments={report.comments || []}
                onCommentsUpdated={(comments) => onCommentsUpdated(report.id, comments)}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onPreviewReport(report)}
                  className="hover:shadow-md transition-all duration-200"
                  disabled={isDragging}
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
                  onClick={() => onDownloadReport(report)}
                  className="hover:shadow-md transition-all duration-200"
                  disabled={isDragging}
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
                      disabled={isDragging}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-200">
                  <DropdownMenuItem 
                    onClick={() => onEditReport(report)}
                    className="hover:bg-secondary/50 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑信息
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteReport(report)}
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

        {/* 拖拽状态指示器 */}
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-primary font-medium text-sm">拖拽中...</div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}