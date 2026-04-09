import { Link } from 'react-router-dom';
import { APP_TITLE } from '../config';

export default function HomePage() {
  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <h2>{APP_TITLE}</h2>
      <div className="col-md-2">
        <Link to="/calc" className="btn btn-primary w-100 mt-4">계산하기</Link>
      </div>
      <div className="col-md-2">
        <Link to="/db" className="btn btn-secondary w-100 mt-4">캐릭터 입력</Link>
      </div>
      <div className="col-md-2">
        <Link to="/guide" className="btn btn-warning w-100 mt-4">설명서</Link>
      </div>
    </div>
  );
}
