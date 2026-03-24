'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { getLabServices, createService, updateService, deleteService } from '@/lib/services';
import { Service } from '@/lib/types';

export default function ServicesPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'crown',
    base_price: '',
    description: ''
  });

  const categories = [
    { value: 'crown', label: t('caseTypes.crown') },
    { value: 'bridge', label: t('caseTypes.bridge') },
    { value: 'denture', label: t('caseTypes.denture') },
    { value: 'implant', label: t('caseTypes.implant') },
    { value: 'veneer', label: t('caseTypes.veneer') },
  ];

  useEffect(() => {
    if (profile?.lab_id) {
      fetchServices();
    }
  }, [profile?.lab_id]);

  async function fetchServices() {
    if (!profile?.lab_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getLabServices(profile.lab_id);
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      base_price: service.base_price.toString(),
      description: service.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('services.confirmDelete'))) {
      const success = await deleteService(id);
      if (success) {
        fetchServices();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.lab_id) return;

    const serviceData = {
      lab_id: profile.lab_id,
      name: formData.name,
      category: formData.category,
      base_price: parseFloat(formData.base_price),
      description: formData.description
    };

    let result;
    if (editingService) {
      result = await updateService(editingService.id, serviceData);
    } else {
      result = await createService(serviceData);
    }

    if (result) {
      setShowForm(false);
      setEditingService(null);
      setFormData({ name: '', category: 'crown', base_price: '', description: '' });
      fetchServices();
    }
  };

  if (!profile || profile.role !== 'lab_admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">{t('team.accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('services.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('services.subtitle')}</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingService(null);
              setFormData({ name: '', category: 'crown', base_price: '', description: '' });
              setShowForm(true);
            }}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('services.addService')}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingService ? t('services.editService') : t('services.newService')}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('services.nameLabel')}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Zirconia Crown"
                />
                <Select
                  label={t('services.categoryLabel')}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categories}
                />
                <Input
                  label={t('services.priceLabel')}
                  type="number"
                  step="0.01"
                  required
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <Textarea
                label={t('services.descriptionLabel')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional service details..."
              />
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                  }}
                >
                  {t('team.cancel')}
                </Button>
                <Button type="submit" variant="primary">
                  {t('services.saveService')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('services.nameLabel')}</TableHead>
                <TableHead>{t('services.categoryLabel')}</TableHead>
                <TableHead>{t('services.priceLabel')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {t('services.noServices')}
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium text-slate-900">{service.name}</TableCell>
                    <TableCell className="text-slate-500 italic">
                      {service.category ? t(`caseTypes.${service.category}`) : t('common.uncategorized') || 'Uncategorized'}
                    </TableCell>
                    <TableCell className="text-slate-900 font-semibold">
                      ${service.base_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(service)}
                        className="p-1 h-auto"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
