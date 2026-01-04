import { useState, useEffect } from 'react';
import { productApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export default function PulperiaProducts() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.pulperia?.id) {
      fetchProducts();
    }
  }, [user?.pulperia?.id]);

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll({ pulperiaId: user!.pulperia!.id });
      setProducts(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStock('');
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setCategory(product.category || '');
    setStock(product.stock?.toString() || '');
    setImagePreview(product.imageUrl);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    if (!editingProduct && !imageFile) {
      toast.error('Imagen es requerida');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);
      if (stock) formData.append('stock', stock);
      if (imageFile) formData.append('image', imageFile);

      if (editingProduct) {
        await productApi.update(editingProduct.id, formData);
        toast.success('Producto actualizado');
      } else {
        await productApi.create(formData);
        toast.success('Producto creado');
      }

      setShowForm(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      await productApi.delete(productId);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      const formData = new FormData();
      formData.append('isAvailable', (!product.isAvailable).toString());
      await productApi.update(product.id, formData);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-gray-400">Administra el inventario de tu pulpería</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>Agregar producto</span>
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-lg w-full my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Imagen *</label>
                <div className="flex items-center space-x-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-pulpe-dark rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <span>Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Precio (L) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej: Bebidas, Snacks..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="Opcional"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <span className="spinner" /> : editingProduct ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No hay productos</h2>
          <p className="text-gray-400 mb-6">Agrega tu primer producto para empezar a vender</p>
          <button onClick={openCreateForm} className="btn-primary">
            Agregar producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="card group">
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="badge bg-red-500 text-white">Agotado</span>
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => openEditForm(product)}
                    className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-200"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold truncate">{product.name}</h3>
              <p className="text-pulpe-gold font-bold">L{product.price.toFixed(2)}</p>

              {product.category && (
                <span className="badge bg-pulpe-dark text-gray-400 text-xs mt-1">
                  {product.category}
                </span>
              )}

              <button
                onClick={() => handleToggleAvailability(product)}
                className={`mt-2 text-xs ${
                  product.isAvailable ? 'text-green-400' : 'text-red-400'
                } hover:underline`}
              >
                {product.isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
