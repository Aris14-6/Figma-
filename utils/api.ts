@@ .. @@
  async uploadIcon(id: string, file: File): Promise<Company> {
    clearCachePattern('companies');
    const formData = new FormData();
    formData.append('icon', file);
    
    return makeRequest<Company>(`${API_BASE_URL}/companies/${id}/icon`, {
      method: 'POST',
      headers: createFormHeaders(),
      body: formData,
    });
  },

+  async removeIcon(id: string): Promise<Company> {
+    clearCachePattern('companies');
+    return makeRequest<Company>(`${API_BASE_URL}/companies/${id}/icon`, {
+      method: 'DELETE',
+      headers: createAuthHeaders(),
+    });
+  },
 };