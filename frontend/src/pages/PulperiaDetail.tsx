import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pulperiaApi, reviewApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { ChatBubbleLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function PulperiaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [pulperia, setPulperia] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPulperia();
      fetchReviews();
    }
  }, [id]);

  const fetchPulperia = async () => {
    try {
      const res = await pulperiaApi.getOne(id!);
      setPulperia(res.data);
    } catch (error) {
      toast.error('Error cargando pulpería');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getForPulperia(id!);
      setReviews(res.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleShare = async () => {
    try {
      const res = await pulperiaApi.getShareLinks(id!);
      const shareData = res.data;

      if (navigator.share) {
        await navigator.share({
          title: pulperia.name,
          text: shareData.text,
          url: shareData.url,
        });
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewApi.create(id!, { rating: reviewRating, comment: reviewComment });
      toast.success('Reseña enviada');
      setShowReviewForm(false);
      setReviewComment('');
      fetchPulperia();
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!pulperia) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Pulpería no encontrada</p>
        <Link to="/explorar" className="text-pulpe-red hover:underline mt-2 inline-block">
          Volver a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-64 rounded-xl overflow-hidden">
          {pulperia.imageUrl ? (
            <img
              src={pulperia.imageUrl}
              alt={pulperia.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pulpe-red/20 to-pulpe-gold/20 flex items-center justify-center">
              <div className="w-24 h-24 bg-pulpe-cream rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-pulpe-red rounded-t-xl" />
                <div className="w-6 h-8 bg-pulpe-brown rounded-t-full mt-2" />
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="card -mt-16 mx-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold">{pulperia.name}</h1>
                <span
                  className={`badge ${
                    pulperia.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {pulperia.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-4 h-4 text-pulpe-gold" />
                  <span className="font-medium text-white">{pulperia.rating.toFixed(1)}</span>
                  <span>({pulperia.totalReviews} reseñas)</span>
                </div>

                <div className="flex items-center space-x-1">
                  <ShoppingBagIcon className="w-4 h-4" />
                  <span>{pulperia._count?.products || 0} productos</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 mt-2 text-gray-400">
                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                <span>{pulperia.address}</span>
              </div>

              {pulperia.description && (
                <p className="text-gray-400 mt-3">{pulperia.description}</p>
              )}
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              {pulperia.phone && (
                <a
                  href={`tel:${pulperia.phone}`}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>Llamar</span>
                </a>
              )}

              {pulperia.whatsapp && (
                <a
                  href={`https://wa.me/${pulperia.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                onClick={handleShare}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <section>
        <h2 className="text-xl font-bold mb-4">Productos</h2>
        {pulperia.products?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pulperia.products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={{ ...product, pulperia: { id: pulperia.id, name: pulperia.name, isOpen: pulperia.isOpen } }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Esta pulpería aún no tiene productos</p>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reseñas</h2>
          {user && user.userType === 'CUSTOMER' && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-pulpe-red hover:underline text-sm"
            >
              Escribir reseña
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="card mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Calificación</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                  >
                    <StarIcon
                      className={`w-8 h-8 ${
                        star <= reviewRating ? 'text-pulpe-gold' : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comentario (opcional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Cuenta tu experiencia..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={submittingReview} className="btn-primary">
                {submittingReview ? <span className="spinner" /> : 'Enviar'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-start space-x-3">
                  {review.user.photoUrl ? (
                    <img
                      src={review.user.photoUrl}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-pulpe-red/20 rounded-full flex items-center justify-center">
                      <span className="text-pulpe-red font-bold">
                        {review.user.name[0]}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.user.name}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-pulpe-gold' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-400 mt-2">{review.comment}</p>
                    )}
                    <span className="text-xs text-gray-500 mt-2 block">
                      {new Date(review.createdAt).toLocaleDateString('es-HN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aún no hay reseñas</p>
          </div>
        )}
      </section>
    </div>
  );
}
