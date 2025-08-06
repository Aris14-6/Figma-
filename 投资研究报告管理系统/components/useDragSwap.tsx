import { useState, useRef, useCallback } from 'react';

interface DragSwapItem {
  id: string;
  name: string;
  type: 'company' | 'report';
}

interface UseDragSwapProps {
  onSwapItems: (sourceId: string, targetId: string) => void;
}

interface DragState {
  isDragging: boolean;
  draggedItem: DragSwapItem | null;
  draggedElement: HTMLElement | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export function useDragSwap({ onSwapItems }: UseDragSwapProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    draggedElement: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });
  
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);

  const startLongPress = useCallback((
    element: HTMLElement,
    item: DragSwapItem,
    startPos: { x: number; y: number }
  ) => {
    longPressTimerRef.current = setTimeout(() => {
      // 开始拖拽
      setDragState({
        isDragging: true,
        draggedItem: item,
        draggedElement: element,
        startPosition: startPos,
        currentPosition: startPos
      });
      
      // 添加全局鼠标移动和释放监听
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      // 添加视觉反馈
      element.style.transform = 'scale(1.1) rotate(5deg)';
      element.style.zIndex = '9999';
      element.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
    }, 500); // 500ms长按
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && dragState.draggedElement) {
      const newPosition = { x: e.clientX, y: e.clientY };
      setDragState(prev => ({ ...prev, currentPosition: newPosition }));
      
      // 更新拖拽元素位置
      const offsetX = newPosition.x - dragState.startPosition.x;
      const offsetY = newPosition.y - dragState.startPosition.y;
      dragState.draggedElement.style.transform = 
        `translate(${offsetX}px, ${offsetY}px) scale(1.1) rotate(5deg)`;
      
      // 检测悬停目标
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      const targetElement = elementUnderCursor?.closest('[data-swap-target]');
      const targetId = targetElement?.getAttribute('data-swap-target');
      
      setHoveredTarget(targetId || null);
    }
  }, [dragState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (dragState.isDragging && dragState.draggedElement && e.touches[0]) {
      const touch = e.touches[0];
      const newPosition = { x: touch.clientX, y: touch.clientY };
      setDragState(prev => ({ ...prev, currentPosition: newPosition }));
      
      // 更新拖拽元素位置
      const offsetX = newPosition.x - dragState.startPosition.x;
      const offsetY = newPosition.y - dragState.startPosition.y;
      dragState.draggedElement.style.transform = 
        `translate(${offsetX}px, ${offsetY}px) scale(1.1) rotate(5deg)`;
      
      // 检测悬停目标
      const elementUnderCursor = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetElement = elementUnderCursor?.closest('[data-swap-target]');
      const targetId = targetElement?.getAttribute('data-swap-target');
      
      setHoveredTarget(targetId || null);
    }
  }, [dragState]);

  const finishDrag = useCallback(() => {
    if (dragState.isDragging && dragState.draggedItem && hoveredTarget) {
      // 执行交换
      if (hoveredTarget !== dragState.draggedItem.id) {
        onSwapItems(dragState.draggedItem.id, hoveredTarget);
      }
    }
    
    // 清理拖拽状态
    if (dragState.draggedElement) {
      dragState.draggedElement.style.transform = '';
      dragState.draggedElement.style.zIndex = '';
      dragState.draggedElement.style.pointerEvents = '';
    }
    
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setDragState({
      isDragging: false,
      draggedItem: null,
      draggedElement: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 }
    });
    setHoveredTarget(null);
  }, [dragState, hoveredTarget, onSwapItems, handleMouseMove, handleTouchMove]);

  const handleMouseUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handleTouchEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  // 鼠标事件处理器
  const getDragHandlers = useCallback((item: DragSwapItem) => ({
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      const element = e.currentTarget;
      const rect = element.getBoundingClientRect();
      const startPos = { 
        x: e.clientX, 
        y: e.clientY 
      };
      startLongPress(element, item, startPos);
    },
    onMouseUp: () => {
      cancelLongPress();
    },
    onMouseLeave: () => {
      cancelLongPress();
    },
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      e.preventDefault();
      const element = e.currentTarget;
      const touch = e.touches[0];
      const startPos = { 
        x: touch.clientX, 
        y: touch.clientY 
      };
      startLongPress(element, item, startPos);
    },
    onTouchEnd: () => {
      cancelLongPress();
    }
  }), [startLongPress, cancelLongPress]);

  return {
    isDragging: dragState.isDragging,
    draggedItem: dragState.draggedItem,
    hoveredTarget,
    getDragHandlers
  };
}