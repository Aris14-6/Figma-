export const STOCK_TYPES = ['全部类型', 'A股', '港股', '美股', '行业'] as const;

export const REPORT_CATEGORIES = ['全部', '会议纪要', '首次覆盖', '跟踪'] as const;

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'A股': return 'bg-red-50 text-red-600 border-red-100 shadow-red-500/5';
    case '港股': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5';
    case '美股': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5';
    case '行业': return 'bg-orange-50 text-orange-600 border-orange-100 shadow-orange-500/5';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case '会议纪要': return 'bg-purple-50 text-purple-600 border-purple-100 shadow-purple-500/5';
    case '首次覆盖': return 'bg-green-50 text-green-600 border-green-100 shadow-green-500/5';
    case '跟踪': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};