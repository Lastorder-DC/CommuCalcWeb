import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';
import type { MastodonServerInfo } from '../types';

/** 기본 Mastodon SVG 아이콘 */
function MastodonDefaultIcon() {
  return (
    <svg style={{ height: '18px', width: 'auto' }} width="74" height="79" viewBox="0 0 74 79" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M73.7014 17.9592C72.5616 9.62034 65.1774 3.04876 56.424 1.77536C54.9472 1.56019 49.3517 0.7771 36.3901 0.7771H36.2933C23.3281 0.7771 20.5465 1.56019 19.0697 1.77536C10.56 3.01348 2.78877 8.91838 0.903306 17.356C-0.00357857 21.5113 -0.100361 26.1181 0.068112 30.3439C0.308275 36.404 0.354874 42.4535 0.91406 48.489C1.30064 52.498 1.97502 56.4751 2.93215 60.3905C4.72441 67.6217 11.9795 73.6395 19.0876 76.0945C26.6979 78.6548 34.8821 79.0799 42.724 77.3221C43.5866 77.1245 44.4398 76.8953 45.2833 76.6342C47.1867 76.0381 49.4199 75.3714 51.0616 74.2003C51.0841 74.1839 51.1026 74.1627 51.1156 74.1382C51.1286 74.1138 51.1359 74.0868 51.1368 74.0592V68.2108C51.1364 68.185 51.1302 68.1596 51.1185 68.1365C51.1069 68.1134 51.0902 68.0932 51.0695 68.0773C51.0489 68.0614 51.0249 68.0503 50.9994 68.0447C50.9738 68.0391 50.9473 68.0392 50.9218 68.045C45.8976 69.226 40.7491 69.818 35.5836 69.8087C26.694 69.8087 24.3031 65.6569 23.6184 63.9285C23.0681 62.4347 22.7186 60.8764 22.5789 59.2934C22.5775 59.2669 22.5825 59.2403 22.5934 59.216C22.6043 59.1916 22.621 59.1702 22.6419 59.1533C22.6629 59.1365 22.6876 59.1248 22.714 59.1191C22.7404 59.1134 22.7678 59.1139 22.794 59.1206C27.7345 60.2936 32.799 60.8856 37.8813 60.8843C39.1036 60.8843 40.3223 60.8843 41.5447 60.8526C46.6562 60.7115 52.0437 60.454 57.0728 59.4874C57.1983 59.4628 57.3237 59.4416 57.4313 59.4098C65.3638 57.9107 72.9128 53.2051 73.6799 41.2895C73.7086 40.8204 73.7803 36.3758 73.7803 35.889C73.7839 34.2347 74.3216 24.1533 73.7014 17.9592ZM61.4925 47.6918H53.1514V27.5855C53.1514 23.3526 51.3591 21.1938 47.7136 21.1938C43.7061 21.1938 41.6988 23.7476 41.6988 28.7919V39.7974H33.4078V28.7919C33.4078 23.7476 31.3969 21.1938 27.3894 21.1938C23.7654 21.1938 21.9552 23.3526 21.9516 27.5855V47.6918H13.6176V26.9752C13.6176 22.7423 14.7157 19.3795 16.9118 16.8868C19.1772 14.4 22.1488 13.1231 25.8373 13.1231C30.1064 13.1231 33.3325 14.7386 35.4832 17.9662L37.5587 21.3949L39.6377 17.9662C41.7884 14.7386 45.0145 13.1231 49.2765 13.1231C52.9614 13.1231 55.9329 14.4 58.2055 16.8868C60.4017 19.3772 61.4997 22.74 61.4997 26.9752L61.4925 47.6918Z" fill="inherit"/>
    </svg>
  );
}

/** 서버 아이콘 렌더링 (커스텀 URL이 있으면 img, 없으면 기본 SVG) */
function MastodonServerIcon({ server }: { server: MastodonServerInfo }) {
  if (server.iconUrl) {
    return <img src={server.iconUrl} alt={`${server.serverName || 'Mastodon'} icon`} style={{ height: '18px', width: 'auto' }} />;
  }
  return <MastodonDefaultIcon />;
}

