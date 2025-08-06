import type { Report } from '../App';

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const getLatestReportDate = (reports: Report[]) => {
  if (reports.length === 0) return '-';
  const latest = reports.reduce((latest, report) => 
    new Date(report.createdAt || '') > new Date(latest.createdAt || '') ? report : latest
  );
  return formatDate(latest.createdAt || '');
};

export const getAnalystCount = (reports: Report[]) => {
  return new Set(reports.map(report => report.analyst)).size;
};

export const getTotalComments = (reports: Report[]) => {
  return reports.reduce((total, report) => total + (report.comments?.length || 0), 0);
};

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};