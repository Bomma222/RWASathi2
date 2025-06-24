import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function NoticesModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isImportant: false,
  });

  const { data: notices, isLoading } = useQuery({
    queryKey: ['/api/notices'],
  });

  const createNoticeMutation = useMutation({
    mutationFn: async (noticeData: any) => {
      return apiRequest('POST', '/api/notices', noticeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: "Success",
        description: "Notice posted successfully",
      });
      setFormData({ title: '', description: '', isImportant: false });
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post notice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createNoticeMutation.mutate({
      ...formData,
      adminId: user?.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('notices')}</h2>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowForm(!showForm)}>
            <i className="fas fa-plus mr-2"></i>
            {t('postNotice')}
          </Button>
        )}
      </div>

      {/* Notice Form */}
      {showForm && user?.role === 'admin' && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Notice Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Notice Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Enter detailed notice description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData(prev => ({ ...prev, isImportant: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="important">Mark as Important</Label>
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createNoticeMutation.isPending}
                >
                  {createNoticeMutation.isPending ? t('loading') : 'Post Notice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {notices?.map((notice: any) => (
          <Card key={notice.id} className={notice.isImportant ? 'border-l-4 border-l-red-500' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  {notice.isImportant && (
                    <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                  )}
                  {notice.title}
                </h3>
                <span className="text-xs text-gray-500">
                  {t('posted')} {getTimeAgo(notice.createdAt)}
                </span>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{notice.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                Posted by Admin
              </div>
            </CardContent>
          </Card>
        ))}
        {(!notices || notices.length === 0) && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No notices available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;
  if (diffDays < 7) return `${diffDays} ${t('daysAgo')}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${t('weekAgo')}`;
  return `${Math.floor(diffDays / 30)} ${t('monthAgo')}`;
}
