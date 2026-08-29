import React from 'react';
import { useLocation } from 'react-router-dom';
import NotFoundCard from '../components/NotFoundCard';

export default function NotFound() {
  const location = useLocation();
  const attemptedPath = location.pathname.replace(/^\//, '');

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <NotFoundCard
        title="Page or Quiz Not Found"
        message="The page or assessment link you are looking for might have been moved, removed, or does not exist."
        attemptedSlug={attemptedPath}
      />
    </div>
  );
}
