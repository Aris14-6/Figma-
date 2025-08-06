import React from 'react';
import { motion } from 'motion/react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div 
        className="text-center space-y-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        <div className="relative">
          {/* 外圈 */}
          <motion.div 
            className="w-20 h-20 border-2 border-border rounded-full absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
          {/* 中圈 */}
          <motion.div 
            className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full absolute inset-2"
            animate={{ rotate: -360 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
          {/* 内圈 */}
          <motion.div 
            className="w-12 h-12 border-2 border-secondary border-b-transparent rounded-full absolute inset-4"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
          {/* 中心点 */}
          <motion.div 
            className="w-4 h-4 bg-primary rounded-full absolute inset-8"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <h3 className="text-lg font-medium text-foreground">正在加载平台数据</h3>
          <p className="text-muted-foreground">请稍候，正在为您准备最新的投研信息...</p>
        </motion.div>
        
        <motion.div 
          className="flex justify-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}