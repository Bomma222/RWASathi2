import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const billingFieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["fixed", "variable", "calculated"]),
  category: z.string().min(1, "Category is required"),
  defaultValue: z.string().optional(),
  description: z.string().optional(),
  formula: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
});

type BillingFieldFormData = z.infer<typeof billingFieldSchema>;

export default function BillingFieldsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  const { data: fields, isLoading } = useQuery({
    queryKey: ['/api/billing-fields'],
  });

  const form = useForm<BillingFieldFormData>({
    resolver: zodResolver(billingFieldSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'variable',
      category: '',
      defaultValue: '0',
      description: '',
      formula: '',
      sortOrder: 0,
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: BillingFieldFormData) => {
      return apiRequest('POST', '/api/billing-fields', fieldData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing-fields'] });
      toast({
        title: "Success",
        description: "Billing field created successfully",
      });
      setShowAddDialog(false);
      form.reset();
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BillingFieldFormData> }) => {
      return apiRequest('PUT', `/api/billing-fields/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing-fields'] });
      toast({
        title: "Success",
        description: "Billing field updated successfully",
      });
      setEditingField(null);
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/billing-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing-fields'] });
      toast({
        title: "Success",
        description: "Billing field deleted successfully",
      });
    },
  });

  const onSubmit = (data: BillingFieldFormData) => {
    // Generate name from label if not provided
    if (!data.name || data.name === data.label) {
      data.name = data.label.toLowerCase().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    }
    
    createFieldMutation.mutate(data);
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    form.reset(field);
  };

  const handleUpdate = (data: BillingFieldFormData) => {
    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, data });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'water': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-green-100 text-green-800';
      case 'charges': return 'bg-orange-100 text-orange-800';
      case 'dues': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fixed': return '📌';
      case 'variable': return '📊';
      case 'calculated': return '🧮';
      default: return '📄';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

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
        <h2 className="text-xl font-semibold text-gray-800">Billing Fields Manager</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <i className="fas fa-plus mr-2"></i>
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Billing Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="label">Field Label</Label>
                <Input
                  id="label"
                  {...form.register('label')}
                  placeholder="e.g., Security Deposit"
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Field Type</Label>
                <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="variable">Variable Amount</SelectItem>
                    <SelectItem value="calculated">Calculated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.watch('category')} onValueChange={(value) => form.setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water Charges</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="charges">Additional Charges</SelectItem>
                    <SelectItem value="dues">Dues & Penalties</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input
                  id="defaultValue"
                  {...form.register('defaultValue')}
                  placeholder="0"
                />
              </div>

              {form.watch('type') === 'calculated' && (
                <div>
                  <Label htmlFor="formula">Formula</Label>
                  <Input
                    id="formula"
                    {...form.register('formula')}
                    placeholder="e.g., usedLiters * 0.05"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use field names for calculations (e.g., field1 + field2)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Brief description of this field"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">Display Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...form.register('sortOrder', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createFieldMutation.isPending}>
                  {createFieldMutation.isPending ? 'Creating...' : 'Create Field'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {fields?.map((field: any) => (
          <Card key={field.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTypeIcon(field.type)}</span>
                  <div>
                    <CardTitle className="text-base">{field.label}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(field.category)}`}>
                        {field.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {field.type} • Order: {field.sortOrder}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(field)}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFieldMutation.mutate(field.id)}
                    disabled={deleteFieldMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Default Value:</span>
                  <span className="ml-2 font-medium">₹{field.defaultValue}</span>
                </div>
                {field.formula && (
                  <div>
                    <span className="text-gray-600">Formula:</span>
                    <span className="ml-2 font-mono text-xs">{field.formula}</span>
                  </div>
                )}
              </div>
              {field.description && (
                <p className="text-sm text-gray-600 mt-2">{field.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {fields?.length === 0 && (
        <div className="text-center p-8">
          <p className="text-gray-600">No billing fields configured yet.</p>
          <p className="text-sm text-gray-500 mt-1">Add your first billing field to get started.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Billing Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <div>
                <Label htmlFor="label">Field Label</Label>
                <Input
                  id="label"
                  {...form.register('label')}
                />
              </div>

              <div>
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input
                  id="defaultValue"
                  {...form.register('defaultValue')}
                />
              </div>

              {form.watch('type') === 'calculated' && (
                <div>
                  <Label htmlFor="formula">Formula</Label>
                  <Input
                    id="formula"
                    {...form.register('formula')}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">Display Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...form.register('sortOrder', { valueAsNumber: true })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateFieldMutation.isPending}>
                  {updateFieldMutation.isPending ? 'Updating...' : 'Update Field'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingField(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}