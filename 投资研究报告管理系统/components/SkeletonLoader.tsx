import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from './ui/card';

interface SkeletonLoaderProps {
  type: 'companyList' | 'companyDetail' | 'reports';
  count?: number;
}

export function SkeletonLoader({ type, count = 6 }: SkeletonLoaderProps) {
  const shimmer = {
    initial: { backgroundPosition: '-200px 0' },
    animate: { backgroundPosition: '200px 0' },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  };

  const SkeletonBox = ({ className = "", ...props }) => (
    <motion.div
      className={`bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200px_100%] rounded-md ${className}`}
      style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted))/0.6 50%, hsl(var(--muted)) 100%)' }}
      {...shimmer}
      {...props}
    />
  );

  if (type === 'companyList') {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header skeleton */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-6 w-40" />
              <SkeletonBox className="h-4 w-64" />
            </div>
            <SkeletonBox className="h-9 w-24" />
          </div>
          
          {/* Search and filter skeleton */}
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-10 flex-1 min-w-80" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonBox key={i} className="h-8 w-16" />
              ))}
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                  <div className="space-y-1">
                    <SkeletonBox className="h-6 w-8" />
                    <SkeletonBox className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Company grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <SkeletonBox className="w-10 h-10 rounded-lg" />
                        <div className="space-y-1">
                          <SkeletonBox className="h-4 w-24" />
                          <SkeletonBox className="h-3 w-16" />
                        </div>
                      </div>
                      <SkeletonBox className="w-8 h-8 rounded" />
                    </div>
                    
                    <div className="space-y-2">
                      <SkeletonBox className="h-4 w-16 rounded-full" />
                      <SkeletonBox className="h-3 w-full" />
                      <SkeletonBox className="h-3 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === 'companyDetail') {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header skeleton */}
        <div className="space-y-6">
          <SkeletonBox className="h-9 w-24" />
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <SkeletonBox className="w-14 h-14 rounded-xl" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-7 w-32" />
                  <SkeletonBox className="h-5 w-12 rounded-full" />
                </div>
                <SkeletonBox className="h-5 w-20" />
                <SkeletonBox className="h-4 w-96" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-9 w-20" />
              <SkeletonBox className="h-9 w-24" />
              <SkeletonBox className="h-9 w-20" />
              <SkeletonBox className="h-9 w-20" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                  <div className="space-y-1">
                    <SkeletonBox className="h-6 w-8" />
                    <SkeletonBox className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports section skeleton */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBox className="w-5 h-5" />
                <SkeletonBox className="h-6 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-8 w-16" />
                <SkeletonBox className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBox key={i} className="h-8 w-20 rounded-md" />
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SkeletonLoader type="reports" count={3} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (type === 'reports') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SkeletonBox className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <SkeletonBox className="h-4 w-3/4" />
                      <div className="flex items-center gap-4">
                        <SkeletonBox className="h-3 w-16" />
                        <SkeletonBox className="h-3 w-16" />
                        <SkeletonBox className="h-3 w-12" />
                        <SkeletonBox className="h-4 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-8 w-16" />
                    <SkeletonBox className="h-8 w-12" />
                    <SkeletonBox className="h-8 w-12" />
                    <SkeletonBox className="w-8 h-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}