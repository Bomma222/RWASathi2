import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function SubmitComplaint() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    photoUrl: '',
  });

  const submitComplaintMutation = useMutation({
    mutationFn: async (complaintData: any) => {
      return apiRequest('POST', '/api/complaints', complaintData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Your complaint has been submitted successfully",
      });
      setLocation('/complaints');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.subject || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitComplaintMutation.mutate({
      ...formData,
      residentId: user?.id,
      flatNumber: user?.flatNumber,
      priority: 'medium',
    });
  };

  const handleCancel = () => {
    setLocation('/complaints');
  };

  const complaintTypes = [
    { value: 'maintenance', label: t('maintenance') },
    { value: 'electrical', label: t('electrical') },
    { value: 'plumbing', label: t('plumbing') },
    { value: 'security', label: t('security') },
    { value: 'other', label: t('other') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('submitComplaint')}</h2>
        <button onClick={handleCancel} className="text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-card p-4 space-y-4">
        <div>
          <Label htmlFor="type">{t('complaintType')} *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select complaint type" />
            </SelectTrigger>
            <SelectContent>
              {complaintTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">{t('subject')} *</Label>
          <Input
            id="subject"
            type="text"
            placeholder="Brief description of the issue"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">{t('description')} *</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Provide detailed information about the complaint"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="photo">{t('attachPhoto')}</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <i className="fas fa-camera text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600">{t('tapToAddPhoto')}</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                // TODO: Implement Firebase Storage upload
                const file = e.target.files?.[0];
                if (file) {
                  // For now, just show file name
                  toast({
                    title: "File Selected",
                    description: `${file.name} selected. Upload feature coming soon.`,
                  });
                }
              }}
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={handleCancel}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={submitComplaintMutation.isPending}
          >
            {submitComplaintMutation.isPending ? t('loading') : t('submitComplaint')}
          </Button>
        </div>
      </form>
    </div>
  );
}
