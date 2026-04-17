import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '../config';

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-3 mt-4">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1">{APP_NAME} v{APP_VERSION}</p>
          </div>
          <div className="col-md-6 text-md-end">
            <Link to="/terms" className="text-light me-3">이용약관</Link>
            <Link to="/privacy" className="text-light me-3">개인정보처리방침</Link>
            <Link to="/info" className="text-light me-3">정보</Link>
            <Link to="/settings" className="text-light">설정</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
