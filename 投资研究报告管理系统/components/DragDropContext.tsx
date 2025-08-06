import React, { createContext, useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isTouchDevice } from '../utils/helpers';

interface DragDropContextProps {
  children: React.ReactNode;
}

const DragDropContext = createContext<{
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}>({
  isDragging: false,
  setIsDragging: () => {}
});

export const useDragDropContext = () => useContext(DragDropContext);

export function DragDropProvider({ children }: DragDropContextProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  // 根据设备类型选择后端
  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={backend}>
      <DragDropContext.Provider value={{ isDragging, setIsDragging }}>
        {children}
      </DragDropContext.Provider>
    </DndProvider>
  );
}