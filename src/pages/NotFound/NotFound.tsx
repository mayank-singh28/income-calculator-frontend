import React from 'react';
import { Link } from 'wouter';
import { Button } from '../../components/Button/Button';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__content">
          <h1 className="not-found__title">404</h1>
          <h2 className="not-found__subtitle">Page Not Found</h2>
          <p className="not-found__description">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button size="large">
              Go Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;