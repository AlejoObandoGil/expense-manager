'use client';

import { useState, useEffect } from 'react';
import { createCategory } from '@/app/actions/categories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');
  const [color, setColor] = useState('#3b82f6');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setType('expense');
      setColor('#3b82f6');
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const emoji = formData.get('emoji') as string;

    try {
      const result = await createCategory({
        name,
        emoji,
        color,
        type,
      });

      if (result.success) {
        toast.success('Categoría creada', {
          description: `${emoji} ${name}`,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Parse validation errors from Zod
        const errorMessage = result.error || 'Error desconocido';
        if (errorMessage.includes(';')) {
          const errorParts = errorMessage.split('; ');
          const newErrors: Record<string, string> = {};
          errorParts.forEach((err) => {
            if (err.includes('nombre')) newErrors.name = err;
            else if (err.includes('emoji')) newErrors.emoji = err;
            else if (err.includes('color')) newErrors.color = err;
            else newErrors.general = err;
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: errorMessage });
        }
        toast.error('Error', {
          description: errorMessage,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo guardar la categoría';
      setErrors({ general: message });
      toast.error('Error', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">➕</span>
            Nueva Categoría
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ej: Comida"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <Input
              id="emoji"
              name="emoji"
              required
              maxLength={2}
              placeholder="Ej: 🍔"
            />
            {errors.emoji && (
              <p className="text-xs text-red-500">{errors.emoji}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                placeholder="#000000"
                value={color}
                readOnly
                className="flex-1"
              />
            </div>
            {errors.color && (
              <p className="text-xs text-red-500">{errors.color}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">💸 Gasto</SelectItem>
                <SelectItem value="income">💵 Ingreso</SelectItem>
                <SelectItem value="both">📊 Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errors.general && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {errors.general}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