export default function MyPage() {
  const { user, logout, refreshUser } = useAuth();
  const { isOnline, xLoginEnabled, mastodonLoginEnabled, mastodonServers } = useConnection();
  const navigate = useNavigate();

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 이메일 변경
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // X 연동
  const [xError, setXError] = useState('');
  const [xSuccess, setXSuccess] = useState('');
  const [xLoading, setXLoading] = useState(false);

  // Mastodon 연동
  const [mastodonError, setMastodonError] = useState('');
  const [mastodonSuccess, setMastodonSuccess] = useState('');
  const [mastodonLoading, setMastodonLoading] = useState(false);

  // 계정 삭제
  const [deleteStep, setDeleteStep] = useState(0); // 0: 초기, 1: 1차 확인, 2: 2차 확인
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const isXUser = user.email?.endsWith('@x.user');

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      await refreshUser();
      setPasswordSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail) {
      setEmailError('새 이메일을 입력해주세요.');
      return;
    }

    setEmailLoading(true);
    try {
      await apiService.changeEmail(newEmail);
      await refreshUser();
      setEmailSuccess('이메일이 변경되었습니다.');
      setNewEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : '이메일 변경에 실패했습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLinkX = async () => {
    setXError('');
    setXSuccess('');
    setXLoading(true);
    try {
      const { authorizeUrl } = await apiService.getXLoginUrl();
      // X 연동 모드임을 localStorage에 저장
      localStorage.setItem('x_link_mode', 'true');
      window.location.href = authorizeUrl;
    } catch (err) {
      setXError(err instanceof Error ? err.message : 'X 연동을 시작할 수 없습니다.');
      setXLoading(false);
    }
  };

  const handleUnlinkX = async () => {
    setXError('');
    setXSuccess('');
    setXLoading(true);
    try {
      await apiService.unlinkXAccount();
      setXSuccess('X 계정 연동이 해제되었습니다.');
      await refreshUser();
    } catch (err) {
      setXError(err instanceof Error ? err.message : 'X 연동 해제에 실패했습니다.');
    } finally {
      setXLoading(false);
    }
  };

  const handleLinkMastodon = async (serverIndex: number) => {
    setMastodonError('');
    setMastodonSuccess('');
    setMastodonLoading(true);
    try {
      const { authorizeUrl } = await apiService.getMastodonLoginUrl(serverIndex);
      localStorage.setItem('mastodon_link_mode', 'true');
      window.location.href = authorizeUrl;
    } catch (err) {
      setMastodonError(err instanceof Error ? err.message : 'Mastodon 연동을 시작할 수 없습니다.');
      setMastodonLoading(false);
    }
  };

  const handleUnlinkMastodon = async () => {
    setMastodonError('');
    setMastodonSuccess('');
    setMastodonLoading(true);
    try {
      await apiService.unlinkMastodonAccount();
      setMastodonSuccess('Mastodon 계정 연동이 해제되었습니다.');
      await refreshUser();
    } catch (err) {
      setMastodonError(err instanceof Error ? err.message : 'Mastodon 연동 해제에 실패했습니다.');
    } finally {
      setMastodonLoading(false);
    }
  };

  // X 연동 해제 가능 여부: 비밀번호 또는 Mastodon 연동이 있어야 함
  const canUnlinkX = user.hasPassword || user.mastodonLinked;
  // Mastodon 연동 해제 가능 여부: 비밀번호 또는 X 연동이 있어야 함
  const canUnlinkMastodon = user.hasPassword || user.xLinked;

  const handleDeleteAccount = async () => {
    if (deleteStep < 2) {
      setDeleteStep(deleteStep + 1);
      return;
    }

    setDeleteError('');
    setDeleteLoading(true);
    try {
      await apiService.deleteAccount();
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-md-8">
        <h2>마이페이지</h2>

        {/* 계정 정보 */}
        <div className="card mb-3">
          <div className="card-header"><strong>계정 정보</strong></div>
          <div className="card-body">
            <div className="mb-2">
              <strong>닉네임:</strong> {user.username}
            </div>
            <div className="mb-2">
              <strong>이메일:</strong> {isXUser ? <span className="text-muted">미설정 (X 로그인 계정)</span> : user.email}
            </div>
            <div className="mb-2">
              <strong>비밀번호:</strong> {user.hasPassword ? '설정됨' : <span className="text-muted">미설정</span>}
            </div>
            <div className="mb-2">
              <strong>X 연동:</strong> {user.xLinked ? <span className="badge bg-success">연동됨</span> : <span className="badge bg-secondary">미연동</span>}
            </div>
            <div>
              <strong>Mastodon 연동:</strong> {user.mastodonLinked ? <span className="badge bg-success">연동됨</span> : <span className="badge bg-secondary">미연동</span>}
            </div>
          </div>
        </div>

        {/* 이메일 변경 (X 로그인 사용자 또는 일반 사용자) */}
        <div className="card mb-3">
          <div className="card-header"><strong>{isXUser ? '이메일 설정' : '이메일 변경'}</strong></div>
          <div className="card-body">
            {emailError && <div className="alert alert-danger py-2">{emailError}</div>}
            {emailSuccess && <div className="alert alert-success py-2">{emailSuccess}</div>}
            <form onSubmit={handleEmailChange}>
              <div className="mb-3">
                <label htmlFor="newEmail" className="form-label">
                  {isXUser ? '이메일 주소' : '새 이메일 주소'}
                </label>
                <input
                  id="newEmail"
                  type="email"
                  className="form-control"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  disabled={!isOnline || emailLoading}
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isOnline || emailLoading}
              >
                {emailLoading ? '변경 중...' : (isXUser ? '이메일 설정' : '이메일 변경')}
              </button>
            </form>
          </div>
        </div>

        {/* 비밀번호 변경/설정 */}
        <div className="card mb-3">
          <div className="card-header"><strong>{user.hasPassword ? '비밀번호 변경' : '비밀번호 설정'}</strong></div>
          <div className="card-body">
            {passwordError && <div className="alert alert-danger py-2">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success py-2">{passwordSuccess}</div>}
            <form onSubmit={handlePasswordChange}>
              {user.hasPassword && (
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">현재 비밀번호</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    disabled={!isOnline || passwordLoading}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">
                  {user.hasPassword ? '새 비밀번호' : '비밀번호'}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!isOnline || passwordLoading}
                  autoComplete="new-password"
                />
                <div className="form-text">8자 이상 입력해주세요.</div>
              </div>
              <div className="mb-3">
                <label htmlFor="newPasswordConfirm" className="form-label">
                  {user.hasPassword ? '새 비밀번호 확인' : '비밀번호 확인'}
                </label>
                <input
                  id="newPasswordConfirm"
                  type="password"
                  className="form-control"
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e.target.value)}
                  required
                  disabled={!isOnline || passwordLoading}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isOnline || passwordLoading}
              >
                {passwordLoading ? '처리 중...' : (user.hasPassword ? '비밀번호 변경' : '비밀번호 설정')}
              </button>
            </form>
          </div>
        </div>

        {/* X 계정 연동 */}
        {xLoginEnabled && (
          <div className="card mb-3">
            <div className="card-header"><strong>X 계정 연동</strong></div>
            <div className="card-body">
              {xError && <div className="alert alert-danger py-2">{xError}</div>}
              {xSuccess && <div className="alert alert-success py-2">{xSuccess}</div>}
              {user.xLinked ? (
                <div>
                  <p className="mb-2">X 계정이 연동되어 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleUnlinkX}
                    disabled={!isOnline || xLoading || !canUnlinkX}
                  >
                    {xLoading ? '처리 중...' : 'X 연동 해제'}
                  </button>
                  {!canUnlinkX && (
                    <div className="form-text text-warning mt-2">
                      비밀번호를 먼저 설정하거나 다른 로그인 수단을 연동해야 X 연동을 해제할 수 있습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2">X 계정을 연동하면 X 계정으로도 로그인할 수 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-dark d-flex align-items-center gap-2"
                    onClick={handleLinkX}
                    disabled={!isOnline || xLoading}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {xLoading ? '연동 중...' : 'X 계정 연동'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mastodon 계정 연동 */}
        {mastodonLoginEnabled && (
          <div className="card mb-3">
            <div className="card-header"><strong>Mastodon 계정 연동</strong></div>
            <div className="card-body">
              {mastodonError && <div className="alert alert-danger py-2">{mastodonError}</div>}
              {mastodonSuccess && <div className="alert alert-success py-2">{mastodonSuccess}</div>}
              {user.mastodonLinked ? (
                <div>
                  <p className="mb-2">Mastodon 계정이 연동되어 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleUnlinkMastodon}
                    disabled={!isOnline || mastodonLoading || !canUnlinkMastodon}
                  >
                    {mastodonLoading ? '처리 중...' : 'Mastodon 연동 해제'}
                  </button>
                  {!canUnlinkMastodon && (
                    <div className="form-text text-warning mt-2">
                      비밀번호를 먼저 설정하거나 다른 로그인 수단을 연동해야 Mastodon 연동을 해제할 수 있습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Mastodon 계정을 연동하면 Mastodon 계정으로도 로그인할 수 있습니다.</p>
                  {mastodonServers.map((server) => (
                    <button
                      key={server.index}
                      type="button"
                      className="btn d-flex align-items-center gap-2 mb-2"
                      style={{ backgroundColor: '#6364FF', color: '#fff', borderColor: '#6364FF' }}
                      onClick={() => handleLinkMastodon(server.index)}
                      disabled={!isOnline || mastodonLoading}
                    >
                      <MastodonServerIcon server={server} />
                      {mastodonLoading ? '연동 중...' : (server.serverName ? `${server.serverName} 연동` : 'Mastodon 계정 연동')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 계정 삭제 */}
        <div className="card mb-3 border-danger">
          <div className="card-header text-danger"><strong>계정 삭제</strong></div>
          <div className="card-body">
            {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}
            <p className="text-danger mb-2">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>

            {deleteStep === 0 && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDeleteAccount}
                disabled={!isOnline || deleteLoading}
              >
                계정 삭제
              </button>
            )}

            {deleteStep === 1 && (
              <div>
                <p className="fw-bold text-danger">정말로 계정을 삭제하시겠습니까?</p>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleDeleteAccount}
                  disabled={!isOnline || deleteLoading}
                >
                  네, 삭제합니다
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteStep(0)}
                >
                  취소
                </button>
              </div>
            )}

            {deleteStep === 2 && (
              <div>
                <p className="fw-bold text-danger">마지막 확인입니다. 계정 삭제 후에는 복구할 수 없습니다. 정말로 삭제하시겠습니까?</p>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleDeleteAccount}
                  disabled={!isOnline || deleteLoading}
                >
                  {deleteLoading ? '삭제 중...' : '네, 영구적으로 삭제합니다'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteStep(0)}
                  disabled={deleteLoading}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
