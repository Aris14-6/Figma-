import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Building2, Edit, Trash2, MoreHorizontal, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CompanyIconUpload } from './CompanyIconUpload';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getTypeColor } from '../utils/constants';
import { motion } from 'motion/react';
import type { Company } from '../App';

interface DraggableCompanyCardProps {
  company: Company;
  index: number;
  onCompanySelect: (company: Company) => void;
  onCompanyUpdated: (company: Company) => void;
  onEditCompany: (company: Company, e: React.MouseEvent) => void;
  onDeleteCompany: (company: Company, e: React.MouseEvent) => void;
  onMoveCompany: (dragIndex: number, hoverIndex: number) => void;
  isDragDisabled?: boolean;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function DraggableCompanyCard({
  company,
  index,
  onCompanySelect,
  onCompanyUpdated,
  onEditCompany,
  onDeleteCompany,
  onMoveCompany,
  isDragDisabled = false
}: DraggableCompanyCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'company',
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
      onMoveCompany(dragIndex, hoverIndex);

      // 注意：我们正在改变监视器中的项目！
      // 通常最好避免突变，但这里出于性能考虑是可以的
      // 因为我们重新渲染所有内容
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'company',
    item: () => {
      return { id: company.id, index };
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
      className={`transition-all duration-200 ${isDragging ? 'rotate-2 scale-105' : ''}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        scale: isDragging ? 1.05 : 1.02,
        y: isDragging ? 0 : -4,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      data-handler-id={handlerId}
    >
      <Card 
        className={`cursor-pointer group relative overflow-hidden transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm ${
          isDragging 
            ? 'shadow-2xl shadow-primary/20 bg-primary/5' 
            : 'hover:shadow-xl hover:shadow-black/10'
        }`}
        onClick={() => !isDragging && onCompanySelect(company)}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3"
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
                      onClick={(e) => onEditCompany(company, e)}
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
                      onClick={(e) => onDeleteCompany(company, e)}
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