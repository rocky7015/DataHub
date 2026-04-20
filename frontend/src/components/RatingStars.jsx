import { useState } from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, count = 0, interactive = false, onRate }) => {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered || Math.round(rating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`transition-all duration-100 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            <Star
              size={interactive ? 20 : 14}
              className={`transition-colors duration-100 ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
      {!interactive && (
        <span className="text-xs text-gray-400">
          {rating > 0 ? `${rating.toFixed(1)} (${count})` : 'No ratings yet'}
        </span>
      )}
      {interactive && hovered > 0 && (
        <span className="text-xs text-yellow-400 font-medium">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hovered]}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
